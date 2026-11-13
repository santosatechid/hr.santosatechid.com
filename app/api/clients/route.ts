import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/services/auth/auth";
import { createClientForUser, resolveAdminClient } from "@/services/clients";
import { handlePrismaError } from "@/services/errorHandler";
import { consumeVerifiedPhone } from "@/services/onboarding/otp";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const client = await prisma.client.findUnique({
      where: { id: t.clientId },
      include: {
        _count: { select: { users: true, roles: true, branches: true } },
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const { name, address } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Nama perusahaan minimal 2 karakter" },
        { status: 400 },
      );
    }

    // Nomor WhatsApp wajib sudah diverifikasi lewat OTP; email memakai email
    // akun yang login supaya tidak perlu diketik ulang.
    const verifiedPhone = await consumeVerifiedPhone(session.user.id);
    if (!verifiedPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Verifikasi nomor WhatsApp dulu sebelum membuat client.",
        },
        { status: 400 },
      );
    }

    const client = await createClientForUser(session.user.id, {
      name: name.trim(),
      email: session.user.email,
      phone: verifiedPhone,
      address: typeof address === "string" ? address.trim() : undefined,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah memiliki")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }
    return handlePrismaError(error);
  }
}
