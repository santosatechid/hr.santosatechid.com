import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";

export type SelfContext =
  | {
      ok: true;
      clientId: string;
      userDataId: string;
      userId: string;
      branchId: string | null;
    }
  | { ok: false; response: NextResponse };

/** Employee identity always comes from the session, never the request body. */
export async function resolveSelf(request: NextRequest): Promise<SelfContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sesi tidak ditemukan" },
        { status: 401 },
      ),
    };
  }

  const userData = await prisma.userData.findUnique({
    where: { userId },
    select: { id: true, clientId: true, branchId: true },
  });
  if (!userData?.clientId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Akun belum terhubung ke client" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    clientId: userData.clientId,
    userDataId: userData.id,
    userId,
    branchId: userData.branchId,
  };
}

/** Work date follows WIB so a 00:30 check-in stays on the same calendar day. */
export function workDateFor(now: Date) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${date}T00:00:00.000Z`);
}

export const parseIsoDate = (value: unknown) => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};
