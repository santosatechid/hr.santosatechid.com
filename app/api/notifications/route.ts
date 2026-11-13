import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import { prisma } from "@/services/prisma";

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: self.userDataId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: self.userDataId, isRead: false },
    }),
  ]);

  return NextResponse.json({ items, unread });
}

/** PATCH tanpa `id` menandai semua notifikasi terbaca. */
export async function PATCH(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : null;
  const now = new Date();

  const result = await prisma.notification.updateMany({
    where: {
      userId: self.userDataId,
      isRead: false,
      ...(id ? { id } : {}),
    },
    data: { isRead: true, readAt: now },
  });

  return NextResponse.json({ updated: result.count });
}
