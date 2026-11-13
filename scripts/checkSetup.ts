import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { prisma } from "@/services/prisma";
import { createClientForUser } from "@/services/clients";
import {
  canAccessPath,
  canDecideFor,
  roleKindOf,
  roleLevel,
  visiblePaths,
} from "@/services/hris/access";

// ponytail: fixture sekali pakai untuk cek onboarding PRD (§4 peran, §7 setup)
const suffix = randomUUID().slice(0, 8);

assert.equal(roleKindOf("Owner"), "owner");
assert.equal(roleKindOf("HR Admin"), "hr_admin");
assert.equal(roleKindOf("Finance"), "finance", "role lama tetap dipetakan");
assert.equal(roleKindOf("Supervisor Gudang"), "manager");
assert.equal(roleKindOf("Staff"), "employee");
assert.equal(roleLevel("Staff"), 1);
assert.equal(roleLevel("Supervisor"), 2);
assert.equal(roleLevel("Manager"), 3);
assert.equal(roleLevel("HR Admin"), 4);
assert.equal(roleLevel("Owner"), 5);
assert.equal(canDecideFor("Supervisor", "Staff"), true);
assert.equal(canDecideFor("Supervisor", "Supervisor"), false);
assert.equal(canDecideFor("Manager", "Supervisor"), true);
assert.equal(canDecideFor("Manager", "Manager"), false);
assert.equal(canDecideFor("HR Admin", "Owner"), true, "HR Admin memutuskan semua");

assert.equal(
  canAccessPath("Staff", [], "/dashboard/admin/master/users"),
  false,
  "employee tidak melihat master data",
);
assert.equal(
  canAccessPath("Supervisor", [], "/dashboard/admin/requests"),
  true,
  "manager boleh membuka antrean persetujuan",
);
assert.equal(
  canAccessPath("Finance", [], "/dashboard/payroll/bank"),
  true,
  "finance mengelola file bank",
);
assert.equal(
  canAccessPath("HR Admin", [], "/dashboard/payroll/bank"),
  true,
  "HR admin punya akses penuh",
);
assert.deepEqual(
  visiblePaths("Staff", []),
  visiblePaths("Employee", []),
  "permission kustom tidak bisa membuka path admin",
);

const user = await prisma.user.create({
  data: {
    id: `setup-check-${suffix}`,
    name: "Cek Setup",
    email: `setup-${suffix}@example.com`,
    emailVerified: false,
    role: "owner",
  },
});

const client = await createClientForUser(user.id, {
  name: "PT Cek Setup",
  email: user.email,
  phone: "628123456789",
  address: "Jl. Cek",
});

const roles = await prisma.role.findMany({
  where: { clientId: client.id },
  orderBy: { name: "asc" },
  select: { name: true },
});
assert.deepEqual(
  roles.map((role) => role.name),
  ["HR Admin", "Manager", "Owner", "Staff", "Supervisor"],
  "5 peran berjenjang dibuat saat onboarding",
);

const ownerUserData = await prisma.userData.findFirst({
  where: { userId: user.id },
  select: { role: { select: { name: true } }, branchId: true },
});
assert.equal(ownerUserData?.role?.name, "Owner", "pemilik akun jadi Owner");
assert.ok(ownerUserData?.branchId, "branch MAIN langsung dibuat");

const branch = await prisma.branch.update({
  where: { id: ownerUserData.branchId },
  data: {
    latitude: -6.2,
    longitude: 106.816,
    radiusMeters: 100,
    workDaysPerWeek: 6,
    workStartMinute: 450,
    workEndMinute: 900,
    lateToleranceMinutes: 10,
  },
  select: {
    workDaysPerWeek: true,
    workStartMinute: true,
    workEndMinute: true,
    lateToleranceMinutes: true,
  },
});
assert.deepEqual(branch, {
  workDaysPerWeek: 6,
  workStartMinute: 450,
  workEndMinute: 900,
  lateToleranceMinutes: 10,
});

await prisma.client.delete({ where: { id: client.id } });
await prisma.user.delete({ where: { id: user.id } });
await prisma.$disconnect();

console.log("setup PRD ok: 5 peran, owner, area absensi, jam kerja");
