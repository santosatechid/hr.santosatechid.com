import { type NextRequest, NextResponse } from "next/server";

import {
  parseIsoDate,
  resolveSelf,
  workDateFor,
} from "@/services/hris/attendanceServer";
import { notifyRequestSubmitted } from "@/services/notifications/notify";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const rows = await prisma.attendanceCorrectionRequest.findMany({
    where: { userDataId: self.userDataId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const body = (await request.json()) as {
    date?: unknown;
    checkInAt?: unknown;
    checkOutAt?: unknown;
    reason?: unknown;
  };

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "Tulis alasan minimal 5 karakter." },
      { status: 400 },
    );
  }

  const date =
    typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? new Date(`${body.date}T00:00:00.000Z`)
      : null;
  if (!date || !Number.isFinite(date.getTime())) {
    return NextResponse.json({ error: "Tanggal absensi tidak valid." }, { status: 400 });
  }

  const requestedCheckInAt = parseIsoDate(body.checkInAt);
  const requestedCheckOutAt = parseIsoDate(body.checkOutAt);
  if (!requestedCheckInAt) {
    return NextResponse.json({ error: "Isi jam masuk yang benar." }, { status: 400 });
  }
  if (requestedCheckOutAt && requestedCheckOutAt <= requestedCheckInAt) {
    return NextResponse.json(
      { error: "Jam pulang harus setelah jam masuk." },
      { status: 400 },
    );
  }

  const workDate = workDateFor(date);
  const [existing, pending] = await Promise.all([
    prisma.attendanceRecord.findUnique({
      where: { userDataId_workDate: { userDataId: self.userDataId, workDate } },
      select: { checkInAt: true, checkOutAt: true },
    }),
    prisma.attendanceCorrectionRequest.findFirst({
      where: {
        userDataId: self.userDataId,
        workDate,
        status: "pending",
      },
      select: { id: true },
    }),
  ]);
  if (pending) {
    return NextResponse.json(
      { error: "Sudah ada pengajuan koreksi untuk tanggal ini." },
      { status: 409 },
    );
  }

  const { userData, ...created } = await prisma.attendanceCorrectionRequest.create({
    include: { userData: { select: { name: true } } },
    data: {
      userDataId: self.userDataId,
      clientId: self.clientId,
      workDate,
      originalCheckInAt: existing?.checkInAt ?? null,
      originalCheckOutAt: existing?.checkOutAt ?? null,
      requestedCheckInAt,
      requestedCheckOutAt: requestedCheckOutAt ?? null,
      reason,
    },
  });

  await notifyRequestSubmitted({
    clientId: self.clientId,
    requesterUserDataId: self.userDataId,
    requesterName: userData.name,
    kind: "correction",
    summary: `Koreksi absensi ${body.date}`,
  });

  return NextResponse.json(created, { status: 201 });
}
