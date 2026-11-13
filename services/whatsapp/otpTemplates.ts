/**
 * Tiga varian teks OTP.
 *
 * Nomor WhatsApp pengirim dipakai bersama semua pengguna, jadi teks yang selalu
 * identik adalah pola paling mudah ditandai sebagai spam. Varian dipilih acak
 * per pengiriman: isi tetap jelas, bentuk pesan tidak seragam.
 */
const TEMPLATES: ((code: string, minutes: number) => string)[] = [
  (code, minutes) =>
    `*Santosa HR*\n\nKode verifikasi kamu: *${code}*\n\nBerlaku ${minutes} menit. Jangan bagikan kode ini ke siapa pun.`,
  (code, minutes) =>
    `Kode OTP Santosa HR: *${code}*\n\nHanya berlaku ${minutes} menit. Abaikan pesan ini bila kamu tidak memintanya.`,
  (code, minutes) =>
    `🔐 *${code}* adalah kode verifikasi Santosa HR kamu.\n\nBerlaku ${minutes} menit. Tim kami tidak pernah meminta kode ini.`,
];

export function pickOtpMessage(code: string, minutes: number): string {
  const index = Math.floor(Math.random() * TEMPLATES.length);
  return TEMPLATES[index](code, minutes);
}

export const OTP_TEMPLATE_COUNT = TEMPLATES.length;
