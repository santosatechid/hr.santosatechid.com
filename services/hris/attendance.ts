export type AttendanceAction = "check-in" | "check-out";

export type AttendanceTimes = {
  checkInAt: Date | null;
  checkOutAt: Date | null;
};

type AttendanceTransition =
  | { ok: true; record: AttendanceTimes }
  | {
      ok: false;
      reason: "invalid-time" | "already-checked-in" | "not-checked-in";
    };

export function transitionAttendance(
  current: AttendanceTimes | null,
  action: AttendanceAction,
  now: Date,
): AttendanceTransition {
  if (!Number.isFinite(now.getTime())) return { ok: false, reason: "invalid-time" };

  if (action === "check-in") {
    if (current?.checkInAt) return { ok: false, reason: "already-checked-in" };
    return { ok: true, record: { checkInAt: now, checkOutAt: null } };
  }

  if (!current?.checkInAt) return { ok: false, reason: "not-checked-in" };
  // Absen pulang boleh diulang; jam pulang yang dipakai adalah yang terakhir.
  return { ok: true, record: { ...current, checkOutAt: now } };
}
