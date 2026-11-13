import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

/**
 * Self-service profil karyawan (onboarding karyawan baru).
 *
 * Hanya field milik karyawan sendiri yang boleh diubah di sini. Nama, peran,
 * cabang, dan data payroll tetap di tangan admin.
 */

const GENDERS: Record<string, true> = { "Laki-laki": true, Perempuan: true };

const optionalText = (value: unknown, max: number) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return "invalid";
  const text = value.trim();
  return text.length > max ? "invalid" : text || null;
};

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const profile = await prisma.userData.findUnique({
    where: { id: self.userDataId },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      address: true,
      birthPlace: true,
      birthDate: true,
      gender: true,
      avatarUrl: true,
      employeeId: true,
      position: true,
      enrollmentDate: true,
    },
  });

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const phoneNumber = optionalText(body.phoneNumber, 20);
    const address = optionalText(body.address, 200);
    const birthPlace = optionalText(body.birthPlace, 100);
    // Foto profil datang sebagai data URL base64 (≤ ~300 KB setelah dikompres).
    const avatarUrl =
      body.avatarUrl === undefined
        ? undefined
        : body.avatarUrl === null
          ? null
          : typeof body.avatarUrl === "string" &&
              body.avatarUrl.length <= 400_000 &&
              /^(data:image\/|https?:\/\/)/.test(body.avatarUrl)
            ? body.avatarUrl
            : "invalid";
    const gender =
      body.gender === undefined
        ? undefined
        : body.gender === null
          ? null
          : typeof body.gender === "string" && GENDERS[body.gender]
            ? body.gender
            : "invalid";

    const birthDate =
      body.birthDate === undefined
        ? undefined
        : typeof body.birthDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)
          ? new Date(`${body.birthDate}T00:00:00.000Z`)
          : body.birthDate === null
            ? null
            : "invalid";

    const invalid = [
      phoneNumber,
      address,
      birthPlace,
      avatarUrl,
      gender,
      birthDate,
    ].some((value) => value === "invalid");
    if (invalid) {
      return NextResponse.json(
        { success: false, message: "Data profil tidak valid" },
        { status: 400 },
      );
    }
    if (phoneNumber && phoneNumber.replace(/\D/g, "").length < 9) {
      return NextResponse.json(
        { success: false, message: "Nomor HP minimal 9 angka" },
        { status: 400 },
      );
    }

    const updated = await prisma.userData.update({
      where: { id: self.userDataId },
      data: {
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(birthPlace !== undefined ? { birthPlace } : {}),
        ...(birthDate !== undefined ? { birthDate } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        phoneNumber: true,
        address: true,
        birthPlace: true,
        birthDate: true,
        gender: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    return handlePrismaError(error);
  }
}
