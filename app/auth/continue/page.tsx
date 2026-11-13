import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

/**
 * Tujuan setelah autentikasi, ditentukan dari data — bukan dari tombol login.
 *
 * - Owner (dibuat wizard) → dashboard, atau lanjutkan pembuatan perusahaan.
 * - Karyawan yang ditautkan admin → onboarding karyawan sampai nomor HP terisi,
 *   setelah itu langsung ke absensi.
 */
export default async function ContinuePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/signIn");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true },
  });

  if (user?.role === "owner") {
    redirect(user.clientId ? "/dashboard" : "/onboarding");
  }

  const employee = await prisma.userData.findUnique({
    where: { userId: session.user.id },
    select: { clientId: true, phoneNumber: true },
  });

  if (!employee?.clientId) {
    redirect(user?.clientId ? "/dashboard" : "/onboarding");
  }

  redirect(
    employee.phoneNumber ? "/dashboard/attendance" : "/onboarding/karyawan",
  );
}
