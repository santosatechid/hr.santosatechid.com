export type PtkpStatus =
  | "TK/0"
  | "TK/1"
  | "TK/2"
  | "TK/3"
  | "K/0"
  | "K/1"
  | "K/2"
  | "K/3";

type TerBand = readonly [upperBound: number, basisPoints: number];

const TER_A: readonly TerBand[] = [
  [5_400_000, 0], [5_650_000, 25], [5_950_000, 50], [6_300_000, 75],
  [6_750_000, 100], [7_500_000, 125], [8_550_000, 150], [9_650_000, 175],
  [10_050_000, 200], [10_350_000, 225], [10_700_000, 250], [11_050_000, 300],
  [11_600_000, 350], [12_500_000, 400], [13_750_000, 500], [15_100_000, 600],
  [16_950_000, 700], [19_750_000, 800], [24_150_000, 900], [26_450_000, 1_000],
  [28_000_000, 1_100], [30_050_000, 1_200], [32_400_000, 1_300], [35_400_000, 1_400],
  [39_100_000, 1_500], [43_850_000, 1_600], [47_800_000, 1_700], [51_400_000, 1_800],
  [56_300_000, 1_900], [62_200_000, 2_000], [68_600_000, 2_100], [77_500_000, 2_200],
  [89_000_000, 2_300], [103_000_000, 2_400], [125_000_000, 2_500], [157_000_000, 2_600],
  [206_000_000, 2_700], [337_000_000, 2_800], [454_000_000, 2_900], [550_000_000, 3_000],
  [695_000_000, 3_100], [910_000_000, 3_200], [1_400_000_000, 3_300], [Infinity, 3_400],
];

const TER_B: readonly TerBand[] = [
  [6_200_000, 0], [6_500_000, 25], [6_850_000, 50], [7_300_000, 75],
  [9_200_000, 100], [10_750_000, 150], [11_250_000, 200], [11_600_000, 250],
  [12_600_000, 300], [13_600_000, 400], [14_950_000, 500], [16_400_000, 600],
  [18_450_000, 700], [21_850_000, 800], [26_000_000, 900], [27_700_000, 1_000],
  [29_350_000, 1_100], [31_450_000, 1_200], [33_950_000, 1_300], [37_100_000, 1_400],
  [41_100_000, 1_500], [45_800_000, 1_600], [49_500_000, 1_700], [53_800_000, 1_800],
  [58_500_000, 1_900], [64_000_000, 2_000], [71_000_000, 2_100], [80_000_000, 2_200],
  [93_000_000, 2_300], [109_000_000, 2_400], [129_000_000, 2_500], [163_000_000, 2_600],
  [211_000_000, 2_700], [374_000_000, 2_800], [459_000_000, 2_900], [555_000_000, 3_000],
  [704_000_000, 3_100], [957_000_000, 3_200], [1_405_000_000, 3_300], [Infinity, 3_400],
];

const TER_C: readonly TerBand[] = [
  [6_600_000, 0], [6_950_000, 25], [7_350_000, 50], [7_800_000, 75],
  [8_850_000, 100], [9_800_000, 125], [10_950_000, 150], [11_200_000, 175],
  [12_050_000, 200], [12_950_000, 300], [14_150_000, 400], [15_550_000, 500],
  [17_050_000, 600], [19_500_000, 700], [22_700_000, 800], [26_600_000, 900],
  [28_100_000, 1_000], [30_100_000, 1_100], [32_600_000, 1_200], [35_400_000, 1_300],
  [38_900_000, 1_400], [43_000_000, 1_500], [47_400_000, 1_600], [51_200_000, 1_700],
  [55_800_000, 1_800], [60_400_000, 1_900], [66_700_000, 2_000], [74_500_000, 2_100],
  [83_200_000, 2_200], [95_600_000, 2_300], [110_000_000, 2_400], [134_000_000, 2_500],
  [169_000_000, 2_600], [221_000_000, 2_700], [390_000_000, 2_800], [463_000_000, 2_900],
  [561_000_000, 3_000], [709_000_000, 3_100], [965_000_000, 3_200], [1_419_000_000, 3_300],
  [Infinity, 3_400],
];

const PTKP: Record<PtkpStatus, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

