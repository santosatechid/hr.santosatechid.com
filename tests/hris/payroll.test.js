import { expect, test } from "bun:test";

import {
  annualPph21,
  bpjsEmployeeDeductions,
  dailyPph21,
  grossUpPph21,
  monthlyTerRate,
  pph21ForPeriod,
} from "../../services/hris/payroll.ts";

test("applies monthly TER at bracket boundaries", () => {
  expect(monthlyTerRate(30_080_000, "K/0")).toBe(0.13);
  expect(monthlyTerRate(18_450_000, "K/1")).toBe(0.07);
  expect(monthlyTerRate(18_450_001, "K/1")).toBe(0.08);
  expect(monthlyTerRate(134_000_000, "K/3")).toBe(0.25);
});

test("rejects unknown PTKP instead of guessing a category", () => {
  expect(() => monthlyTerRate(10_000_000, "X/9")).toThrow();
});

test("daily TER: 0% to 450rb, 0,5% to 2,5jt, half-gross above", () => {
  expect(dailyPph21(450_000)).toBe(0);
  expect(dailyPph21(450_001)).toBe(2_250);
  expect(dailyPph21(2_500_000)).toBe(12_500);
  expect(dailyPph21(5_001_999)).toBe(125_050);
});

test("annual PPh 21 matches the PMK 168/2023 example", () => {
  expect(
    annualPph21({
      annualGross: 450_960_000,
      employeePensionDeductions: 3_600_000,
      ptkpStatus: "K/0",
      monthsWorked: 12,
    }),
  ).toBe(64_715_000);
});

test("December reconciliation withholds only the yearly difference", () => {
  expect(
    pph21ForPeriod({
      period: "2024-12",
      employeeTaxStatus: "Pegawai Tetap",
      taxSalary: "Taxable",
      ptkpStatus: "K/0",
      gross: 90_080_000,
      yearToDateGross: 360_880_000,
      yearToDateTaxPaid: 50_120_000,
      yearToDatePensionDeductions: 3_300_000,
      pensionDeduction: 300_000,
    }),
  ).toBe(14_595_000);
});

test("December without year-to-date data fails instead of withholding zero", () => {
  expect(() =>
    pph21ForPeriod({
      period: "2026-12",
      employeeTaxStatus: "Pegawai Tetap",
      taxSalary: "Taxable",
      ptkpStatus: "K/0",
      gross: 10_000_000,
    }),
  ).toThrow();
});

test("non-taxable salary yields zero PPh 21", () => {
  expect(
    pph21ForPeriod({
      period: "2026-02",
      employeeTaxStatus: "Pegawai Tetap",
      taxSalary: "Non taxable",
      ptkpStatus: "K/0",
      gross: 10_000_000,
    }),
  ).toBe(0);
});

test("BPJS uses employee shares, family extra, floor, and JP cap", () => {
  expect(
    bpjsEmployeeDeductions({
      period: "2026-03",
      wage: 15_000_000,
      branchWageFloor: 5_000_000,
      additionalFamilyMembers: 1,
      enabled: true,
    }),
  ).toEqual({ jkn: 240_000, jht: 300_000, jp: 110_863 });
  expect(
    bpjsEmployeeDeductions({
      period: "2025-02",
      wage: 15_000_000,
      branchWageFloor: 5_000_000,
      additionalFamilyMembers: 0,
      enabled: true,
    }).jp,
  ).toBe(105_474);
});

test("BPJS refuses a missing wage floor", () => {
  expect(() =>
    bpjsEmployeeDeductions({
      period: "2026-03",
      wage: 15_000_000,
      branchWageFloor: null,
      additionalFamilyMembers: 0,
      enabled: true,
    }),
  ).toThrow();
});

test("gross-up converges and net method keeps employee tax out", () => {
  const gross = 30_080_000;
  const allowance = grossUpPph21(gross, (value) =>
    Math.round(value * monthlyTerRate(value, "K/0")),
  );
  expect(allowance).toBeGreaterThan(0);
  expect(
    Math.round((gross + allowance) * monthlyTerRate(gross + allowance, "K/0")),
  ).toBe(allowance);
});
