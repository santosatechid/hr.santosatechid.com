import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";
import { resolveAdminClient, clientForbidden } from "@/services/clients";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await resolveAdminClient(
    request,
    request.nextUrl.searchParams.get("clientId"),
  );
  if (!t.ok) return t.response;

  const { id } = await params;
  try {
    const user = await prisma.userData.findFirst({
      where: { id, clientId: t.clientId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return clientForbidden("Data tidak ditemukan di client ini");
    }

    return NextResponse.json(user.role);
  } catch (error) {
    return handlePrismaError(error);
  }
}
