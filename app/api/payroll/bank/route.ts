import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { clientForbidden, resolveClient } from "@/services/clients";
import { type NextRequest, NextResponse } from "next/server";

const bankFields = {
  id: true,
  employeeId: true,
  name: true,
  isActive: true,
  bankName: true,
  bankAccount: true,
  bankAccountHolder: true,
} as const;

type BankRowInput = {
  id: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountHolder?: string | null;
};

export async function GET(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const rows = await prisma.userData.findMany({
      where: { clientId: t.clientId },
      select: bankFields,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { rows } = (await request.json()) as { rows?: BankRowInput[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "rows wajib diisi" }, { status: 400 });
    }

    const ids = [...new Set(rows.map((row) => row.id))];
    const owned = await prisma.userData.count({
      where: { id: { in: ids }, clientId: t.clientId },
    });
    if (owned !== ids.length) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    await prisma.$transaction(
      rows.map((row) =>
        prisma.userData.update({
          where: { id: row.id },
          data: {
            bankName: row.bankName?.trim() || null,
            bankAccount: row.bankAccount?.trim() || null,
            bankAccountHolder: row.bankAccountHolder?.trim() || null,
          },
        }),
      ),
    );

    return NextResponse.json({ updated: rows.length });
  } catch (error) {
    return handlePrismaError(error);
  }
}
