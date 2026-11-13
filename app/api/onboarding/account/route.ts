import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/services/auth/auth";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

/**
 * Langkah "Akun" pada onboarding client.
 *
 * Email selalu datang dari sesi (tidak diketik ulang). Akun Google belum punya
 * kata sandi, jadi langkah ini yang membuatnya — opsional. Akun yang sudah
 * punya kata sandi tidak diubah dari sini.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { password: true },
  });

  return NextResponse.json({
    email: session.user.email,
    name: session.user.name,
    hasPassword: Boolean(credential?.password),
    hasGoogle: Boolean(
      await prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "google" },
        select: { id: true },
      }),
    ),
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Kata sandi minimal 8 karakter" },
        { status: 400 },
      );
    }

    // Login OTP boleh menetapkan kata sandi sendiri, termasuk menimpa kata
    // sandi sementara yang dibuat admin saat menambah karyawan.
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: request.headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePrismaError(error);
  }
}
