import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";
import { type NextRequest, NextResponse } from "next/server";

export const ALL_PERMISSIONS = [
  "/",
  "/dashboard",
  "/dashboard/profile",
  "/dashboard/admin/master/users",
  "/dashboard/admin/master/roles",
  "/dashboard/admin/master/branches",
  "/dashboard/admin/utility/whatsapp",
  "/dashboard/payroll/bank",
];

export type ClientContext =
  | { ok: true; clientId: string; userId: string }
  | { ok: false; response: NextResponse };

export function clientUnauthorized(message = "Sesi tidak ditemukan") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function clientForbidden(message = "Akun belum terhubung ke client") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

/**
 * Client milik pemanggil. User yang belum onboarding tidak punya clientId,
 * sehingga route bisnis membalas 403 dan UI mengarahkan ke /onboarding.
 */
export async function resolveClient(
  request: NextRequest,
  explicit?: string | null,
): Promise<ClientContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) return { ok: false, response: clientUnauthorized() };

  const [user, userData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    }),
    prisma.userData.findUnique({
      where: { userId },
      select: { clientId: true },
    }),
  ]);

  const clientId = user?.clientId ?? userData?.clientId ?? null;

  if (!clientId) return { ok: false, response: clientForbidden() };

  if (explicit && explicit !== clientId) {
    return {
      ok: false,
      response: clientForbidden("Tidak punya akses ke client ini"),
    };
  }

  return { ok: true, clientId, userId };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

//  Onboarding: buat client + role Admin + branch Main + userData pemilik.
//  Satu transaksi supaya akun tidak pernah setengah jadi.

export async function createClientForUser(
  userId: string,
  input: { name: string; email?: string; phone?: string; address?: string },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, clientId: true },
  });

  if (!user) throw new Error("Akun tidak ditemukan");
  if (user.clientId) throw new Error("Akun sudah memiliki client");

  const baseSlug = slugify(input.name) || "client";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;

  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: input.name,
        slug,
        email: input.email || user.email,
        phone: input.phone,
        address: input.address,
      },
    });

    const role = await tx.role.create({
      data: {
        clientId: client.id,
        name: "Admin",
        description: "Akses penuh ke client",
        permissions: ALL_PERMISSIONS,
      },
    });

    const branch = await tx.branch.create({
      data: {
        clientId: client.id,
        code: "MAIN",
        name: "Main",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { clientId: client.id, role: "admin" },
    });

    await tx.userData.upsert({
      where: { userId },
      create: {
        userId,
        clientId: client.id,
        name: user.name,
        email: user.email,
        roleId: role.id,
        branchId: branch.id,
        status: "active",
        isActive: true,
      },
      update: {
        clientId: client.id,
        roleId: role.id,
        branchId: branch.id,
      },
    });

    return client;
  });
}