/** PP 58/2023 Art. 17 brackets, verified against PMK 168/2023 examples. */
function progressivePph21(taxableIncome: number) {
  const taxable = Math.max(0, taxableIncome);
  const brackets = [
    [60_000_000, 500],
    [250_000_000, 1_500],
    [500_000_000, 2_500],
    [5_000_000_000, 3_000],
    [Infinity, 3_500],
  ] as const;
  let lowerBound = 0;
  let tax = 0;
  for (const [upperBound, basisPoints] of brackets) {
    const taxableAtRate = Math.max(0, Math.min(taxable, upperBound) - lowerBound);
    tax += Math.round((taxableAtRate * basisPoints) / 10_000);
    lowerBound = upperBound;
    if (taxable <= upperBound) break;
  }
  return tax;
}

export function monthlyTerRate(gross: number, ptkpStatus: PtkpStatus) {
  if (!Number.isFinite(gross) || gross < 0) {
    throw new Error("Penghasilan bruto tidak valid");
  }
  if (!Object.hasOwn(PTKP, ptkpStatus)) throw new Error("Status PTKP tidak dikenal");
  const table =
    ptkpStatus === "K/3"
      ? TER_C
      : ["TK/2", "TK/3", "K/1", "K/2"].includes(ptkpStatus)
        ? TER_B
        : TER_A;
  for (const [upperBound, basisPoints] of table) {
    if (gross <= upperBound) return basisPoints / 10_000;
  }
  return 0.34;
}

export function dailyPph21(grossPerDay: number) {
  if (!Number.isFinite(grossPerDay) || grossPerDay < 0) {
    throw new Error("Penghasilan harian tidak valid");
  }
  if (grossPerDay <= 450_000) return 0;
  if (grossPerDay <= 2_500_000) return Math.round(grossPerDay * 0.005);
  return progressivePph21(grossPerDay * 0.5);
}

export function annualPph21({
  annualGross,
  employeePensionDeductions,
  ptkpStatus,
  monthsWorked,
  previousEmployerNetto = 0,
}: {
  annualGross: number;
  employeePensionDeductions: number;
  ptkpStatus: PtkpStatus;
  monthsWorked: number;
  previousEmployerNetto?: number;
}) {
  if (
    !Number.isFinite(annualGross) || annualGross < 0 ||
    !Number.isFinite(employeePensionDeductions) || employeePensionDeductions < 0 ||
    !Number.isInteger(monthsWorked) || monthsWorked < 1 || monthsWorked > 12 ||
    !Number.isFinite(previousEmployerNetto) || previousEmployerNetto < 0 ||
    !Object.hasOwn(PTKP, ptkpStatus)
  ) {
    throw new Error("Data PPh 21 setahun tidak lengkap");
  }
  const jobExpense = Math.min(annualGross * 0.05, monthsWorked * 500_000);
  const netIncome =
    annualGross - jobExpense - employeePensionDeductions + previousEmployerNetto;
  const taxableIncome =
    Math.floor(Math.max(0, netIncome - PTKP[ptkpStatus]) / 1_000) * 1_000;
  return progressivePph21(taxableIncome);
}

export type PeriodTaxInput = {
  period: string;
  employeeTaxStatus: string;
  salaryType?: string | null;
  taxSalary?: string | null;
  ptkpStatus: PtkpStatus;
  gross: number;
  dailyGross?: number;
  daysWorked?: number;
  yearToDateGross?: number;
  yearToDateTaxPaid?: number;
  yearToDatePensionDeductions?: number;
  pensionDeduction?: number;
  previousEmployerNetto?: number;
  previousEmployerPph21?: number;
};

