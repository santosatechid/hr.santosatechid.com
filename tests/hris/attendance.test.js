import { expect, test } from "bun:test";

import { transitionAttendance } from "../../services/hris/attendance.ts";

test("records check-in and then check-out with server timestamps", () => {
  const checkInAt = new Date("2026-11-09T01:00:00.000Z");
  const checkOutAt = new Date("2026-11-09T10:00:00.000Z");
  const checkedIn = transitionAttendance(null, "check-in", checkInAt);

  expect(checkedIn).toEqual({ ok: true, record: { checkInAt, checkOutAt: null } });
  expect(transitionAttendance(checkedIn.record, "check-out", checkOutAt)).toEqual({
    ok: true,
    record: { checkInAt, checkOutAt },
  });
});

test("rejects duplicate check-in without changing recorded time", () => {
  const checkInAt = new Date("2026-11-09T01:00:00.000Z");

  expect(transitionAttendance({ checkInAt, checkOutAt: null }, "check-in", new Date())).toEqual({
    ok: false,
    reason: "already-checked-in",
  });
});

test("rejects check-out before check-in", () => {
  const checkOutAt = new Date("2026-11-09T10:00:00.000Z");

  expect(transitionAttendance(null, "check-out", checkOutAt)).toEqual({
    ok: false,
    reason: "not-checked-in",
  });
});

test("repeat check-out keeps the latest time", () => {
  const checkInAt = new Date("2026-11-09T01:00:00.000Z");
  const firstOut = new Date("2026-11-09T10:00:00.000Z");
  const secondOut = new Date("2026-11-09T12:30:00.000Z");

  const updated = transitionAttendance(
    { checkInAt, checkOutAt: firstOut },
    "check-out",
    secondOut,
  );

  expect(updated).toEqual({
    ok: true,
    record: { checkInAt, checkOutAt: secondOut },
  });
});
