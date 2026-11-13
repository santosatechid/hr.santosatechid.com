import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SetupWizard from "./setupWizard";
import { ReactQueryProvider } from "@/app/providers";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/auth/signIn");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientId: true },
  });

  if (user?.clientId) redirect("/dashboard");

  return (
    <ReactQueryProvider>
      <SetupWizard />
    </ReactQueryProvider>
  );
}
