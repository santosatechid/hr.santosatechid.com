"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ListPlus } from "lucide-react";

import { useGetBranchs } from "@/hooks/branches/useBranches";
import { useGetDivisions } from "@/hooks/divisions/useDivisions";
import { useGetCities, useGetProvinces } from "@/hooks/regions/useRegions";
import { useGetRoles } from "@/hooks/roles/useRoles";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "@/hooks/users/useUsers";
import {
  getErrorMessage,
  type PayrollFields,
  type UserDataTypes,
} from "@/types";
import { previewPayroll } from "@/lib/payroll/preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alertDialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export type UserData = UserDataTypes;

type FormState = {
  employeeId: string;
  fullName: string;
  email: string;
  position: string;
  phoneNumber: string;
  roleId: string;
  branchId: string;
  divisionId: string;
  status: string;
  birthPlace: string;
  birthDate: string;
  startDate: string;
  gender: string;
  maritalStatus: string;
  bloodType: string;
  religion: string;
  nik: string;
  country: string;
  citizenIdAddress: string;
  province: string;
  city: string;
  postalCode: string;
};

const EMPTY_FORM: FormState = {
  employeeId: "",
  fullName: "",
  email: "",
  position: "",
  phoneNumber: "",
  roleId: "",
  branchId: "",
  divisionId: "",
  status: "active",
  birthPlace: "",
  birthDate: "",
  startDate: "",
  gender: "",
  maritalStatus: "",
  bloodType: "",
  religion: "",
  nik: "",
  country: "Indonesia",
  citizenIdAddress: "",
  province: "",
  city: "",
  postalCode: "",
};

const PTKP_STATUSES = [
  "TK/0",
  "TK/1",
  "TK/2",
  "TK/3",
  "K/0",
  "K/1",
  "K/2",
  "K/3",
];

const EMPLOYEE_TAX_STATUSES = [
  "Pegawai Tetap",
  "Pegawai Tidak Tetap",
  "Bukan Pegawai",
];

const SALARY_TYPES = ["Monthly", "Daily"];
const OVERTIME_SETTINGS = ["Eligible", "Not eligible"];
const TAX_METHODS = ["Gross", "Net", "Gross Up"];
const TAX_SALARY_OPTIONS = ["Taxable", "Non taxable"];
const BPJS_FAMILY_SIZES = ["0", "1", "2", "3", "4", "5"];

const PTKP_LABELS: Record<string, string> = {
  "TK/0": "TK/0 — lajang, 54 jt",
  "TK/1": "TK/1 — 58,5 jt",
  "TK/2": "TK/2 — 63 jt",
  "TK/3": "TK/3 — 67,5 jt",
  "K/0": "K/0 — kawin, 58,5 jt",
  "K/1": "K/1 — kawin + 1, 63 jt",
  "K/2": "K/2 — kawin + 2, 67,5 jt",
  "K/3": "K/3 — kawin + 3, 72 jt",
};

const BPJS_FAMILY_LABELS: Record<string, string> = Object.fromEntries(
  BPJS_FAMILY_SIZES.map((size) => [
    size,
    size === "0" ? "0 — karyawan saja" : `${size} anggota tambahan`,
  ]),
);

type PayrollFlag = "taxEnabled" | "bpjsEnabled";
type PayrollKey = Exclude<keyof PayrollFields, PayrollFlag>;