export function pph21ForPeriod(input: PeriodTaxInput) {
  const match = /^(\d{4})-(\d{2})$/.exec(input.period);
  const month = Number(match?.[2]);
  if (!match || month < 1 || month > 12 || !Number.isFinite(input.gross) || input.gross < 0) {
    throw new Error("Periode atau penghasilan tidak valid");
  }
  if (input.taxSalary === "Non taxable") return 0;
  if (input.taxSalary && input.taxSalary !== "Taxable") {
    throw new Error("Status pajak penghasilan tidak dikenal");
  }

  if (input.employeeTaxStatus === "Pegawai Tetap") {
    if (month < 12) {
      return Math.round(input.gross * monthlyTerRate(input.gross, input.ptkpStatus));
    }
    if (
      input.yearToDateGross === undefined ||
      input.yearToDateTaxPaid === undefined ||
      input.yearToDatePensionDeductions === undefined
    ) {
      throw new Error("Data pajak Januari–November belum lengkap");
    }
    const annualTax = annualPph21({
      annualGross: input.yearToDateGross + input.gross,
      employeePensionDeductions:
        input.yearToDatePensionDeductions + (input.pensionDeduction ?? 0),
      ptkpStatus: input.ptkpStatus,
      monthsWorked: month,
      previousEmployerNetto: input.previousEmployerNetto ?? 0,
    });
    return (
      annualTax -
      input.yearToDateTaxPaid -
      (input.previousEmployerPph21 ?? 0)
    );
  }

  if (input.employeeTaxStatus === "Pegawai Tidak Tetap") {
    if (input.salaryType === "Daily") {
      const { daysWorked, dailyGross } = input;
      if (
        daysWorked === undefined ||
        !Number.isInteger(daysWorked) ||
        daysWorked < 0 ||
        dailyGross === undefined ||
        !Number.isFinite(dailyGross)
      ) {
        throw new Error("Gaji harian butuh upah harian dan jumlah hari hadir");
      }
      return dailyPph21(dailyGross) * daysWorked;
    }
    return Math.round(input.gross * monthlyTerRate(input.gross, input.ptkpStatus));
  }

  if (input.employeeTaxStatus === "Bukan Pegawai") {
    return progressivePph21(input.gross * 0.5);
  }

  throw new Error("Status pajak karyawan tidak dikenal");
}

/** Employee-paid shares only: JKN 1%, JHT 2%, JP 1%. */
export function bpjsEmployeeDeductions({
  period,
  wage,
  branchWageFloor,
  additionalFamilyMembers,
  enabled,
}: {
  period: string;
  wage: number;
  branchWageFloor: number | null;
  additionalFamilyMembers: number;
  enabled: boolean;
}) {
  if (!enabled) return { jkn: 0, jht: 0, jp: 0 };
  if (
    !Number.isFinite(wage) || wage < 0 ||
    !Number.isFinite(branchWageFloor) || branchWageFloor === null || branchWageFloor <= 0 ||
    !Number.isInteger(additionalFamilyMembers) ||
    additionalFamilyMembers < 0 ||
    additionalFamilyMembers > 5
  ) {
    throw new Error("Batas upah BPJS cabang wajib diisi");
  }
  // JP cap: 10.547.400 until Feb 2026, 11.086.300 from Mar 2026
  // (BPJS Ketenagakerjaan notice B/1226/022026).
  const jpCap = period >= "2026-03" ? 11_086_300 : 10_547_400;
  const jknWage = Math.min(Math.max(wage, branchWageFloor), 12_000_000);
  return {
    jkn: Math.round(jknWage * (0.01 + additionalFamilyMembers * 0.01)),
    jht: Math.round(wage * 0.02),
    jp: Math.round(Math.min(wage, jpCap) * 0.01),
  };
}

export function grossUpPph21(
  gross: number,
  calculatePph21: (taxableGross: number) => number,
) {
  if (!Number.isFinite(gross) || gross < 0) {
    throw new Error("Penghasilan bruto tidak valid");
  }
  let allowance = 0;
  for (let attempt = 0; attempt < 64; attempt++) {
    const nextAllowance = Math.round(calculatePph21(gross + allowance));
    if (!Number.isFinite(nextAllowance)) throw new Error("Perhitungan gross-up gagal");
    if (nextAllowance <= 0) return 0;
    if (nextAllowance === allowance) return allowance;
    allowance = nextAllowance;
  }
  throw new Error("Gross-up tidak stabil");
}

export function employeeTakeHome({
  gross,
  pph21,
  bpjs,
  taxMethod,
  taxAllowance = 0,
}: {
  gross: number;
  pph21: number;
  bpjs: number;
  taxMethod: string;
  taxAllowance?: number;
}) {
  if (taxMethod === "Net") return gross - bpjs;
  if (taxMethod === "Gross Up") return gross + taxAllowance - pph21 - bpjs;
  return gross - pph21 - bpjs;
}
