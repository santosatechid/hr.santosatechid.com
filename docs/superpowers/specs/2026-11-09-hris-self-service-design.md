# Employee Access and Attendance Design

## Goal

Make admin access role-safe and give employees simple profile, attendance, attendance-log, and request flows. Division management is part of this phase; payroll and payslips return after attendance is complete.

## Role and route access

- A role whose name contains `admin` (case-insensitive, matching existing role checks) can use management pages and employee self-service.
- Non-admin roles can use only profile, attendance, attendance logs, and requests.
- A non-admin visiting `/dashboard` is redirected to `/dashboard/attendance`; Admin keeps management dashboard.
- Admin routes stay denied to non-admin roles even if legacy `Role.permissions` lists them. Non-admin permissions are intersected with self-service allowlist; empty or legacy admin-only lists default to full self-service allowlist.
- Admin pages and APIs enforce role access on server. Hiding sidebar items is not authorization.
- Employee APIs derive employee identity from authenticated session and never accept a target employee ID from browser.

## Division management

- Add tenant-owned `Division` with unique name per client, optional description, active state, and employee relation.
- Each employee has zero or one division; existing employees remain unassigned.
- Admin gets searchable/sortable Divisi table with add, details, edit, delete actions.
- Employee form, list, and profile show optional division.
- Deleting a division clears employee assignment and preserves employee rows.

## Branch geofence and map

- Add optional latitude, longitude, and `radiusMeters` to each branch.
- Admin sets branch center and attendance radius with OpenStreetMap-backed map.
- Use circular geofences; default radius is 100 meters and admin can change it.
- Employees can check in/out only at assigned branch. Browser sends GPS coordinates and accuracy; server requires accuracy of 100 meters or better, validates point against stored branch geofence, and records server time.
- Use HTTPS OSM tiles, visible attribution, normal tile caching, and no bulk prefetch. Standard OSM tile server is best-effort without SLA; tile URL stays replaceable.

## Face matching and privacy

- Face enrollment is optional and requires each employee's explicit consent.
- Load `@vladmandic/human` and local face model only on enrollment and attendance screens; do not call an external face-recognition API.
- Process capture and compare template on employee device. Do not persist or upload raw capture images.
- Store face template encrypted; require `FACE_TEMPLATE_ENCRYPTION_KEY` in deployment and return decrypted template only to its authenticated owner for local comparison.
- Remove template when employee withdraws consent or employee record is deleted.
- Employees who decline or fail face matching can request manual attendance entry; admin approval records who approved it and why.
- Face matching is a convenience check, not authorization. Modified browsers can bypass it, and photos/videos can spoof it; no liveness detection is included.

## Attendance and requests

- Store one attendance record per employee/work date with check-in/out times, assigned branch, coordinates, accuracy, and method.
- Check-in/out use server time; duplicate check-in/out transitions fail without overwriting existing times.
- Employee log shows only their own attendance.
- Employee can request corrections to date/check-in/check-out with reason. Admin approves/rejects; approval keeps original values and audit trail.
- Employee can request leave with type, date range, reason. Admin approves/rejects and can add response note.
- Leave requests do not calculate accrual balances or automatically change pay; no accrual/pay-proration policy exists in current schema.

## History retention

- Keep attendance and request history when an employee or branch is no longer active.
- Admin deactivates employees/branches instead of hard-deleting them after attendance or requests exist.
- Division deletion remains allowed and clears only employee division assignments.

## Payroll and payslips

- Admin builds a draft payroll per period from `basicSalary` (monthly) or `basicSalary x hari hadir` (daily), then publishes it; publishing is final and cannot be recalculated.
- PPh 21 uses TER monthly for Jan–Nov, annual reconciliation in December, daily TER for daily workers, and 50% x Art. 17 for non-employees.
- BPJS deducts employee shares only (JKN 1% + 1% per extra family member, JHT 2%, JP 1%); employer JKK/JKM never appears on the employee slip.
- Branch `bpjsWageFloor` supplies the JKN wage floor; the JP cap follows the BPJS notice in force for the period.
- Missing statutory data blocks the draft instead of defaulting to zero; employees without `basicSalary` are skipped and reported.
- Published slips are immutable snapshots; employees see only their own published slips and can print them.

## Data migration and compatibility

- Schema changes are additive. Existing clients, branches, employees, roles, and payroll fields remain intact.
- Existing employees start with no division, attendance, or face template.
- Existing branch coordinates/radii remain null until Admin configures them; attendance is unavailable at unconfigured branches.
- Non-admin roles with empty permissions lose implicit access to management routes.

## Acceptance and security

- Non-admin cannot access admin pages or APIs by direct URL/API request.
- Non-admin cannot read another employee's profile, attendance, or requests by changing IDs.
- Admin data remains client-scoped across divisions, branches, attendance, and requests.
- Geofence rejects missing, inaccurate, or out-of-radius locations and uses server timestamps.
- Face opt-out/fallback works without storing a biometric template.
- Correction and leave approvals preserve audit history.

## Reference sources

- OSM tile requirements: https://operations.osmfoundation.org/policies/tiles/
- Face model implementation and licensing: https://github.com/vladmandic/Human/wiki/Models and https://github.com/becauseofAI/MobileFace
