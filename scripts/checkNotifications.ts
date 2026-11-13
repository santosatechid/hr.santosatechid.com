import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { prisma } from "@/services/prisma";
import {
  notifyRequestDecided,
  notifyRequestSubmitted,
} from "@/services/notifications/notify";

// ponytail: fixture sementara untuk cek notifikasi berjenjang, dihapus di akhir
const suffix = randomUUID().slice(0, 8);
const client = await prisma.client.create({
  data: { name: `Cek Notif ${suffix}`, slug: `cek-notif-${suffix}` },
});

const roleOf = (name: string) =>
  prisma.role.create({
    data: { clientId: client.id, name, description: "cek", permissions: [] },
  });

const adminRole = await roleOf("Admin");
const supervisorRole = await roleOf("Supervisor");
const staffRole = await roleOf("Staff");

const makeUser = (name: string, roleId: string) =>
  prisma.userData.create({
    data: {
      name,
      clientId: client.id,
      roleId,
      status: "active",
      isActive: true,
    },
    select: { id: true },
  });

const admin = await makeUser("Admin Cek", adminRole.id);
const supervisor = await makeUser("Supervisor Cek", supervisorRole.id);
const staff = await makeUser("Staff Cek", staffRole.id);

const unreadFor = (userId: string) =>
  prisma.notification.count({ where: { userId, isRead: false } });

await notifyRequestSubmitted({
  clientId: client.id,
  requesterUserDataId: staff.id,
  requesterName: "Staff Cek",
  kind: "leave",
  summary: "Cuti tahunan, 2026-11-20 s/d 2026-11-21",
});

assert.equal(await unreadFor(admin.id), 1, "admin dapat notifikasi pengajuan");
assert.equal(
  await unreadFor(supervisor.id),
  1,
  "supervisor dapat notifikasi pengajuan",
);
assert.equal(await unreadFor(staff.id), 0, "pemohon tidak dinotifikasi sendiri");

await notifyRequestDecided({
  clientId: client.id,
  requesterUserDataId: staff.id,
  reviewerUserDataId: supervisor.id,
  reviewerRoleName: "Supervisor",
  kind: "leave",
  approved: true,
  note: "ok",
});

assert.equal(await unreadFor(staff.id), 1, "pemohon dapat keputusan");
assert.equal(
  await unreadFor(admin.id),
  2,
  "supervisor approve -> admin (atasan) ikut dinotifikasi",
);
assert.equal(
  await unreadFor(supervisor.id),
  1,
  "supervisor tidak menotifikasi dirinya sendiri",
);

await prisma.notification.deleteMany({
  where: { userId: { in: [admin.id, supervisor.id, staff.id] } },
});
await prisma.userData.deleteMany({
  where: { id: { in: [admin.id, supervisor.id, staff.id] } },
});
await prisma.role.deleteMany({ where: { clientId: client.id } });
await prisma.client.delete({ where: { id: client.id } });
await prisma.$disconnect();

console.log("notifikasi berjenjang ok");
