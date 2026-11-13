import { type NextRequest, NextResponse } from "next/server";

import { canDecideFor, roleLevel } from "@/services/hris/access";
import { transitionRequest, type RequestStatus } from "@/services/hris/requests";
import { notifyRequestDecided } from "@/services/notifications/notify";
import { clientForbidden, resolveApproverClient } from "@/services/clients";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const t = await resolveApproverClient(request);
  if (!t.ok) return t.response;

  const me = await prisma.userData.findFirst({
    where: { userId: t.userId, clientId: t.clientId },
    select: { role: { select: { name: true } } },
  });
  const myLevel = roleLevel(me?.role?.name);

  const [corrections, leaves] = await Promise.all([
    prisma.attendanceCorrectionRequest.findMany({
      where: { clientId: t.clientId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        userData: {
          select: { id: true, name: true, role: { select: { name: true } } },
        },
        reviewer: { select: { name: true } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { clientId: t.clientId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        userData: {
          select: { id: true, name: true, role: { select: { name: true } } },
        },
        reviewer: { select: { name: true } },
      },
    }),
  ]);

  // Supervisor & manager hanya melihat pengajuan jenjang di bawahnya.
  const belowMe = <T extends { userData: { role: { name: string } | null } }>(
    rows: T[],
  ) =>
    myLevel >= 4
      ? rows
      : rows.filter((row) => canDecideFor(me?.role?.name, row.userData.role?.name));

  return NextResponse.json({ corrections: belowMe(corrections), leaves: belowMe(leaves) });
}

export async function POST(request: NextRequest) {
  const t = await resolveApproverClient(request);
  if (!t.ok) return t.response;

  try {
    const body = (await request.json()) as {
      type?: unknown;
      id?: unknown;
      decision?: unknown;
      note?: unknown;
    };
    const id = typeof body.id === "string" ? body.id : "";
    const decision =
      body.decision === "approve"
        ? "approve"
        : body.decision === "reject"
          ? "reject"
          : null;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!id || !decision) {
      return NextResponse.json(
        { error: "ID dan keputusan wajib diisi" },
        { status: 400 },
      );
    }

    const reviewer = await prisma.userData.findFirst({
      where: { userId: t.userId, clientId: t.clientId },
      select: { id: true, role: { select: { name: true } } },
    });

    const now = new Date();

    if (body.type === "correction") {
      const correction = await prisma.attendanceCorrectionRequest.findFirst({
        where: { id, clientId: t.clientId },
        include: {
          userData: {
            select: {
              id: true,
              branchId: true,
              role: { select: { name: true } },
            },
          },
        },
      });
      if (!correction) return clientForbidden("Pengajuan tidak ditemukan");
      if (!canDecideFor(reviewer?.role?.name, correction.userData.role?.name)) {
        return clientForbidden("Pengajuan ini bukan bawahan kamu");
      }

      const transition = transitionRequest(
        correction.status as RequestStatus,
        decision,
      );
      if (!transition.ok) {
        return NextResponse.json(
          { error: "Pengajuan ini sudah diputuskan." },
          { status: 409 },
        );
      }

      if (transition.status === "approved") {
        if (!correction.userData.branchId) {
          return NextResponse.json(
            {
              error:
                "Karyawan ini belum punya cabang. Set cabang dulu sebelum menyetujui koreksi.",
            },
            { status: 409 },
          );
        }
        await prisma.attendanceRecord.upsert({
          where: {
            userDataId_workDate: {
              userDataId: correction.userDataId,
              workDate: correction.workDate,
            },
          },
          create: {
            userDataId: correction.userDataId,
            clientId: t.clientId,
            branchId: correction.userData.branchId,
            workDate: correction.workDate,
            checkInAt: correction.requestedCheckInAt,
            checkOutAt: correction.requestedCheckOutAt,
            method: "manual",
          },
          update: {
            checkInAt: correction.requestedCheckInAt,
            checkOutAt: correction.requestedCheckOutAt,
            method: "manual",
          },
        });
      }

      const updated = await prisma.attendanceCorrectionRequest.update({
        where: { id },
        data: {
          status: transition.status,
          reviewerId: reviewer?.id ?? null,
          responseNote: note || null,
          reviewedAt: now,
        },
      });

      await notifyRequestDecided({
        clientId: t.clientId,
        requesterUserDataId: correction.userDataId,
        reviewerUserDataId: reviewer?.id ?? null,
        reviewerRoleName: reviewer?.role?.name ?? null,
        kind: "correction",
        approved: transition.status === "approved",
        note,
      });

      return NextResponse.json(updated);
    }

    if (body.type === "leave") {
      const leave = await prisma.leaveRequest.findFirst({
        where: { id, clientId: t.clientId },
        select: {
          id: true,
          status: true,
          userDataId: true,
          userData: { select: { role: { select: { name: true } } } },
        },
      });
      if (!leave) return clientForbidden("Pengajuan tidak ditemukan");
      if (!canDecideFor(reviewer?.role?.name, leave.userData.role?.name)) {
        return clientForbidden("Pengajuan ini bukan bawahan kamu");
      }

      const transition = transitionRequest(leave.status as RequestStatus, decision);
      if (!transition.ok) {
        return NextResponse.json(
          { error: "Pengajuan ini sudah diputuskan." },
          { status: 409 },
        );
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: transition.status,
          reviewerId: reviewer?.id ?? null,
          responseNote: note || null,
          reviewedAt: now,
        },
      });

      await notifyRequestDecided({
        clientId: t.clientId,
        requesterUserDataId: leave.userDataId,
        reviewerUserDataId: reviewer?.id ?? null,
        reviewerRoleName: reviewer?.role?.name ?? null,
        kind: "leave",
        approved: transition.status === "approved",
        note,
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Jenis pengajuan tidak dikenal" },
      { status: 400 },
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}
