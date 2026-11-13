import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveClient, clientForbidden } from "@/services/clients";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string | undefined }> },
) {
  const t = await resolveClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  const { id } = await params;
  if (id !== t.userId) {
    return clientForbidden("Akun ini hanya bisa melihat profil sendiri");
  }
  try {
    const user = await prisma.userData.findFirst({
      where: { userId: id as string, clientId: t.clientId },
      include: {
        branch: true,
        division: true,
        role: true,
        user: true,
      },
    });

    if (!user) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    return NextResponse.json(user);
  } catch (error) {
    return handlePrismaError(error);
  }
}
