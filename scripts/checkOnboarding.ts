import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/services/prisma";
import {
  consumeVerifiedPhone,
  normalizeWhatsAppPhone,
  verifyOtp,
} from "@/services/onboarding/otp";
import {
  notifyRequestDecided,
  notifyRequestSubmitted,
} from "@/services/notifications/notify";

// ponytail: skrip cek sekali pakai, jalan di DB dev (bun run scripts/checkOnboarding.ts)
const USER = `otp-check-${randomUUID().slice(0, 8)}`;
const IDENT = `wa-otp:${USER}`;

async function otp() {
  assert.equal(normalizeWhatsAppPhone("08123456789"), "628123456789");
  assert.equal(normalizeWhatsAppPhone("+62 812-3456-789"), "628123456789");
  assert.equal(normalizeWhatsAppPhone("123"), null);

  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier: IDENT,
      value: JSON.stringify({
        hash: createHash("sha256").update("123456").digest("hex"),
        phone: "628123456789",
        attempts: 0,
        verified: false,
      }),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });

  assert.equal((await verifyOtp(USER, "000000")).ok, false, "kode salah ditolak");
  assert.equal((await verifyOtp(USER, "123456")).ok, true, "kode benar diterima");
  assert.equal(await consumeVerifiedPhone(USER), "628123456789");
  assert.equal(
    await consumeVerifiedPhone(USER),
    null,
    "verifikasi sekali pakai: tidak bisa dipakai dua kali",
  );
  console.log("OTP ok");
}

async function notifications() {
  const userData = await prisma.userData.findFirst({
    where: { clientId: { not: null } },
    select: { id: true, clientId: true, name: true },
  });
  if (!userData?.clientId) {
    console.log("notifikasi dilewati: belum ada client");
    return;
  }
  const before = await prisma.notification.count();
  await notifyRequestSubmitted({
    clientId: userData.clientId,
    requesterUserDataId: "someone-else",
    requesterName: "Cek Otomatis",
    kind: "leave",
    summary: "Cuti tahunan, 2026-11-20 s/d 2026-11-21",
  });
  await notifyRequestDecided({
    clientId: userData.clientId,
    requesterUserDataId: userData.id,
    reviewerUserDataId: null,
    reviewerRoleName: "Supervisor",
    kind: "leave",
    approved: true,
    note: "",
  });
  const after = await prisma.notification.count();
  assert.ok(after > before, "notifikasi dibuat");
  await prisma.notification.deleteMany({
    where: { title: { in: ["Pengajuan baru menunggu persetujuan", "Pengajuan disetujui", "Pengajuan diteruskan ke atasan"] }, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  console.log(`notifikasi ok (+${after - before} baris, dibersihkan)`);
}

await otp();
await notifications();
await prisma.verification.deleteMany({ where: { identifier: IDENT } });
await prisma.$disconnect();
console.log("semua cek lulus");
