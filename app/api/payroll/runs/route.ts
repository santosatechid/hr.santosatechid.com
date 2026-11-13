import type { Prisma } from "@/prisma/generated/client";
import { type NextRequest, NextResponse } from "next/server";

import {
  bpjsEmployeeDeductions,
  employeeTakeHome,
  grossUpPph21,
  pph21ForPeriod,
  type PeriodTaxInput,
} from "@/services/hris/payroll";
import { clientForbidden, resolveAdminClient } from "@/services/clients";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

const PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

type Issue = { employee: string; message: string };

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const monthRange = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end, month };
};

export async function GET(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  const period = request.nextUrl.searchParams.get("period");

  try {
    if (period) {
      if (!PERIOD_PATTERN.test(period)) {
        return NextResponse.json({ error: "Periode harus YYYY-MM" }, { status: 400 });
      }
      const run = await prisma.payrollRun.findUnique({
        where: { clientId_period: { clientId: t.clientId, period } },
        include: {
          slips: {
            orderBy: { netPay: "desc" },
            include: { userData: { select: { name: true, employeeId: true } } },
          },
        },
      });
      return NextResponse.json({ run, slips: run?.slips ?? [] });
    }

    const runs = await prisma.payrollRun.findMany({
      where: { clientId: t.clientId },
      orderBy: { period: "desc" },
      take: 24,
      select: {
        id: true,
        period: true,
        status: true,
        totalGross: true,
        totalNet: true,
        publishedAt: true,
        _count: { select: { slips: true } },
      },
    });
    return NextResponse.json(runs);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const body = (await request.json()) as { period?: unknown };
    const period = typeof body.period === "string" ? body.period : "";
    if (!PERIOD_PATTERN.test(period)) {
      return NextResponse.json({ error: "Periode harus YYYY-MM" }, { status: 400 });
    }

    const existing = await prisma.payrollRun.findUnique({
      where: { clientId_period: { clientId: t.clientId, period } },
      select: { id: true, status: true },
    });
    if (existing?.status === "published") {
      return NextResponse.json(
        { error: "Payroll periode ini sudah dipublikasikan dan tidak bisa dihitung ulang." },
        { status: 409 },
      );
    }

    const { start, end, month } = monthRange(period);
    const year = period.slice(0, 4);

    const [employees, ytdSlips] = await Promise.all([
      prisma.userData.findMany({
        where: { clientId: t.clientId, isActive: true },
        select: {
          id: true,
          name: true,
          basicSalary: true,
          salaryType: true,
          ptkpStatus: true,
          taxMethod: true,
          taxSalary: true,
          employeeTaxStatus: true,
          taxEnabled: true,
          bpjsEnabled: true,
          bpjsKesehatanFamily: true,
          branch: { select: { id: true, name: true, bpjsWageFloor: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.payslip.findMany({
        where: {
          clientId: t.clientId,
          period: { startsWith: `${year}-`, lt: period },
          run: { status: "published" },
        },
        select: { userDataId: true, period: true, gross: true, pph21: true, jht: true, jp: true },
      }),
    ]);

    const issues: Issue[] = [];
    const skipped: Issue[] = [];
    const rows: {
      userDataId: string;
      gross: number;
      taxAllowance: number;
      pph21: number;
      jkn: number;
      jht: number;
      jp: number;
      netPay: number;
      breakdown: Record<string, unknown>;
    }[] = [];

    const attendanceCounts = await prisma.attendanceRecord.groupBy({
      by: ["userDataId"],
      where: {
        clientId: t.clientId,
        workDate: { gte: start, lt: end },
        checkInAt: { not: null },
      },
      _count: { _all: true },
    });
    const daysPresent = new Map(
      attendanceCounts.map((row) => [row.userDataId, row._count._all]),
    );

    for (const employee of employees) {
      const basicSalary = toNumber(employee.basicSalary);
      if (basicSalary === null) {
        skipped.push({
          employee: employee.name,
          message: "gaji pokok belum diisi, dilewati",
        });
        continue;
      }

      const days = daysPresent.get(employee.id) ?? 0;
      const gross =
        employee.salaryType === "Daily" ? basicSalary * days : basicSalary;
      if (employee.salaryType === "Daily" && days === 0) {
        issues.push({
          employee: employee.name,
          message: "gaji harian tapi belum ada absensi masuk di periode ini",
        });
        continue;
      }

      const ptkpStatus = employee.ptkpStatus ?? "";
      if (employee.taxEnabled && !ptkpStatus) {
        issues.push({ employee: employee.name, message: "status PTKP belum diisi" });
        continue;
      }
      if (employee.bpjsEnabled && !employee.branch?.bpjsWageFloor) {
        issues.push({
          employee: employee.name,
          message: "batas upah BPJS cabang belum diisi",
        });
        continue;
      }

      const prior = ytdSlips.filter((slip) => slip.userDataId === employee.id);
      const ytdGross = prior.reduce((sum, slip) => sum + Number(slip.gross), 0);
      const ytdTax = prior.reduce((sum, slip) => sum + Number(slip.pph21), 0);
      const ytdPension = prior.reduce(
        (sum, slip) => sum + Number(slip.jht) + Number(slip.jp),
        0,
      );

      const baseTaxInput: PeriodTaxInput = {
        period,
        employeeTaxStatus: employee.employeeTaxStatus ?? "",
        salaryType: employee.salaryType,
        taxSalary: employee.taxEnabled ? employee.taxSalary : "Non taxable",
        ptkpStatus: ptkpStatus as PeriodTaxInput["ptkpStatus"],
        gross,
        dailyGross: employee.salaryType === "Daily" ? basicSalary : undefined,
        daysWorked: employee.salaryType === "Daily" ? days : undefined,
        yearToDateGross: ytdGross,
        yearToDateTaxPaid: ytdTax,
        yearToDatePensionDeductions: ytdPension,
      };

      const taxMethod = employee.taxMethod ?? "Gross";
      let taxAllowance = 0;
      let pph21: number;
      try {
        if (taxMethod === "Gross Up") {
          taxAllowance = grossUpPph21(gross, (taxableGross) =>
            pph21ForPeriod({ ...baseTaxInput, gross: taxableGross }),
          );
          pph21 = pph21ForPeriod({ ...baseTaxInput, gross: gross + taxAllowance });
        } else {
          pph21 = pph21ForPeriod(baseTaxInput);
        }
      } catch (error) {
        issues.push({
          employee: employee.name,
          message: error instanceof Error ? error.message : "pajak gagal dihitung",
        });
        continue;
      }

      const bpjs = bpjsEmployeeDeductions({
        period,
        wage: gross + taxAllowance,
        branchWageFloor: employee.branch?.bpjsWageFloor ?? null,
        additionalFamilyMembers: employee.bpjsEnabled
          ? Number(employee.bpjsKesehatanFamily ?? 0) || 0
          : 0,
        enabled: employee.bpjsEnabled,
      });
      const bpjsTotal = bpjs.jkn + bpjs.jht + bpjs.jp;
      const netPay = employeeTakeHome({
        gross,
        pph21,
        bpjs: bpjsTotal,
        taxMethod,
        taxAllowance,
      });

      rows.push({
        userDataId: employee.id,
        gross,
        taxAllowance,
        pph21,
        ...bpjs,
        netPay,
        breakdown: {
          employeeName: employee.name,
          branch: employee.branch?.name ?? null,
          month,
          taxMethod,
          taxStatus: employee.employeeTaxStatus ?? null,
          ptkpStatus: ptkpStatus || null,
          daysWorked: employee.salaryType === "Daily" ? days : null,
          jknWageFloor: employee.branch?.bpjsWageFloor ?? null,
        },
      });
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          error: `Data belum lengkap: ${issues
            .slice(0, 4)
            .map((issue) => `${issue.employee} (${issue.message})`)
            .join(", ")}`,
          issues,
        },
        { status: 422 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Belum ada karyawan bergaji yang bisa dihitung. Isi gaji pokok di profil karyawan.",
          skipped,
        },
        { status: 422 },
      );
    }

    const createdBy = await prisma.userData.findFirst({
      where: { userId: t.userId, clientId: t.clientId },
      select: { id: true },
    });
    const totalGross = rows.reduce((sum, row) => sum + row.gross, 0);
    const totalNet = rows.reduce((sum, row) => sum + row.netPay, 0);

    const run = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.payrollRun.update({
            where: { id: existing.id },
            data: { totalGross, totalNet, status: "draft" },
          })
        : await tx.payrollRun.create({
            data: {
              clientId: t.clientId,
              period,
              createdById: createdBy?.id ?? null,
              totalGross,
              totalNet,
            },
          });

      await tx.payslip.deleteMany({ where: { runId: saved.id } });
      await tx.payslip.createMany({
        data: rows.map((row) => ({
          runId: saved.id,
          userDataId: row.userDataId,
          clientId: t.clientId,
          period,
          gross: row.gross,
          taxAllowance: row.taxAllowance,
          pph21: row.pph21,
          jkn: row.jkn,
          jht: row.jht,
          jp: row.jp,
          netPay: row.netPay,
          breakdown: row.breakdown as Prisma.InputJsonValue,
        })),
      });
      return saved;
    });

    return NextResponse.json(
      { run, slips: rows.length, skipped },
      { status: 201 },
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const body = (await request.json()) as { id?: unknown; action?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    if (!id || body.action !== "publish") {
      return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
    }

    const run = await prisma.payrollRun.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true, status: true, _count: { select: { slips: true } } },
    });
    if (!run) return clientForbidden("Payroll tidak ditemukan di client ini");
    if (run.status === "published") {
      return NextResponse.json({ error: "Payroll ini sudah dipublikasikan." }, { status: 409 });
    }
    if (run._count.slips === 0) {
      return NextResponse.json(
        { error: "Belum ada slip yang dihitung untuk periode ini." },
        { status: 409 },
      );
    }

    const published = await prisma.payrollRun.update({
      where: { id },
      data: { status: "published", publishedAt: new Date() },
    });
    return NextResponse.json(published);
  } catch (error) {
    return handlePrismaError(error);
  }
}
