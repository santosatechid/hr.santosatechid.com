/**
 * Pengiriman email transaksional lewat Resend HTTP API.
 *
 * Tanpa `RESEND_API_KEY` + `EMAIL_FROM`, dev mencatat isi email ke log server
 * (termasuk OTP) supaya alur entry tetap bisa dites. Produksi menolak dengan
 * error jelas alih-alih diam-diam tidak mengirim.
 */
export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email belum dikonfigurasi: isi RESEND_API_KEY dan EMAIL_FROM.",
      );
    }
    console.info(`[email:dev] ke=${to} subjek=${subject}\n${text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    throw new Error(
      `Email gagal dikirim (${response.status}): ${await response.text()}`,
    );
  }
}
