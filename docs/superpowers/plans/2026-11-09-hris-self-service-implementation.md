# Employee Access and Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver admin-only management, Division CRUD, and secure employee attendance, logs, corrections, and leave requests.

**Architecture:** Reuse current Next.js/Prisma app. Add tenant-scoped records and pure access/geofence/state helpers. Server APIs own authorization, tenant checks, timestamps, and persistence. Load branch map and face model only on screens that use them.

**Tech Stack:** Next.js 16 App Router, Prisma 7, PostgreSQL, React Query, TanStack Table, Bun tests, Leaflet/OpenStreetMap, `@vladmandic/human` browser/WASM.

**Spec:** `docs/superpowers/specs/2026-11-09-hris-self-service-design.md`

## Global Constraints

- Non-admin roles can use only profile, attendance, attendance logs, and requests.
- Admin pages and APIs enforce role access on the server; sidebar filtering is not authorization.
- Employee APIs derive `UserData` from authenticated session and never accept a target employee ID from browser.
- Use circular geofences with a 100-meter default radius; GPS accuracy must be 100 meters or better.
- Face enrollment requires explicit employee consent; raw capture images never leave device or persist.
- Face match is a convenience check and can be bypassed; it is not authorization or liveness detection.
- Leave requests do not calculate accrual balances or automatically change pay.
- All schema changes are additive and preserve current payroll bank-transfer data.
- Payroll calculations, payroll runs, payslip storage, and employee payslips are deferred until attendance is complete.
- Add no external face API or map service; use local face model assets and OSM tiles with attribution.

---

### Task 1: Test-first access and attendance domain rules

**Files:**
- Create: `services/hris/access.ts`
- Create: `services/hris/geofence.ts`
- Create: `services/hris/attendance.ts`
- Create: `services/hris/requests.ts`
- Create: `services/hris/faceTemplate.ts`
- Test: `tests/hris/access.test.js`
- Test: `tests/hris/geofence.test.js`
- Test: `tests/hris/attendance.test.js`
- Test: `tests/hris/requests.test.js`
- Test: `tests/hris/faceTemplate.test.js`

**Interfaces:**
- `isAdminRole(roleName)` and `visiblePaths(roleName, permissions)` implement route allowlists.
- `isOwnedByClient(sessionClientId, recordClientId)` allows only exact non-null client matches.
- `isWithinGeofence(branch, point)` checks coordinates, radius, and GPS accuracy.
- `transitionAttendance(current, action, serverTime)` rejects duplicate/invalid check-in/out.
- `transitionRequest(status, decision)` allows only pending-to-approved/rejected.
- `encryptFaceTemplate`/`decryptFaceTemplate` use AES-256-GCM and a 32-byte base64 key.

- [ ] Write tests for Admin access, employee allowlist fallback, explicit permission intersection, and foreign-client rejection.
- [ ] Run `bun test tests/hris/access.test.js`; expect assertions to fail because access policy is missing.
- [ ] Write geofence tests for center, inside, boundary, outside, missing coordinates, and GPS accuracy over 100 meters.
- [ ] Write attendance tests for valid check-in/out and rejection of duplicate/invalid transitions.
- [ ] Write request tests for approve/reject only from pending state.
- [ ] Write encryption round-trip and wrong-key rejection tests.
- [ ] Implement only functions required by tests; keep them free of database and React imports.
- [ ] Run `bun test tests/hris/*.test.js`.

### Task 2: Add Division, face, attendance, and request schema

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`
- Create: `prisma/migrations/20261109160000_employee_attendance/migration.sql`

- [ ] Add tenant-owned `Division(id, name, description, isActive, clientId)` with unique `(clientId, name)`.
- [ ] Add nullable `UserData.divisionId` relation with index and `onDelete: SetNull`.
- [ ] Add nullable `Branch.latitude`, `Branch.longitude`, and `Branch.radiusMeters`; existing branches stay unconfigured.
- [ ] Add one `FaceEnrollment` per employee with encrypted template and consent timestamp; no image bytes.
- [ ] Add one `AttendanceRecord` per employee/work date with server-time check-in/out, branch, coordinates, accuracy, and method.
- [ ] Use `onDelete: Restrict` from attendance/correction/leave history to employees and branches; keep face templates cascade-deletable on employee deletion.
- [ ] Add `AttendanceCorrectionRequest` and `LeaveRequest` with pending/approved/rejected state, reason, reviewer, response note, and timestamps.
- [ ] Add `FACE_TEMPLATE_ENCRYPTION_KEY` to `.env.example`; do not put a real key in repository.
- [ ] Prevent hard-delete of employees/branches with attendance history; show a deactivate-instead message and preserve audit rows.
- [ ] Rollback means reverting app code while retaining nullable columns/tables; never drop old or new data.
- [ ] Run `bunx prisma validate` and `bunx prisma generate`.

### Task 3: Enforce server-side access and tenant ownership

**Files:**
- Modify: `services/clients.ts`
- Create: `app/(dashboard)/dashboard/admin/layout.tsx`
- Create: `app/(dashboard)/dashboard/payroll/layout.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `app/api/clients/route.ts`
- Modify: `app/api/branches/route.ts`
- Modify: `app/api/roles/route.ts`
- Modify: `app/api/roles/byUser/[id]/route.ts`
- Modify: `app/api/users/route.ts`
- Modify: `app/api/users/[id]/route.ts`
- Modify: `app/api/users/byAuth/[id]/route.ts`
- Modify: `app/api/payroll/bank/route.ts`
- Modify: `app/api/whatsapp/send/route.ts`
- Modify: `app/api/whatsapp/bulk/consumer/route.ts`
- Modify: `app/api/whatsapp/bulk/send/route.ts`

