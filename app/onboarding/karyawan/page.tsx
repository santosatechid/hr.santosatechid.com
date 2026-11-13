import { headers } from "next/headers";
import { redirect } from "next/navigation";

import EmployeeOnboarding from "./employeeOnboarding";
import { ReactQueryProvider } from "@/app/providers";
import { auth } from "@/services/auth/auth";

export const dynamic = "force-dynamic";

export default async function EmployeeOnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/signIn");

  return (
    <ReactQueryProvider>
      <EmployeeOnboarding />
    </ReactQueryProvider>
  );
}
