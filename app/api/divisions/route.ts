import { type NextRequest, NextResponse } from "next/server";

import { resolveAdminClient, clientForbidden } from "@/services/clients";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

type DivisionInput = {
  id?: string;
  name?: unknown;
  description?: unknown;
  isActive?: unknown;
};

const normalizeName = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeDescription = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function GET(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const divisions = await prisma.division.findMany({
      where: { clientId: t.clientId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(divisions);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const body = (await request.json()) as DivisionInput;
    const name = normalizeName(body.name);
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Nama divisi minimal 2 karakter" },
        { status: 400 },
      );
    }

    const division = await prisma.division.create({
      data: {
        name,
        description: normalizeDescription(body.description),
        isActive: body.isActive !== false,
        clientId: t.clientId,
      },
    });
    return NextResponse.json(division, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const body = (await request.json()) as DivisionInput;
    const id = typeof body.id === "string" ? body.id : "";
    const name = normalizeName(body.name);
    if (!id || name.length < 2) {
      return NextResponse.json(
        { error: "ID dan nama divisi wajib diisi" },
        { status: 400 },
      );
    }

    const owned = await prisma.division.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) return clientForbidden("Divisi tidak ditemukan di client ini");

    const division = await prisma.division.update({
      where: { id },
      data: {
        name,
        description: normalizeDescription(body.description),
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(division);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const t = await resolveAdminClient(request);
  if (!t.ok) return t.response;

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    const owned = await prisma.division.findFirst({
      where: { id, clientId: t.clientId },
      select: { id: true },
    });
    if (!owned) return clientForbidden("Divisi tidak ditemukan di client ini");

    await prisma.division.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch (error) {
    return handlePrismaError(error);
  }
}
