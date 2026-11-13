import { type NextRequest, NextResponse } from "next/server";

import { transitionAttendance } from "@/services/hris/attendance";
import {
  resolveSelf,
  workDateFor,
} from "@/services/hris/attendanceServer";
import { isWithinGeofence } from "@/services/hris/geofence";
import { prisma } from "@/services/prisma";

const MAX_ACCURACY_METERS = 100;

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const [branch, enrollment] = await Promise.all([
    self.branchId
      ? prisma.branch.findFirst({
          where: { id: self.branchId, clientId: self.clientId },
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,
          },
        })
      : null,
    prisma.faceEnrollment.findUnique({
      where: { userDataId: self.userDataId },
      select: { id: true },
    }),
  ]);

  const workDate = workDateFor(new Date());
  const today = await prisma.attendanceRecord.findUnique({
    where: {
      userDataId_workDate: { userDataId: self.userDataId, workDate },
    },
  });

  return NextResponse.json({
    date: workDate.toISOString().slice(0, 10),
    today,
    branch,
    hasFace: Boolean(enrollment),
  });
}

export async function POST(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const body = (await request.json()) as {
    action?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    accuracy?: unknown;
  };

  const action = body.action;
  if (action !== "check-in" && action !== "check-out") {
    return NextResponse.json({ error: "Aksi absen tidak dikenal" }, { status: 400 });
  }

  // Wajah wajib terdaftar: absen tidak boleh jalan hanya dengan lokasi.
  const enrollment = await prisma.faceEnrollment.findUnique({
    where: { userDataId: self.userDataId },
    select: { id: true },
  });
  if (!enrollment) {
    return NextResponse.json(
      { error: "Daftarkan wajah dulu sebelum absen." },
      { status: 409 },
    );
  }

  const point = {
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    accuracy: Number(body.accuracy),
  };
  if (
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    !Number.isFinite(point.accuracy)
  ) {
    return NextResponse.json(
      { error: "Lokasi GPS tidak terbaca. Nyalakan lokasi lalu coba lagi." },
      { status: 400 },
    );
  }
  if (point.accuracy > MAX_ACCURACY_METERS) {
    return NextResponse.json(
      {
        error: `Akurasi GPS kamu ${Math.round(point.accuracy)} m. Perlu di bawah ${MAX_ACCURACY_METERS} m, coba di area terbuka.`,
      },
      { status: 400 },
    );
  }

  if (!self.branchId) {
    return NextResponse.json(
      { error: "Kamu belum ditempatkan di cabang mana pun. Hubungi admin." },
      { status: 409 },
    );
  }

  const branch = await prisma.branch.findFirst({
    where: { id: self.branchId, clientId: self.clientId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
    },
  });
  if (!branch) {
    return NextResponse.json(
      { error: "Cabang kamu tidak ditemukan. Hubungi admin." },
      { status: 409 },
    );
  }
  if (branch.latitude === null || branch.longitude === null || branch.radiusMeters === null) {
    return NextResponse.json(
      { error: "Area absensi cabang belum diatur admin." },
      { status: 409 },
    );
  }
  if (!isWithinGeofence(branch, point)) {
    return NextResponse.json(
      { error: `Kamu di luar area ${branch.name} (radius ${branch.radiusMeters} m).` },
      { status: 422 },
    );
  }

  const now = new Date();
  const workDate = workDateFor(now);
  const existing = await prisma.attendanceRecord.findUnique({
    where: { userDataId_workDate: { userDataId: self.userDataId, workDate } },
  });

  const transition = transitionAttendance(
    existing
      ? { checkInAt: existing.checkInAt, checkOutAt: existing.checkOutAt }
      : null,
    action,
    now,
  );
  if (!transition.ok) {
    const message =
      transition.reason === "already-checked-in"
        ? "Kamu sudah absen masuk hari ini."
        : "Absen masuk dulu sebelum absen pulang.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const coords =
    action === "check-in"
      ? {
          inLatitude: point.latitude,
          inLongitude: point.longitude,
          inAccuracy: point.accuracy,
        }
      : {
          outLatitude: point.latitude,
          outLongitude: point.longitude,
          outAccuracy: point.accuracy,
        };

  const record = existing
    ? await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { ...transition.record, ...coords },
      })
    : await prisma.attendanceRecord.create({
        data: {
          userDataId: self.userDataId,
          clientId: self.clientId,
          branchId: branch.id,
          workDate,
          method: "face",
          ...transition.record,
          ...coords,
        },
      });

  return NextResponse.json(record);
}
