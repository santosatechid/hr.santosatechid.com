import {
  bpjsEmployeeDeductions,
  employeeTakeHome,
  grossUpPph21,
  pph21ForPeriod,
  type PtkpStatus,
} from "@/services/hris/payroll";

export type PayrollPreview = {
  gross: number;
  taxAllowance: number;
  pph21: number;
  jkn: number;
  jht: number;
  jp: number;
  netPay: number;
};

export type PayrollPreviewFields = Partial<
  Record<
    | "basicSalary"
    | "salaryType"
    | "ptkpStatus"
    | "taxMethod"
    | "taxSalary"
    | "employeeTaxStatus"
    | "bpjsKesehatanFamily",
    string
  >
>;

/**
 * Estimasi potongan memakai fungsi yang sama dengan mesin payroll, jadi angka
 * di form tidak bisa berbeda dari slip yang nanti terbit. Mengembalikan teks
 * alasan kalau datanya belum cukup untuk dihitung.
 */
export function previewPayroll(
  fields: PayrollPreviewFields,
  flags: { taxEnabled: boolean; bpjsEnabled: boolean },
  branchWageFloor: number | null,
): PayrollPreview | string {
  const gross = Number(fields.basicSalary);
  if (!Number.isFinite(gross) || gross <= 0) {
    return "Isi gaji pokok untuk melihat estimasi potongan.";
  }
  if (fields.salaryType === "Daily") {
    return "Gaji harian: potongan dihitung saat payroll dari jumlah absen masuk.";
  }
  if (flags.taxEnabled && !fields.ptkpStatus) {
    return "Pilih status PTKP untuk menghitung PPh 21.";
  }
  if (flags.bpjsEnabled && !branchWageFloor) {
    return "Batas upah BPJS cabang belum diisi. Atur di menu Cabang.";
  }

  const period = new Date().toISOString().slice(0, 7);
  const taxInput = {
    period,
    employeeTaxStatus: fields.employeeTaxStatus || "Pegawai Tetap",
    salaryType: fields.salaryType || "Monthly",
    taxSalary: flags.taxEnabled ? (fields.taxSalary ?? "") : "Non taxable",
    ptkpStatus: (fields.ptkpStatus || "TK/0") as PtkpStatus,
    gross,
  };

  try {
    const taxMethod = fields.taxMethod || "Gross";
    const taxAllowance =
      taxMethod === "Gross Up"
        ? grossUpPph21(gross, (taxableGross) =>
            pph21ForPeriod({ ...taxInput, gross: taxableGross }),
          )
        : 0;
    const pph21 =
      taxMethod === "Gross Up"
        ? pph21ForPeriod({ ...taxInput, gross: gross + taxAllowance })
        : pph21ForPeriod(taxInput);
    const bpjs = bpjsEmployeeDeductions({
      period,
      wage: gross + taxAllowance,
      branchWageFloor,
      additionalFamilyMembers: flags.bpjsEnabled
        ? Number(fields.bpjsKesehatanFamily ?? 0) || 0
        : 0,
      enabled: flags.bpjsEnabled,
    });

    return {
      gross,
      taxAllowance,
      pph21,
      ...bpjs,
      netPay: employeeTakeHome({
        gross,
        pph21,
        bpjs: bpjs.jkn + bpjs.jht + bpjs.jp,
        taxMethod,
        taxAllowance,
      }),
    };
  } catch (error) {
    return error instanceof Error ? error.message : "Estimasi gagal dihitung.";
  }
}