type PayrollFieldSpec = {
  key: PayrollKey;
  label: string;
  type?: "text" | "date" | "number" | "select";
  options?: string[];
  optionLabels?: Record<string, string>;
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

const PAYROLL_SECTIONS: {
  label: string;
  fields: PayrollFieldSpec[];
  enableKey?: PayrollFlag;
}[] = [
  {
    label: "Gaji & pembayaran",
    fields: [
      {
        key: "basicSalary",
        label: "Gaji pokok (Rp)",
        type: "number",
        placeholder: "0",
        hint: "Dasar PPh 21 dan BPJS. Gaji harian dikali jumlah absen masuk.",
      },
      {
        key: "salaryType",
        label: "Jenis gaji",
        type: "select",
        options: SALARY_TYPES,
        optionLabels: { Monthly: "Bulanan", Daily: "Harian" },
      },
      {
        key: "overtimeSetting",
        label: "Atur lembur",
        type: "select",
        options: OVERTIME_SETTINGS,
        optionLabels: { Eligible: "Dapat lembur", "Not eligible": "Tidak dapat" },
      },
    ],
  },
  {
    label: "Rekening bank",
    fields: [
      { key: "bankName", label: "Nama bank" },
      { key: "bankAccount", label: "Nomor rekening" },
      { key: "bankAccountHolder", label: "Nama pemilik rekening" },
    ],
  },
  {
    label: "Pajak (PPh 21)",
    enableKey: "taxEnabled",
    fields: [
      {
        key: "ptkpStatus",
        label: "Status PTKP",
        type: "select",
        options: PTKP_STATUSES,
        optionLabels: PTKP_LABELS,
        required: true,
        hint: "Menentukan penghasilan tidak kena pajak setahun.",
      },
      {
        key: "employeeTaxStatus",
        label: "Status karyawan",
        type: "select",
        options: EMPLOYEE_TAX_STATUSES,
        required: true,
        hint: "Tetap memakai TER bulanan; Desember dihitung setahun penuh.",
      },
      {
        key: "taxMethod",
        label: "Metode pemotongan",
        type: "select",
        options: TAX_METHODS,
        optionLabels: {
          Gross: "Gross — PPh 21 dipotong dari gaji",
          Net: "Net — perusahaan menanggung PPh 21",
          "Gross Up": "Gross Up — tunjangan pajak ditambahkan",
        },
      },
      {
        key: "taxSalary",
        label: "Komponen pajak",
        type: "select",
        options: TAX_SALARY_OPTIONS,
        optionLabels: {
          Taxable: "Kena pajak",
          "Non taxable": "Bebas pajak",
        },
      },
      {
        key: "npwp",
        label: "NPWP 15 digit (opsional)",
        placeholder: "00.000.000.0-000.000",
        hint: "Untuk bukti potong dan pelaporan.",
      },
    ],
  },
  {
    label: "BPJS",
    enableKey: "bpjsEnabled",
    fields: [
      {
        key: "bpjsKesehatanFamily",
        label: "Keluarga ikut BPJS Kesehatan",
        type: "select",
        options: BPJS_FAMILY_SIZES,
        optionLabels: BPJS_FAMILY_LABELS,
        hint: "JKN karyawan 1%, tiap anggota tambahan 1% dari upah.",
      },
    ],
  },
];

const PAYROLL_FIELDS = PAYROLL_SECTIONS.flatMap((section) => section.fields);

type PayrollState = Record<PayrollKey, string>;

// Metode & komponen pajak punya default yang sama dengan mesin payroll.
const PAYROLL_DEFAULTS: Partial<PayrollState> = {
  salaryType: "Monthly",
  taxMethod: "Gross",
  taxSalary: "Taxable",
};

const EMPTY_PAYROLL = {
  ...Object.fromEntries(PAYROLL_FIELDS.map((field) => [field.key, ""])),
  ...PAYROLL_DEFAULTS,
} as PayrollState;

const toPayrollState = (data: PayrollFields): PayrollState =>
  ({
    ...PAYROLL_DEFAULTS,
    ...Object.fromEntries(
      PAYROLL_FIELDS.map((field) => {
        const value = data[field.key];
        if (value === null || value === undefined) return [field.key, ""];
        return [
          field.key,
          field.type === "date" ? toDateInput(value) : String(value),
        ];
      }),
    ),
  }) as PayrollState;

const PAYROLL_FIELD_FLAGS: Partial<Record<PayrollKey, PayrollFlag>> =
  Object.fromEntries(
    PAYROLL_SECTIONS.flatMap((section) =>
      section.enableKey
        ? section.fields.map((field) => [field.key, section.enableKey])
        : [],
    ),
  );

const toPayrollPayload = (
  state: PayrollState,
  flags: Record<PayrollFlag, boolean>,
) => ({
  ...Object.fromEntries(
    PAYROLL_FIELDS.map((field) => {
      const gate = PAYROLL_FIELD_FLAGS[field.key];
      const raw = gate && !flags[gate] ? "" : state[field.key].trim();
      if (!raw) return [field.key, null];
      if (field.type === "date") return [field.key, toIso(raw)];
      if (field.type === "number") return [field.key, Number(raw)];
      return [field.key, raw];
    }),
  ),
  ...flags,
});

const GENDERS = ["Laki-laki", "Perempuan"];
const MARITAL_STATUSES = ["Belum menikah", "Menikah", "Cerai"];
const BLOOD_TYPES = ["A", "B", "AB", "O", "Tidak tahu"];
const RELIGIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
];

