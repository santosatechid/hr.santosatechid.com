import { expect, test } from "bun:test";

import { isWithinGeofence } from "../../services/hris/geofence.ts";

const branch = { latitude: 0, longitude: 0, radiusMeters: 100 };

const pointAtMeters = (meters, accuracy = 5) => ({
  latitude: 0,
  longitude: (meters / 6_371_000) * (180 / Math.PI),
  accuracy,
});

test("accepts a point inside the configured circle", () => {
  expect(isWithinGeofence(branch, pointAtMeters(50))).toBe(true);
});

test("accepts a point at the radius boundary", () => {
  expect(isWithinGeofence(branch, pointAtMeters(100))).toBe(true);
});

test("rejects a point outside the circle", () => {
  expect(isWithinGeofence(branch, pointAtMeters(101))).toBe(false);
});

test("rejects missing geofence coordinates or radius", () => {
  expect(isWithinGeofence({ ...branch, latitude: null }, pointAtMeters(1))).toBe(false);
  expect(isWithinGeofence({ ...branch, radiusMeters: null }, pointAtMeters(1))).toBe(false);
});

test("rejects missing coordinates and inaccurate GPS", () => {
  expect(isWithinGeofence(branch, { ...pointAtMeters(1), latitude: undefined })).toBe(false);
  expect(isWithinGeofence(branch, pointAtMeters(1, 101))).toBe(false);
});
