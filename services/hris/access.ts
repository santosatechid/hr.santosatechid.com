/**
 * Model akses mengikuti matriks RBAC PRD (§4).
 *
 * Lima peran kanonik: employee, manager, hr_admin, finance, owner. Tabel role
 * di database tetap bebas (nama dibuat per client), jadi nama role dipetakan ke
 * peran kanonik lewat `roleKindOf`. Permission kustom per role tetap dihormati
 * sebagai tambahan, bukan pengganti.
 */

export const SELF_SERVICE_PATHS = [
  "/dashboard/profile",
  "/dashboard/attendance",
  "/dashboard/attendance/logs",
  "/dashboard/requests",
  "/dashboard/payslips",
] as const;

const HOME_PATHS = ["/", "/dashboard"] as const;

const ADMIN_MASTER_PATHS = [
  "/dashboard/admin/master/users",
  "/dashboard/admin/master/roles",
  "/dashboard/admin/master/branches",
  "/dashboard/admin/master/divisions",
  "/dashboard/admin/utility/whatsapp",
] as const;

const PAYROLL_PATHS = [
  "/dashboard/payroll/runs",
  "/dashboard/payroll/bank",
] as const;

export const ALL_PERMISSIONS = [
  ...HOME_PATHS,
  ...SELF_SERVICE_PATHS,
  ...ADMIN_MASTER_PATHS,
  ...PAYROLL_PATHS,
  "/dashboard/admin/requests",
];

export type RoleKind = "employee" | "manager" | "hr_admin" | "finance" | "owner";

/**
 * Path yang boleh dibuka tiap peran. `manager` (termasuk Supervisor) hanya
 * menambah antrean persetujuan tim; `finance` payroll penuh tetapi tidak
 * mengelola master data; `hr_admin` dan `owner` melihat semua.
 */
const ROLE_PATHS: Record<RoleKind, readonly string[]> = {
  employee: [...HOME_PATHS, ...SELF_SERVICE_PATHS],
  manager: [
    ...HOME_PATHS,
    ...SELF_SERVICE_PATHS,
    "/dashboard/admin/requests",
  ],
  hr_admin: ALL_PERMISSIONS,
  finance: [
    ...HOME_PATHS,
    ...SELF_SERVICE_PATHS,
    "/dashboard/admin/master/users",
    "/dashboard/admin/requests",
    ...PAYROLL_PATHS,
  ],
  owner: ALL_PERMISSIONS,
};

/**
 * Tangga persetujuan: Staff → Supervisor → Manager → HR Admin → Owner.
 * Level yang lebih tinggi memutuskan pengajuan level di bawahnya; HR Admin
 * (4) ke atas memutuskan semua, termasuk sesama level.
 */
export function roleLevel(roleName?: string | null): number {
  const name = (roleName ?? "").toLowerCase();
  if (/owner|pemilik|direktur|direksi/.test(name)) return 5;
  if (/hr|admin|hrd|personalia|finance|keuangan|akuntan|accounting/.test(name)) {
    return 4;
  }
  if (/manager|head|kepala/.test(name)) return 3;
  if (/supervisor|leader|koordinator|atasan/.test(name)) return 2;
  return 1;
}

/** Reviewer boleh memutuskan pengajuan pemilik role ini? */
export function canDecideFor(
  reviewerRoleName?: string | null,
  requesterRoleName?: string | null,
): boolean {
  const reviewer = roleLevel(reviewerRoleName);
  if (reviewer >= 4) return true;
  return reviewer > roleLevel(requesterRoleName);
}

/** Nama role bebas → peran kanonik. Urutan penting: owner sebelum admin. */
export function roleKindOf(roleName?: string | null): RoleKind {
  const name = (roleName ?? "").toLowerCase();
  if (/owner|pemilik|direktur|direksi/.test(name)) return "owner";
  if (/finance|keuangan|akuntan|accounting/.test(name)) return "finance";
  if (/hr|admin|hrd|personalia/.test(name)) return "hr_admin";
  if (/manager|supervisor|atasan|kepala|head|leader|koordinator/.test(name)) {
    return "manager";
  }
  return "employee";
}

/** Layanan yang boleh mengakses menu admin (PRD: hr_admin, finance, owner). */
export const isAdminRole = (roleName?: string | null) => {
  const kind = roleKindOf(roleName);
  return kind === "hr_admin" || kind === "finance" || kind === "owner";
};

/** Peran yang memutuskan pengajuan (manager, hr_admin, owner). */
export const isApproverRole = (roleName?: string | null) =>
  isAdminRole(roleName) || roleKindOf(roleName) === "manager";

const isSelfServicePath = (path: string) =>
  SELF_SERVICE_PATHS.some((allowed) => allowed === path);

/**
 * Path yang terlihat di navigasi. Permission kustom hanya bisa menambah path
 * self-service — path admin/payroll selalu ditentukan peran.
 */
export function visiblePaths(
  roleName: string | null | undefined,
  permissions: string[],
): string[] {
  const base = [...ROLE_PATHS[roleKindOf(roleName)]];
  const extra = permissions.filter(
    (path) => isSelfServicePath(path) && !base.includes(path),
  );
  return [...new Set([...base, ...extra])];
}

export const canAccessPath = (
  roleName: string | null | undefined,
  permissions: string[],
  path: string,
) => visiblePaths(roleName, permissions).includes(path);

export const isOwnedByClient = (
  sessionClientId: string,
  recordClientId: string | null,
) => recordClientId === sessionClientId;
