import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/services/auth/auth";
import { issueOtp, verifyOtp } from "@/services/onboarding/otp";
import { handlePrismaError } from "@/services/errorHandler";

async function sessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

/** POST — kirim OTP ke nomor WhatsApp lewat worker RabbitMQ. */
export async function POST(request: NextRequest) {
  const userId = await sessionUserId(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as { phone?: unknown };
    const result = await issueOtp(userId, body.phone);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }
    return NextResponse.json({
      success: true,
      phone: result.phone,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/** PUT — verifikasi kode OTP. */
export async function PUT(request: NextRequest) {
  const userId = await sessionUserId(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as { code?: unknown };
    const result = await verifyOtp(userId, body.code);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }
    return NextResponse.json({ success: true, phone: result.phone });
  } catch (error) {
    return handlePrismaError(error);
  }
}
