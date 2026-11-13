import { expect, test } from "bun:test";

import {
  SELF_SERVICE_PATHS,
  isAdminRole,
  isOwnedByClient,
  visiblePaths,
} from "../../services/hris/access.ts";

test("admin role gets management and employee routes", () => {
  expect(isAdminRole("Admin")).toBe(true);
  expect(isAdminRole("Super Admin")).toBe(true);
  expect(visiblePaths("Admin", [])).toContain("/dashboard/admin/master/users");
});

test("non-admin with no employee grants gets self-service only", () => {
  expect(isAdminRole("Staff")).toBe(false);
  expect(visiblePaths("Staff", [])).toEqual(SELF_SERVICE_PATHS);
});

test("legacy admin permissions never grant admin routes to employee role", () => {
  expect(
    visiblePaths("Staff", ["/dashboard/admin/master/users"]),
  ).toEqual(SELF_SERVICE_PATHS);
});

test("explicit employee permissions can only reduce self-service routes", () => {
  expect(
    visiblePaths("Staff", ["/dashboard/profile", "/dashboard/admin/master/users"]),
  ).toEqual(["/dashboard/profile"]);
});

test("tenant ownership rejects foreign records", () => {
  expect(isOwnedByClient("client-a", "client-a")).toBe(true);
  expect(isOwnedByClient("client-a", "client-b")).toBe(false);
  expect(isOwnedByClient("client-a", null)).toBe(false);
});
