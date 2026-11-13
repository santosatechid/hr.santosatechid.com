import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const records = await prisma.attendanceRecord.findMany({
    where: { userDataId: self.userDataId },
    orderBy: { workDate: "desc" },
    take: 60,
    select: {
      id: true,
      workDate: true,
      checkInAt: true,
      checkOutAt: true,
      method: true,
      branch: { select: { name: true } },
    },
  });

  return NextResponse.json(records);
}