- [ ] Add shared `resolveAdminClient` and self-only access helpers using authenticated session and existing client resolution.
- [ ] Protect admin layouts and admin APIs; leave profile/attendance/log/request routes accessible only to signed-in employees.
- [ ] Admin role sees management paths; non-admin permissions are intersected with self-service allowlist; empty/legacy admin-only permissions default to self-service only.
- [ ] Route non-admin `/dashboard` to `/dashboard/attendance`; Admin retains management dashboard.
- [ ] Ensure by-auth profile API only returns signed-in employee; changing IDs cannot return another employee.
- [ ] Admin-protect user, role, branch, client, payroll-bank, and WhatsApp APIs.
- [ ] Test role policy, exact client ownership, self-only IDs, and permission fallback.

### Task 4: Build Division and branch geofence admin UI

**Files:**
- Create: `app/(dashboard)/dashboard/admin/master/divisions/page.tsx`
- Modify: `app/(dashboard)/dashboard/admin/master/branches/page.tsx`
- Modify: `app/(dashboard)/dashboard/admin/master/roles/page.tsx`
- Create: `app/(dashboard)/dashboard/admin/requests/page.tsx`
- Modify: `components/layout/appSidebar.tsx`
- Modify: `config/menuGroupsSidebar.ts`
- Modify: `hooks/branches/useBranches.ts`
- Create: `hooks/divisions/useDivisions.ts`
- Create: `hooks/requests/useAdminRequests.ts`
- Create: `components/branches/BranchGeofenceMap.tsx`
- Modify: `components/users/userDialogs.tsx`
- Modify: `app/(dashboard)/dashboard/admin/master/users/page.tsx`
- Modify: `types/userDataTypes.ts`
- Modify: `package.json` (Leaflet and type packages only)

- [ ] Add searchable/sortable Divisi table with name, description, status, employee count, and row dropdown for detail/edit/delete.
- [ ] Add create/edit and delete confirmation; deleting a division clears assignments, while branches with history can only be deactivated.
- [ ] Add optional division selector to employee form and show division in employee list/profile.
- [ ] Add branch latitude/longitude/radius controls with OSM map; default circle radius is 100 meters and attribution stays visible.
- [ ] Load Leaflet only while map dialog is open; use exact HTTPS OSM tile URL, browser cache, and no bulk prefetch.
- [ ] Add pending leave/correction review table with approve/reject and response note.
- [ ] Update role permission choices and sidebar; Admin gets management, non-admin only self-service.

### Task 5: Build employee attendance, face, and request flows

**Files:**
- Create: `app/api/divisions/route.ts`
- Create: `app/api/attendance/route.ts`
- Create: `app/api/attendance/logs/route.ts`
- Create: `app/api/attendance/corrections/route.ts`
- Create: `app/api/leave/route.ts`
- Create: `app/api/face-template/route.ts`
- Create: `app/api/admin/requests/route.ts`
- Create: `app/(dashboard)/dashboard/attendance/page.tsx`
- Create: `app/(dashboard)/dashboard/attendance/logs/page.tsx`
- Create: `app/(dashboard)/dashboard/requests/page.tsx`
- Modify: `app/(dashboard)/dashboard/profile/page.tsx`
- Create: `components/attendance/FaceMatcher.tsx`
- Create: `hooks/attendance/useAttendance.ts`
- Create: `hooks/requests/useRequests.ts`
- Add: `public/models/face/blazeface-front.json`, `blazeface-front.bin`, `facemesh.json`, `facemesh.bin`, `mobileface.json`, `mobileface.bin`, and `NOTICE`

- [ ] Add explicit face consent, camera permission, revoke/delete action, and manual fallback.
- [ ] Load `@vladmandic/human` and local model only on profile/attendance screen; store encrypted embedding only, never raw image.
- [ ] Implement check-in/out with server timestamps, assigned branch, geofence validation, and GPS accuracy check.
- [ ] Build employee log and request history scoped to signed-in user.
- [ ] Build correction and leave forms; admin review is the only decision path.
- [ ] Non-admin login/dashboard opens attendance; employee pages reveal only signed-in user's data.

### Task 6: Verify attendance release

**Files:**
- Test: `tests/hris/*.test.js`
- Test: focused browser/runtime smoke scenarios.

- [ ] Verify Prisma schema/generation and additive migration; existing rows remain unchanged.
- [ ] Verify Admin-only page/API access and employee access fallback with empty/legacy permissions.
- [ ] Verify cross-client Division/branch IDs and cross-employee attendance/request IDs fail.
- [ ] Verify geofence edges, inaccurate GPS rejection, duplicate attendance transitions, face opt-out/manual fallback, and request approval transitions.
- [ ] Run focused Bun domain tests and `bun run typecheck` once after code changes.
- [ ] Smoke-test Admin dashboard, Divisi actions, branch OSM map, employee attendance/log/requests, and existing Admin payroll-bank page in browser.
- [ ] Remove throwaway scripts; keep deterministic tests.
