import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import { notifyRequestSubmitted } from "@/services/notifications/notify";
import { prisma } from "@/services/prisma";

const LEAVE_TYPES: Record<string, true> = {
  "Cuti tahunan": true,
  Izin: true,
  Sakit: true,
};

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const rows = await prisma.leaveRequest.findMany({
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
    leaveType?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    reason?: unknown;
  };

  const leaveType = typeof body.leaveType === "string" ? body.leaveType : "";
  if (!LEAVE_TYPES[leaveType]) {
    return NextResponse.json({ error: "Jenis pengajuan tidak dikenal." }, { status: 400 });
  }

  const start =
    typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
      ? new Date(`${body.startDate}T00:00:00.000Z`)
      : null;
  const end =
    typeof body.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate)
      ? new Date(`${body.endDate}T00:00:00.000Z`)
      : null;
  if (!start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return NextResponse.json({ error: "Tanggal pengajuan tidak valid." }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json(
      { error: "Tanggal selesai harus setelah tanggal mulai." },
      { status: 400 },
    );
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "Tulis alasan minimal 5 karakter." },
      { status: 400 },
    );
  }

  const { userData, ...created } = await prisma.leaveRequest.create({
    data: {
      userDataId: self.userDataId,
      clientId: self.clientId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
    },
    include: { userData: { select: { name: true } } },
  });

  await notifyRequestSubmitted({
    clientId: self.clientId,
    requesterUserDataId: self.userDataId,
    requesterName: userData.name,
    kind: "leave",
    summary: `${leaveType}, ${body.startDate} s/d ${body.endDate}`,
  });

  return NextResponse.json(created, { status: 201 });
}
