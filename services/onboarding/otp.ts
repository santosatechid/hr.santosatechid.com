import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "@/services/prisma";
import { getPublishChannel } from "@/services/rabbitmq/rabbitMq";
import { BULK_EXCHANGE, BULK_ROUTING_SEND } from "@/services/rabbitmq/topology";
import { pickOtpMessage } from "@/services/whatsapp/otpTemplates";
import { formatPhoneNumber } from "@/services/whatsapp/whatsapp";

/**
 * OTP verifikasi nomor WhatsApp untuk onboarding.
 *
 * Disimpan di tabel `verification` milik BetterAuth (tidak dipakai auth di
 * proyek ini), identifier per user. `value` adalah JSON:
 * `{ hash, phone, attempts, verified }` — tidak pernah kode mentah.
 */

const OTP_TTL_MS = 5 * 60 * 1_000;
const RESEND_COOLDOWN_MS = 60 * 1_000;
const VERIFIED_TTL_MS = 10 * 60 * 1_000;
const MAX_ATTEMPTS = 5;

type OtpState = {
  hash: string;
  phone: string;
  attempts: number;
  verified: boolean;
};

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseState(raw: string): OtpState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<OtpState>;
    if (typeof parsed.hash !== "string" || typeof parsed.phone !== "string") {
      return null;
    }
    return {
      hash: parsed.hash,
      phone: parsed.phone,
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
      verified: parsed.verified === true,
    };
  } catch {
    return null;
  }
}

type Failure = { ok: false; status: number; message: string };
export type IssueResult = { ok: true; phone: string; expiresIn: number } | Failure;
export type VerifyResult =
  | { ok: true; phone: string }
  | Failure;

/** `08xx` / `8xx` / `+62xx` → `62xx`, lalu validasi panjang wajar. */
export function normalizeWhatsAppPhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  const phone = formatPhoneNumber(digits);
  return /^62\d{8,13}$/.test(phone) ? phone : null;
}

async function publishToWorker(number: string, message: string): Promise<boolean> {
  try {
    const channel = await getPublishChannel();
    const content = Buffer.from(
      JSON.stringify({
        batchId: randomUUID(),
        number,
        name: null,
        message,
        // Jeda kecil: worker mengirim serial dan Evolution API membatasi laju.
        delayMs: 1_500,
      }),
    );
    const { promise, resolve } = Promise.withResolvers<boolean>();
    channel.publish(
      BULK_EXCHANGE,
      BULK_ROUTING_SEND,
      content,
      { persistent: true, contentType: "application/json" },
      (error) => resolve(!error),
    );
    return await promise;
  } catch (error) {
    console.error("[otp] gagal publish ke worker:", error);
    return false;
  }
}

export async function issueOtp(
  userId: string,
  rawPhone: unknown,
): Promise<IssueResult> {
  const phone = normalizeWhatsAppPhone(rawPhone);
  if (!phone) {
    return {
      ok: false,
      status: 400,
      message: "Nomor WhatsApp tidak valid. Contoh: 08123456789.",
    };
  }

  const identifier = `wa-otp:${userId}`;
  const previous = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  if (
    previous?.createdAt &&
    Date.now() - previous.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    return {
      ok: false,
      status: 429,
      message: "Tunggu sebentar sebelum meminta kode baru.",
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const state: OtpState = { hash: hash(code), phone, attempts: 0, verified: false };
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.verification.deleteMany({ where: { identifier } });
  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier,
      value: JSON.stringify(state),
      expiresAt,
    },
  });

  const sent = await publishToWorker(
    phone,
    pickOtpMessage(code, Math.round(OTP_TTL_MS / 60_000)),
  );
  if (!sent) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return {
      ok: false,
      status: 503,
      message: "Layanan WhatsApp sedang sibuk. Coba lagi sebentar.",
    };
  }

  return { ok: true, phone, expiresIn: Math.round(OTP_TTL_MS / 1_000) };
}

export async function verifyOtp(
  userId: string,
  rawCode: unknown,
): Promise<VerifyResult> {
  const code = typeof rawCode === "string" ? rawCode.replace(/\D/g, "") : "";
  if (code.length !== 6) {
    return { ok: false, status: 400, message: "Kode harus 6 angka." };
  }

  const identifier = `wa-otp:${userId}`;
  const row = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return {
      ok: false,
      status: 400,
      message: "Kode tidak ditemukan. Kirim ulang OTP.",
    };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, status: 400, message: "Kode sudah kedaluwarsa." };
  }

  const state = parseState(row.value);
  if (!state) {
    return {
      ok: false,
      status: 400,
      message: "Kode tidak ditemukan. Kirim ulang OTP.",
    };
  }
  if (state.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      message: "Terlalu banyak percobaan. Minta kode baru.",
    };
  }

  if (!sameHash(state.hash, hash(code))) {
    await prisma.verification.update({
      where: { id: row.id },
      data: {
        value: JSON.stringify({ ...state, attempts: state.attempts + 1 }),
      },
    });
    return { ok: false, status: 400, message: "Kode salah." };
  }

  await prisma.verification.update({
    where: { id: row.id },
    data: {
      value: JSON.stringify({ ...state, verified: true }),
      expiresAt: new Date(Date.now() + VERIFIED_TTL_MS),
    },
  });

  return { ok: true, phone: state.phone };
}

/**
 * Sekali pakai: mengembalikan nomor terverifikasi lalu menghapus barisnya,
 * supaya pembuatan client tidak bisa diulang tanpa OTP baru.
 */
export async function consumeVerifiedPhone(
  userId: string,
): Promise<string | null> {
  const identifier = `wa-otp:${userId}`;
  const row = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  const state = parseState(row.value);
  if (!state?.verified) return null;

  await prisma.verification.deleteMany({ where: { identifier } });
  return state.phone;
}
