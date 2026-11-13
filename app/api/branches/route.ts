import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveAdminClient, clientForbidden } from "@/services/clients";
import { type NextRequest, NextResponse } from "next/server";

function parseGeofence(input: {
  latitude?: unknown;
  longitude?: unknown;
  radiusMeters?: unknown;
  bpjsWageFloor?: unknown;
}) {
  const hasAny = [input.latitude, input.longitude, input.radiusMeters].some(
    (value) => value !== undefined && value !== null && value !== "",
  );
  const floorRaw = input.bpjsWageFloor;
  const bpjsWageFloor =
    floorRaw === undefined || floorRaw === null || floorRaw === ""
      ? null
      : Number(floorRaw);
  if (
    bpjsWageFloor !== null &&
    (!Number.isInteger(bpjsWageFloor) || bpjsWageFloor < 0)
  ) {
    return null;
  }
  if (!hasAny) {
    return { latitude: null, longitude: null, radiusMeters: null, bpjsWageFloor };
  }

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const radiusMeters = Number(input.radiusMeters);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !Number.isInteger(radiusMeters) || radiusMeters < 20 || radiusMeters > 5000
  ) {
    return null;
  }
  return { latitude, longitude, radiusMeters, bpjsWageFloor };
}

/**
 * Pola kerja per lokasi (PRD §7.4 langkah 2B). Semua field opsional; yang
 * tidak dikirim memakai default kolom.
 */
function parseWorkHours(input: {
  workDaysPerWeek?: unknown;
  workStartMinute?: unknown;
  workEndMinute?: unknown;
  lateToleranceMinutes?: unknown;
}) {
  const workDaysPerWeek =
    input.workDaysPerWeek === undefined || input.workDaysPerWeek === null
      ? 5
      : Number(input.workDaysPerWeek);
  const workStartMinute = Number(input.workStartMinute ?? 480);
  const workEndMinute = Number(input.workEndMinute ?? 1020);
  const lateToleranceMinutes = Number(input.lateToleranceMinutes ?? 15);

  const isMinute = (value: number) =>
    Number.isInteger(value) && value >= 0 && value <= 1439;

  if (workDaysPerWeek !== 5 && workDaysPerWeek !== 6) return null;
  if (!isMinute(workStartMinute) || !isMinute(workEndMinute)) return null;
  if (workEndMinute <= workStartMinute) return null;
  if (
    !Number.isInteger(lateToleranceMinutes) ||
    lateToleranceMinutes < 0 ||
    lateToleranceMinutes > 120
  ) {
    return null;
  }
  return {
    workDaysPerWeek,
    workStartMinute,
    workEndMinute,
    lateToleranceMinutes,
  };
}

export async function GET(request: NextRequest) {
  const t = await resolveAdminClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  try {
    const branches = await prisma.branch.findMany({
      where: { clientId: t.clientId },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(branches);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Kode cabang tidak lagi diisi di UI. Turunkan dari nama, lalu pastikan unik
 * per client (constraint [clientId, code]).
 */
async function resolveBranchCode(
  clientId: string | null,
  name: string,
  requested?: unknown,
) {
  const base =
    typeof requested === "string" && requested.trim()
      ? requested.trim().toUpperCase()
      : name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 10) || "BRANCH";

  const taken = new Set(
    (
      await prisma.branch.findMany({
        where: { clientId, code: { startsWith: base } },
        select: { code: true },
      })
    ).map((b) => b.code),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base.slice(0, 8)}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base.slice(0, 6)}${Date.now().toString().slice(-4)}`;
}

export async function POST(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { code, name, description, address, phone, adminName, signatureUrl, isActive, latitude, longitude, radiusMeters, bpjsWageFloor, workDaysPerWeek, workStartMinute, workEndMinute, lateToleranceMinutes } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    const geofence = parseGeofence({ latitude, longitude, radiusMeters, bpjsWageFloor });
    if (!geofence) {
      return NextResponse.json(
        { error: "Lokasi dan radius cabang tidak valid" },
        { status: 400 },
      );
    }

    const workHours = parseWorkHours({
      workDaysPerWeek,
      workStartMinute,
      workEndMinute,
      lateToleranceMinutes,
    });
    if (!workHours) {
      return NextResponse.json(
        { error: "Jam kerja tidak valid. Pastikan jam pulang setelah jam masuk." },
        { status: 400 },
      );
    }

    const branch = await prisma.branch.create({
      data: {
        code: await resolveBranchCode(t.clientId, name, code),
        name,
        description,
        address,
        phone,
        adminName,
        signatureUrl,
        isActive: isActive ?? true,
        ...geofence,
        ...workHours,
        clientId: t.clientId,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { id, code, name, description, address, phone, adminName, signatureUrl, isActive, latitude, longitude, radiusMeters, bpjsWageFloor, workDaysPerWeek, workStartMinute, workEndMinute, lateToleranceMinutes } =
      await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 },
      );
    }

    const geofence = parseGeofence({ latitude, longitude, radiusMeters, bpjsWageFloor });
    if (!geofence) {
      return NextResponse.json(
        { error: "Lokasi dan radius cabang tidak valid" },
        { status: 400 },
      );
    }

    const workHours = parseWorkHours({
      workDaysPerWeek,
      workStartMinute,
      workEndMinute,
      lateToleranceMinutes,
    });
    if (!workHours) {
      return NextResponse.json(
        { error: "Jam kerja tidak valid. Pastikan jam pulang setelah jam masuk." },
        { status: 400 },
      );
    }

    const owned = await prisma.branch.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, description, address, phone, adminName, signatureUrl, isActive, ...geofence, ...workHours, ...(code ? { code } : {}) },
    });

    return NextResponse.json(branch);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const owned = await prisma.branch.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true, _count: { select: { attendanceRecords: true, users: true } } },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }
    if (owned._count.attendanceRecords > 0 || owned._count.users > 0) {
      return NextResponse.json(
        {
          error:
            "Cabang ini sudah dipakai karyawan atau punya riwayat absensi. Nonaktifkan saja agar riwayat tetap aman.",
        },
        { status: 409 },
      );
    }

    const branch = await prisma.branch.delete({ where: { id } });
    return NextResponse.json(branch);
  } catch (error) {
    return handlePrismaError(error);
  }
}
