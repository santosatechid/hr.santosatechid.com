import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveClient, clientForbidden } from "@/services/clients";
import { auth } from "@/services/auth/auth";
import { type NextRequest, NextResponse } from "next/server";

function replaceUndefinedWithNull<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => replaceUndefinedWithNull(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) {
        result[key] = null;
      } else if (
        Array.isArray(val) ||
        (val !== null && typeof val === "object")
      ) {
        result[key] = replaceUndefinedWithNull(val);
      } else {
        result[key] = val;
      }
    }
    return result as unknown as T;
  }
  return (value === undefined ? (null as unknown as T) : value) as T;
}

type TenantRefs = {
  userId?: string | null;
  roleId?: string | null;
  branchId?: string | null;
};

// Verifikasi setiap FK dari body memang milik client pemanggil.
// Role bersama (clientId NULL) tetap diizinkan karena ikut tampil di daftar role.
async function refsOwnedByClient(
  data: TenantRefs,
  clientId: string,
): Promise<boolean> {
  const { userId, roleId, branchId } = data;

  const [user, role, branch] = await Promise.all([
    userId
      ? prisma.user.findFirst({
          where: {
            id: userId,
            OR: [{ clientId }, { clientId: null }],
          },
          select: { id: true },
        })
      : true,
    roleId
      ? prisma.role.findFirst({
          where: {
            id: roleId,
            OR: [{ clientId }, { clientId: null }],
          },
          select: { id: true },
        })
      : true,
    branchId
      ? prisma.branch.findFirst({
          where: { id: branchId, clientId },
          select: { id: true },
        })
      : true,
  ]);

  return Boolean(user && role && branch);
}

export async function GET(request: NextRequest) {
  const t = await resolveClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  try {
    const users = await prisma.userData.findMany({
      where: {
        clientId: t.clientId,
      },
      include: {
        role: true,
        branch: true,
        user: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { name, email, roleId, password, userId, ...rest } =
      await request.json();
    if (!name || !roleId || !email) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 },
      );
    }

    if (!(await refsOwnedByClient({ userId, roleId, ...rest }, t.clientId))) {
      return clientForbidden("Data referensi tidak ditemukan di client ini");
    }

    // clientId dari body dibuang, distempel dari sesi
    delete rest.clientId;

    // Akun login belum ada → daftarkan otomatis (email + password dari admin).
    let linkedUserId: string | null = userId ?? null;
    if (!linkedUserId) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password minimal 8 karakter" },
          { status: 400 },
        );
      }
      const account = await auth.api.createUser({
        body: { email, password, name },
        headers: request.headers,
      });
      linkedUserId = account.user.id;
    }

    const data = replaceUndefinedWithNull({
      name,
      email,
      roleId,
      ...rest,
      userId: linkedUserId,
      clientId: t.clientId,
    });

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.userData.create({ data });
      if (created.userId) {
        await tx.user.update({
          where: { id: created.userId },
          data: { clientId: t.clientId },
        });
      }
      return created;
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id, name, email, roleId, password, ...restData } =
      await request.json();
    if (!id || !name || !roleId) {
      return NextResponse.json(
        { error: "ID, name, and role are required" },
        { status: 400 },
      );
    }

    const owned = await prisma.userData.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true, userId: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    if (!(await refsOwnedByClient({ roleId, ...restData }, t.clientId))) {
      return clientForbidden("Data referensi tidak ditemukan di client ini");
    }

    // clientId dari body dibuang: klien tidak boleh memindah client
    delete restData.clientId;

    // Password baru → ganti kredensial akun login yang tertaut.
    const newPassword =
      typeof password === "string" && password.trim() ? password.trim() : null;
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password minimal 8 karakter" },
          { status: 400 },
        );
      }
      if (!owned.userId) {
        return NextResponse.json(
          { error: "User ini belum punya akun login" },
          { status: 400 },
        );
      }
      await auth.api.setUserPassword({
        body: { userId: owned.userId, newPassword },
        headers: request.headers,
      });
    }

    const data = replaceUndefinedWithNull({ name, email, roleId, ...restData });

    const updatedUser = await prisma.userData.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handlePrismaError(error);
  }
}
export async function DELETE(request: NextRequest) {
  const t = await resolveClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const owned = await prisma.userData.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const deletedUser = await prisma.userData.delete({
      where: { id },
    });

    return NextResponse.json(deletedUser);
  } catch (error) {
    return handlePrismaError(error);
  }
}
