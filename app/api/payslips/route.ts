import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  try {
    const slips = await prisma.payslip.findMany({
      where: {
        userDataId: self.userDataId,
        run: { status: "published" },
      },
      orderBy: { period: "desc" },
      take: 24,
      select: {
        id: true,
        period: true,
        gross: true,
        taxAllowance: true,
        pph21: true,
        jkn: true,
        jht: true,
        jp: true,
        netPay: true,
        breakdown: true,
        run: { select: { publishedAt: true } },
      },
    });
    return NextResponse.json(slips);
  } catch (error) {
    return handlePrismaError(error);
  }
}
