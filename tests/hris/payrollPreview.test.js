import { expect, test } from "bun:test";

import { previewPayroll } from "../../lib/payroll/preview.ts";

const BASE = {
  basicSalary: "10000000",
  salaryType: "Monthly",
  ptkpStatus: "TK/0",
  taxMethod: "Gross",
  taxSalary: "Taxable",
  employeeTaxStatus: "Pegawai Tetap",
  bpjsKesehatanFamily: "1",
};

const BOTH = { taxEnabled: true, bpjsEnabled: true };

test("estimasi memakai jalur yang sama dengan mesin payroll", () => {
  expect(previewPayroll(BASE, BOTH, 4_000_000)).toEqual({
    gross: 10_000_000,
    taxAllowance: 0,
    pph21: 200_000,
    jkn: 200_000,
    jht: 200_000,
    jp: 100_000,
    netPay: 9_300_000,
  });
});

test("gaji harian tidak diberi estimasi bulanan", () => {
  expect(
    previewPayroll({ ...BASE, salaryType: "Daily" }, BOTH, 4_000_000),
  ).toContain("Gaji harian");
});

test("BPJS butuh batas upah cabang", () => {
  expect(
    previewPayroll(BASE, { taxEnabled: false, bpjsEnabled: true }, null),
  ).toContain("Batas upah BPJS cabang belum diisi");
});

test("komponen pajak bebas pajak tidak memotong PPh 21", () => {
  const preview = previewPayroll(
    { ...BASE, taxSalary: "Non taxable" },
    { taxEnabled: true, bpjsEnabled: false },
    null,
  );
  expect(typeof preview).toBe("object");
  expect(preview.pph21).toBe(0);
});
