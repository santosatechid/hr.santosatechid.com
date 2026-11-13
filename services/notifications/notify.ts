import { isAdminRole } from "@/services/hris/access";
import { prisma } from "@/services/prisma";

/**
 * Notifikasi approval berjenjang.
 *
 * Alur: staff mengajukan → supervisor + admin diberi tahu; keputusan
 * diselesaikan → pemohon diberi tahu, dan bila masih ada jenjang di atasnya
 * (supervisor yang memutuskan) admin ikut diberi tahu.
 *
 * Pemetaan jenjang memakai nama role karena role dibuat bebas per client;
 * admin dikenali lewat `isAdminRole`, atasan lewat kata kunci umum.
 */

const SUPERVISOR_ROLE = /supervisor|atasan|manager|kepala|head|leader/i;

const LINK_BY_KIND = {
  leave: "/dashboard/admin/requests",
  correction: "/dashboard/admin/requests",
} as const;

export type RequestKind = keyof typeof LINK_BY_KIND;

/** Siapa yang harus menerima notifikasi pengajuan baru. */
async function approverIds(clientId: string): Promise<{
  admins: string[];
  supervisors: string[];
}> {
  const rows = await prisma.userData.findMany({
    where: { clientId, isActive: true },
    select: { id: true, role: { select: { name: true } } },
  });

  const admins: string[] = [];
  const supervisors: string[] = [];
  for (const row of rows) {
    const roleName = row.role?.name;
    if (isAdminRole(roleName)) admins.push(row.id);
    else if (roleName && SUPERVISOR_ROLE.test(roleName)) supervisors.push(row.id);
  }
  return { admins, supervisors };
}

async function insert(
  rows: {
    userId: string;
    title: string;
    message: string;
    type: string;
    category: string;
    link: string;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  await prisma.notification.createMany({ data: rows });
}

/** Dipanggil setelah pengajuan staff tersimpan. */
export async function notifyRequestSubmitted(params: {
  clientId: string;
  requesterUserDataId: string;
  requesterName: string;
  kind: RequestKind;
  summary: string;
}): Promise<void> {
  try {
    const { admins, supervisors } = await approverIds(params.clientId);
    const link = LINK_BY_KIND[params.kind];
    await insert(
      [...new Set([...supervisors, ...admins])]
        .filter((id) => id !== params.requesterUserDataId)
        .map((userId) => ({
          userId,
          title: "Pengajuan baru menunggu persetujuan",
          message: `${params.requesterName}: ${params.summary}`,
          type: "approval",
          category: params.kind,
          link,
        })),
    );
  } catch (error) {
    // Notifikasi tidak boleh menggagalkan pengajuan yang sudah tersimpan.
    console.error("[notifikasi] gagal membuat notifikasi pengajuan:", error);
  }
}

/** Dipanggil setelah pengajuan diputuskan. */
export async function notifyRequestDecided(params: {
  clientId: string;
  requesterUserDataId: string;
  reviewerUserDataId: string | null;
  reviewerRoleName: string | null;
  kind: RequestKind;
  approved: boolean;
  note: string;
}): Promise<void> {
  try {
    const link =
      params.kind === "leave"
        ? "/dashboard/requests"
        : "/dashboard/attendance/logs";
    const decision = params.approved ? "disetujui" : "ditolak";
    const message = `${params.kind === "leave" ? "Pengajuan cuti/izin" : "Koreksi absensi"} kamu ${decision}.${params.note ? ` Catatan: ${params.note}` : ""}`;

    const rows = [
      {
        userId: params.requesterUserDataId,
        title: params.approved ? "Pengajuan disetujui" : "Pengajuan ditolak",
        message,
        type: "approval",
        category: params.kind,
        link,
      },
    ];

    // Supervisor yang memutuskan → jenjang di atasnya (admin) ikut tahu.
    const reviewerIsAdmin = isAdminRole(params.reviewerRoleName);
    if (params.approved && !reviewerIsAdmin) {
      const { admins } = await approverIds(params.clientId);
      for (const userId of admins) {
        if (userId === params.reviewerUserDataId) continue;
        rows.push({
          userId,
          title: "Pengajuan diteruskan ke atasan",
          message: `Pengajuan ${params.kind === "leave" ? "cuti/izin" : "koreksi absensi"} sudah disetujui atasan dan menunggu arsip admin.`,
          type: "approval",
          category: params.kind,
          link: LINK_BY_KIND[params.kind],
        });
      }
    }

    await insert(rows);
  } catch (error) {
    console.error("[notifikasi] gagal membuat notifikasi keputusan:", error);
  }
}
