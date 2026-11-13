import {
  ALL_PERMISSIONS,
  isAdminRole,
  isApproverRole,
  SELF_SERVICE_PATHS,
} from "@/services/hris/access";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";
import { type NextRequest, NextResponse } from "next/server";

export { ALL_PERMISSIONS };


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
export async function resolveAdminClient(
  request: NextRequest,
  explicit?: string | null,
): Promise<ClientContext> {
  const client = await resolveClient(request, explicit);
  if (!client.ok) return client;

  const userData = await prisma.userData.findFirst({
    where: { userId: client.userId, clientId: client.clientId },
    select: { role: { select: { name: true } } },
  });
  if (!isAdminRole(userData?.role?.name)) {
    return { ok: false, response: clientForbidden("Halaman ini khusus admin") };
  }

  return client;
}

/** Seperti `resolveAdminClient`, tetapi manager juga boleh (approval tim). */
export async function resolveApproverClient(
  request: NextRequest,
): Promise<ClientContext> {
  const client = await resolveClient(request);
  if (!client.ok) return client;

  const userData = await prisma.userData.findFirst({
    where: { userId: client.userId, clientId: client.clientId },
    select: { role: { select: { name: true } } },
  });
  if (!isApproverRole(userData?.role?.name)) {
    return {
      ok: false,
      response: clientForbidden("Halaman ini khusus atasan atau admin"),
    };
  }

  return client;
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

    // Peran awal mengikuti matriks RBAC PRD §4. Pemilik akun jadi Owner supaya
    // tidak ada fitur yang terkunci di perusahaan baru.
    const roleTemplates = [
      {
        name: "Owner",
        description: "Akses penuh perusahaan",
        permissions: ALL_PERMISSIONS,
      },
      {
        name: "HR Admin",
        description: "Kelola karyawan, absensi, dan payroll",
        permissions: [...SELF_SERVICE_PATHS, "/dashboard/admin/master/users"],
      },
      {
        name: "Manager",
        description: "Setujui pengajuan tim",
        permissions: [...SELF_SERVICE_PATHS],
      },
      {
        name: "Supervisor",
        description: "Setujui pengajuan staf",
        permissions: [...SELF_SERVICE_PATHS],
      },
      {
        name: "Staff",
        description: "Absen, ajukan cuti, lihat slip gaji",
        permissions: [...SELF_SERVICE_PATHS],
      },
    ] as const;

    await tx.role.createMany({
      data: roleTemplates.map((template) => ({
        ...template,
        permissions: [...template.permissions],
        clientId: client.id,
      })),
    });

    const role = await tx.role.findUniqueOrThrow({
      where: { clientId_name: { clientId: client.id, name: "Owner" } },
      select: { id: true },
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
      data: { clientId: client.id, role: "owner" },
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
