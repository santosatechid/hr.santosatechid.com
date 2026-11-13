import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { canAccessPath } from "@/services/hris/access";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";

export default async function AdminRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/signIn");

  const userData = await prisma.userData.findUnique({
    where: { userId: session.user.id },
    select: {
      clientId: true,
      role: { select: { name: true, permissions: true } },
    },
  });
  if (!userData?.clientId) redirect("/onboarding");

  // Halaman yang dibuka menentukan hak akses (PRD §4): manager boleh membuka
  // antrean persetujuan tapi tidak master data; finance sebaliknya.
  const pathname =
    (await headers()).get("x-pathname") ?? "/dashboard/admin/requests";
  if (
    !canAccessPath(
      userData.role?.name,
      userData.role?.permissions ?? [],
      pathname,
    )
  ) {
    redirect("/dashboard");
  }

  return children;
}