const toDateInput = (value?: Date | string | number | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toIso = (value: string) => (value ? new Date(value).toISOString() : null);

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Employee ID = tanggal masuk + tanggal lahir, format EMP-YYMMDD-YYMMDD.
const employeeIdFrom = (startDate: string, birthDate: string) =>
  startDate && birthDate
    ? `EMP-${startDate.slice(2).replaceAll("-", "")}-${birthDate
        .slice(2)
        .replaceAll("-", "")}`
    : "";

function Field({
  label,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[8px] font-extrabold tracking-[0.8px] text-[#A5ABB5] uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}

function EnumSelect({
  value,
  onChange,
  options,
  optionLabels,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
  placeholder: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PayrollInput({
  field,
  value,
  onChange,
}: {
  field: PayrollFieldSpec;
  value: string;
  onChange: (value: string) => void;
}) {
  const hint = field.hint ? (
    <p className="text-muted-foreground text-[11px]">{field.hint}</p>
  ) : null;

  if (field.type === "select") {
    return (
      <Field label={field.label} required={field.required}>
        <EnumSelect
          value={value}
          onChange={onChange}
          options={field.options ?? []}
          optionLabels={field.optionLabels}
          placeholder="Pilih dulu"
        />
        {hint}
      </Field>
    );
  }

  return (
    <Field
      label={field.label}
      htmlFor={`payroll-${field.key}`}
      required={field.required}
    >
      <Input
        id={`payroll-${field.key}`}
        type={
          field.type === "date" || field.type === "number" ? field.type : "text"
        }
        step={field.type === "number" ? "0.01" : undefined}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint}
    </Field>
  );
}

export function UserFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: UserData | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [payroll, setPayroll] = useState<PayrollState>(EMPTY_PAYROLL);
  const [payrollFlags, setPayrollFlags] = useState<
    Record<PayrollFlag, boolean>
  >({
    taxEnabled: false,
    bpjsEnabled: false,
  });
  const [tab, setTab] = useState("profil");
  const [showDetails, setShowDetails] = useState(false);
  const isCreate = !editData;
  const { data: roles = [] } = useGetRoles();
  const { data: branches = [] } = useGetBranchs();
  const { data: divisions = [] } = useGetDivisions();
  const { data: provinces = [] } = useGetProvinces();
  const provinceId =
    provinces.find(
      (province) =>
        province.name.toLowerCase() === (form.province || "").toLowerCase(),
    )?.id ?? "";
  const { data: cities = [] } = useGetCities(provinceId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSaving = createUser.isPending || updateUser.isPending;
  const branchWageFloor =
    branches.find((branch) => branch.id === form.branchId)?.bpjsWageFloor ??
    null;
  const preview = previewPayroll(payroll, payrollFlags, branchWageFloor);

  useEffect(() => {
    if (!open) return;

    setTab("profil");
    setShowDetails(false);
    setPayroll(editData ? toPayrollState(editData) : EMPTY_PAYROLL);
    setPayrollFlags({
      taxEnabled: editData?.taxEnabled ?? false,
      bpjsEnabled: editData?.bpjsEnabled ?? false,
    });
    setForm(
      editData
        ? {
            employeeId:
              employeeIdFrom(
                toDateInput(editData.startDate),
                toDateInput(editData.birthDate),
              ) ||
              editData.employeeId ||
              "",
            fullName: editData.name || "",
            position: editData.position || "",
            email: editData.email || "",
                      phoneNumber: editData.phoneNumber || "",
            roleId: editData.roleId || "",
            branchId: editData.branchId || "",
            divisionId: editData.divisionId || "",
            status: editData.status || "active",
            birthPlace: editData.birthPlace || "",
            birthDate: toDateInput(editData.birthDate),
            startDate: toDateInput(editData.startDate),
            gender: editData.gender || "",
            maritalStatus: editData.maritalStatus || "",
            bloodType: editData.bloodType || "",
            religion: editData.religion || "",
            nik: editData.nik || "",
            country: editData.country || "",
            citizenIdAddress: editData.citizenIdAddress || "",
            province: editData.province || "",
            city: editData.city || "",
            postalCode: editData.postalCode || "",
          }
        : { ...EMPTY_FORM },
    );
  }, [open, editData]);

  // Role akses default ke Employee supaya nama + email saja sudah cukup.
  useEffect(() => {
    if (!open || editData) return;
    const fallback = roles.find((role) =>
      role.name.toLowerCase().includes("employee"),
    );
    if (!fallback) return;
    setForm((current) =>
      current.roleId ? current : { ...current, roleId: fallback.id },
    );
  }, [open, editData, roles]);

  const update = (patch: Partial<FormState>) =>
    setForm((current) => {
      const next = { ...current, ...patch };
      if (patch.startDate === undefined && patch.birthDate === undefined) {
        return next;
      }
      const generated = employeeIdFrom(next.startDate, next.birthDate);
      return generated ? { ...next, employeeId: generated } : next;
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const missing: string[] = [];
    if (isCreate) {
      if (!form.fullName.trim()) missing.push("Nama lengkap");
      if (!form.email.trim()) missing.push("Email");
      if (!form.roleId) missing.push("Role akses");
    } else {
      if (!form.employeeId.trim()) missing.push("ID karyawan");
      if (!form.fullName.trim()) missing.push("Nama lengkap");
      if (!form.email.trim()) missing.push("Email");
      if (!form.birthDate) missing.push("Tanggal lahir");
      if (!form.startDate) missing.push("Tanggal bergabung");
      if (!form.gender) missing.push("Jenis kelamin");
      if (!form.maritalStatus) missing.push("Status pernikahan");
      if (!form.religion) missing.push("Agama");
      if (!form.roleId) missing.push("Role");
      for (const section of PAYROLL_SECTIONS) {
        if (section.enableKey && !payrollFlags[section.enableKey]) continue;
        for (const field of section.fields) {
          if (field.required && !payroll[field.key].trim()) {
            missing.push(field.label);
          }
        }
      }
    }
    if (missing.length > 0) {
      toast.error(`Lengkapi dulu data wajib ini: ${missing.join(", ")}.`);
      return;
    }
    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");
    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName: lastName || null,
      employeeId: form.employeeId.trim() || null,
      position: form.position.trim() || null,
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      roleId: form.roleId,
      branchId: form.branchId || null,
      divisionId: form.divisionId || null,
      status: form.status,
      isActive: form.status !== "inactive",
      birthPlace: form.birthPlace.trim() || null,
      birthDate: toIso(form.birthDate),
      startDate: toIso(form.startDate),
      gender: form.gender,
      maritalStatus: form.maritalStatus,
      bloodType: form.bloodType || null,
      religion: form.religion,
      nik: form.nik.trim() || null,
      country: form.country.trim() || null,
      citizenIdAddress: form.citizenIdAddress.trim() || null,
      province: form.province.trim() || null,
      city: form.city.trim() || null,
      postalCode: form.postalCode.trim() || null,
      ...toPayrollPayload(payroll, payrollFlags),
    };

    try {
      if (editData) {
        await updateUser.mutateAsync({ id: editData.id, ...payload });
        toast.success("Data karyawan berhasil diperbarui.");
      } else {
        await createUser.mutateAsync(payload);
        toast.success("Data karyawan berhasil dibuat.");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] gap-0 overflow-y-auto p-0 ${
          isCreate ? "sm:max-w-xl" : "sm:max-w-3xl"
        }`}
      >
        <DialogHeader className="border-border border-b px-5 py-4">
          <DialogTitle>
            {editData ? "Edit data karyawan" : "Tambah karyawan"}
          </DialogTitle>
          <DialogDescription className="text-[11.5px]">
            {editData
              ? "Ubah data karyawan, payroll, atau akses login."
              : "Nama & email saja sudah cukup untuk mulai."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            {isCreate ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama lengkap" htmlFor="full-name" required>
                    <Input
                      id="full-name"
                      value={form.fullName}
                      onChange={(event) =>
                        update({ fullName: event.target.value })
                      }
                      placeholder="Ayu Lestari"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Email kerja" htmlFor="user-email" required>
                    <Input
                      id="user-email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        update({ email: event.target.value })
                      }
                      placeholder="ayu.lestari@santosa.id"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Jabatan" htmlFor="position">
                    <Input
                      id="position"
                      value={form.position}
                      onChange={(event) =>
                        update({ position: event.target.value })
                      }
                      placeholder="Staf Operasional"
                    />
                  </Field>
                  <Field label="Tanggal bergabung" htmlFor="start-date">
                    <Input
                      id="start-date"
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        update({ startDate: event.target.value })
                      }
                    />
                  </Field>
                </div>

                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="ring-hr-line hover:bg-hr-panel flex w-full items-center gap-2.5 rounded-[10px] bg-white px-3.5 py-3 text-left ring-1 transition-colors"
                    >
                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                        <ListPlus className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-extrabold">
                          Detail lain (opsional)
                        </span>
                        <span className="text-muted-foreground block truncate text-[10.5px] font-medium">
                          Role akses, NIK, HP, data pribadi — isi nanti juga
                          boleh.
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={`text-muted-foreground size-3.5 shrink-0 transition-transform ${
                          showDetails ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-3 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Role akses" required>
                        <Select
                          value={form.roleId || "none"}
                          onValueChange={(value) =>
                            update({ roleId: value === "none" ? "" : value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih role</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Nomor HP" htmlFor="phone-number">
                        <Input
                          id="phone-number"
                          value={form.phoneNumber}
                          onChange={(event) =>
                            update({ phoneNumber: event.target.value })
                          }
                          placeholder="0812xxxxxxx"
                          inputMode="tel"
                        />
                      </Field>
                      <Field label="ID karyawan" htmlFor="employee-id">
                        <Input
                          id="employee-id"
                          value={form.employeeId}
                          readOnly
                          placeholder="Terisi dari tanggal bergabung + lahir"
                          className="bg-muted/50"
                        />
                      </Field>
                      <Field label="Tanggal lahir" htmlFor="birth-date">
                        <Input
                          id="birth-date"
                          type="date"
                          value={form.birthDate}
                          onChange={(event) =>
                            update({ birthDate: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Jenis kelamin">
                        <EnumSelect
                          value={form.gender}
                          onChange={(value) => update({ gender: value })}
                          options={GENDERS}
                          placeholder="Pilih jenis kelamin"
                        />
                      </Field>
                      <Field label="Status pernikahan">
                        <EnumSelect
                          value={form.maritalStatus}
                          onChange={(value) =>
                            update({ maritalStatus: value })
                          }
                          options={MARITAL_STATUSES}
                          placeholder="Pilih status"
                        />
                      </Field>
                      <Field label="Agama">
                        <EnumSelect
                          value={form.religion}
                          onChange={(value) => update({ religion: value })}
                          options={RELIGIONS}
                          placeholder="Pilih agama"
                        />
                      </Field>
                      <Field label="NIK" htmlFor="nik">
                        <Input
                          id="nik"
                          value={form.nik}
                          onChange={(event) =>
                            update({ nik: event.target.value })
                          }
                          placeholder="16 digit NIK"
                          inputMode="numeric"
                        />
                      </Field>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Gaji, rekening, pajak, dan BPJS diisi lewat menu Ubah
                      data sebelum payroll pertama.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="profil">Profil</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>

              <TabsContent value="profil" className="space-y-5">
                <FieldGroup label="Akun & penempatan">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="ID karyawan" htmlFor="employee-id" required>
                      <Input
                        id="employee-id"
                        value={form.employeeId}
                        readOnly
                        placeholder="Isi tanggal mulai kerja dan tanggal lahir"
                        className="bg-muted/50"
                      />
                      <p className="text-muted-foreground text-[11px]">
                        Terisi otomatis dari tanggal mulai kerja dan tanggal lahir.
                      </p>
                    </Field>
                    <Field
                      label="Nama lengkap"
                      htmlFor="full-name"
                      required
                      className="sm:col-span-2"
                    >
                      <Input
                        id="full-name"
                        value={form.fullName}
                        onChange={(event) =>
                          update({ fullName: event.target.value })
                        }
                        placeholder="Rizky Pratama"
                      />
                    </Field>
                    <Field label="Jabatan" htmlFor="position">
                      <Input
                        id="position"
                        value={form.position}
                        onChange={(event) =>
                          update({ position: event.target.value })
                        }
                        placeholder="Software Engineer"
                      />
                    </Field>
                    <Field label="Email" htmlFor="user-email" required>
                      <Input
                        id="user-email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          update({ email: event.target.value })
                        }
                        placeholder="email@example.com"
                      />
                    </Field>
                    <Field label="Nomor HP" htmlFor="phone-number">
                      <Input
                        id="phone-number"
                        value={form.phoneNumber}
                        onChange={(event) =>
                          update({ phoneNumber: event.target.value })
                        }
                        placeholder="0812xxxxxxx"
                      />
                    </Field>
                    <Field label="Role" required>
                      <Select
                        value={form.roleId || "none"}
                        onValueChange={(value) =>
                          update({ roleId: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Pilih role</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Cabang">
                      <Select
                        value={form.branchId || "none"}
                        onValueChange={(value) =>
                          update({ branchId: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanpa cabang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa cabang</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Divisi">
                      <Select
                        value={form.divisionId || "none"}
                        onValueChange={(value) =>
                          update({ divisionId: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanpa divisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa divisi</SelectItem>
                          {divisions
                            .filter((division) => division.isActive)
                            .map((division) => (
                              <SelectItem key={division.id} value={division.id}>
                                {division.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Status">
                      <Select
                        value={form.status}
                        onValueChange={(value) => update({ status: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </FieldGroup>

                <FieldGroup label="Data pribadi">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Kota lahir" htmlFor="birth-place">
                      <Input
                        id="birth-place"
                        value={form.birthPlace}
                        onChange={(event) =>
                          update({ birthPlace: event.target.value })
                        }
                        placeholder="Jakarta"
                      />
                    </Field>
                    <Field label="Tanggal lahir" htmlFor="birth-date" required>
                      <Input
                        id="birth-date"
                        type="date"
                        value={form.birthDate}
                        onChange={(event) =>
                          update({ birthDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Tanggal mulai kerja" htmlFor="start-date" required>
                      <Input
                        id="start-date"
                        type="date"
                        value={form.startDate}
                        onChange={(event) =>
                          update({ startDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Jenis kelamin" required>
                      <EnumSelect
                        value={form.gender}
                        onChange={(value) => update({ gender: value })}
                        options={GENDERS}
                        placeholder="Pilih jenis kelamin"
                      />
                    </Field>
                    <Field label="Status pernikahan" required>
                      <EnumSelect
                        value={form.maritalStatus}
                        onChange={(value) => update({ maritalStatus: value })}
                        options={MARITAL_STATUSES}
                        placeholder="Pilih status"
                      />
                    </Field>
                    <Field label="Golongan darah">
                      <EnumSelect
                        value={form.bloodType}
                        onChange={(value) => update({ bloodType: value })}
                        options={BLOOD_TYPES}
                        placeholder="Pilih golongan darah"
                      />
                    </Field>
                    <Field label="Agama" required>
                      <EnumSelect
                        value={form.religion}
                        onChange={(value) => update({ religion: value })}
                        options={RELIGIONS}
                        placeholder="Pilih agama"
                      />
                    </Field>
                    <Field label="NIK" htmlFor="nik">
                      <Input
                        id="nik"
                        value={form.nik}
                        onChange={(event) =>
                          update({ nik: event.target.value })
                        }
                        placeholder="16 digit NIK"
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                </FieldGroup>

                <FieldGroup label="Alamat">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Negara" htmlFor="country">
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(event) =>
                          update({ country: event.target.value })
                        }
                        placeholder="Indonesia"
                      />
                    </Field>
                    <Field label="Kode pos" htmlFor="postal-code">
                      <Input
                        id="postal-code"
                        value={form.postalCode}
                        onChange={(event) =>
                          update({ postalCode: event.target.value })
                        }
                        placeholder="12345"
                        inputMode="numeric"
                      />
                    </Field>
                    <Field label="Provinsi">
                      <Select
                        value={form.province || undefined}
                        onValueChange={(value) =>
                          update({ province: value, city: "" })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.name}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Kota">
                      <Select
                        value={form.city || undefined}
                        onValueChange={(value) => update({ city: value })}
                        disabled={!provinceId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              provinceId ? "Pilih kota" : "Pilih provinsi dulu"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Alamat sesuai KTP"
                      htmlFor="citizen-id-address"
                      className="sm:col-span-2"
                    >
                      <Input
                        id="citizen-id-address"
                        value={form.citizenIdAddress}
                        onChange={(event) =>
                          update({ citizenIdAddress: event.target.value })
                        }
                        placeholder="Alamat sesuai KTP"
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="payroll" className="space-y-5">
                <div className="border-border bg-secondary/40 rounded-2xl border px-4 py-3">
                  <p className="text-muted-foreground text-[10px] font-extrabold tracking-[0.8px] uppercase">
                    Data karyawan
                  </p>
                  <p className="text-sm font-semibold">
                    {form.employeeId || "—"} · {form.fullName.trim() || "—"}
                  </p>
                </div>

                {PAYROLL_SECTIONS.map((section) => {
                  const flag = section.enableKey;
                  const enabled = flag ? payrollFlags[flag] : true;
                  return (
                    <FieldGroup key={section.label} label={section.label}>
                      {flag ? (
                        <div className="border-border flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                          <p className="text-muted-foreground text-xs">
                            {enabled
                              ? "Aktif — isi kolom di bawah, ya."
                              : "Nonaktif — nyalakan kalau karyawan ikut potongan ini."}
                          </p>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              setPayrollFlags((current) => ({
                                ...current,
                                [flag]: checked === true,
                              }))
                            }
                          />
                        </div>
                      ) : null}
                      {enabled ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {section.fields.map((field) => (
                            <PayrollInput
                              key={field.key}
                              field={field}
                              value={payroll[field.key]}
                              onChange={(value) =>
                                setPayroll((current) => ({
                                  ...current,
                                  [field.key]: value,
                                }))
                              }
                            />
                          ))}
                        </div>
                      ) : null}
                    </FieldGroup>
                  );
                })}

                <div className="border-border bg-secondary/40 rounded-2xl border px-4 py-3">
                  <p className="text-muted-foreground text-[10px] font-extrabold tracking-[0.8px] uppercase">
                    Estimasi potongan bulan ini
                  </p>
                  {typeof preview === "string" ? (
                    <p className="text-muted-foreground mt-1 text-[11.5px]">
                      {preview}
                    </p>
                  ) : (
                    <dl className="mt-2 space-y-1 text-[12px]">
                      {(
                        [
                          ["Gaji pokok", preview.gross],
                          ...(preview.taxAllowance > 0
                            ? ([
                                ["Tunjangan pajak", preview.taxAllowance],
                              ] as [string, number][])
                            : []),
                          ...(preview.pph21 > 0
                            ? ([["PPh 21", -preview.pph21]] as [
                                string,
                                number,
                              ][])
                            : []),
                          ...(preview.jkn > 0
                            ? ([["JKN 1%", -preview.jkn]] as [
                                string,
                                number,
                              ][])
                            : []),
                          ...(preview.jht > 0
                            ? ([["JHT 2%", -preview.jht]] as [
                                string,
                                number,
                              ][])
                            : []),
                          ...(preview.jp > 0
                            ? ([["Jaminan Pensiun 1%", -preview.jp]] as [
                                string,
                                number,
                              ][])
                            : []),
                        ] as [string, number][]
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between"
                        >
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="tabular-nums">{rupiah.format(value)}</dd>
                        </div>
                      ))}
                      <div className="border-border mt-1 flex items-center justify-between border-t pt-1.5">
                        <dt className="font-bold">Estimasi terima</dt>
                        <dd className="font-extrabold tabular-nums">
                          {rupiah.format(preview.netPay)}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            )}
          </div>

          <div className="border-border bg-popover sticky bottom-0 flex items-center justify-between gap-2 border-t px-5 py-3">
            <p className="text-muted-foreground text-[10.5px] font-semibold">
              {isCreate
                ? "Hanya nama & email yang wajib"
                : "Perubahan langsung tersimpan saat Simpan"}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData | null;
  onSuccess: () => void;
}) {
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!userData) return;
    try {
      await deleteUser.mutateAsync(userData.id);
      toast.success("Data karyawan berhasil dihapus.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus karyawan?</AlertDialogTitle>
          <AlertDialogDescription>
            Data <strong>{userData?.name}</strong> bakal dihapus permanen.
            Akun loginnya tetap ada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {deleteUser.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
