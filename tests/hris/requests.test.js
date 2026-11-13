import { expect, test } from "bun:test";

import { transitionRequest } from "../../services/hris/requests.ts";

test("admin decision closes a pending request", () => {
  expect(transitionRequest("pending", "approve")).toEqual({ ok: true, status: "approved" });
  expect(transitionRequest("pending", "reject")).toEqual({ ok: true, status: "rejected" });
});

test("closed requests cannot be decided twice", () => {
  expect(transitionRequest("approved", "reject")).toEqual({
    ok: false,
    reason: "already-decided",
  });
  expect(transitionRequest("rejected", "approve")).toEqual({
    ok: false,
    reason: "already-decided",
  });
});
