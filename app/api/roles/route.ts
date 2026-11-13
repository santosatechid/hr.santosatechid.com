import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveAdminClient, clientForbidden } from "@/services/clients";
import { roleLevel } from "@/services/hris/access";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t = await resolveAdminClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  try {
    // ✅ Optimized: Use select to drop unused createdAt/updatedAt
    // Fields used: id, name, description, isActive, permissions, _count.userData
    // Role bawaan/sistem (clientId NULL) tetap ditampilkan.
    const roles = await prisma.role.findMany({
      where: { OR: [{ clientId: t.clientId }, { clientId: null }] },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        permissions: true,
        _count: { select: { userData: true } },
      },
      orderBy: { name: "asc" },
    });
    // Urut sesuai tangga persetujuan: Staff → Supervisor → Manager → HR Admin
    // → Owner, baru alfabetis untuk level yang sama.
    return NextResponse.json(
      [...roles].sort(
        (a, b) =>
          roleLevel(a.name) - roleLevel(b.name) || a.name.localeCompare(b.name),
      ),
    );
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { name, description, permissions } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        // clientId selalu dari sesi, bukan dari body
        clientId: t.clientId,
        permissions: {
          set: permissions || [],
        },
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { id, name, description, permissions, isActive } =
      await request.json();
    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 },
      );
    }

    // Role milik client ini boleh diubah; role bersama (clientId NULL)
    // juga boleh, karena body tidak pernah dipakai untuk mengubah clientId.
    const owned = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ clientId: t.clientId }, { clientId: null }],
      },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        permissions: {
          set: permissions || [],
        },
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Role bersama (clientId NULL) tidak boleh dihapus dari client lain
    const owned = await prisma.role.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    const deletedRole = await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json(deletedRole);
  } catch (error) {
    return handlePrismaError(error);
  }
}
