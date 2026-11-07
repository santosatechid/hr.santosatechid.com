"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useGetBranchs } from "@/hooks/branches/useBranches";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export type UserData = UserDataTypes;

type FormState = {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  additionalPhone: string;
  roleId: string;
  branchId: string;
  status: string;
  isActive: boolean;
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
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
  additionalPhone: "",
  roleId: "",
  branchId: "",
  status: "active",
  isActive: true,
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
const POLICY_OPTIONS = ["Default"];

type PayrollFlag = "taxEnabled" | "bpjsEnabled";
type PayrollKey = Exclude<keyof PayrollFields, PayrollFlag>;

type PayrollFieldSpec = {
  key: PayrollKey;
  label: string;
  type?: "text" | "date" | "number" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
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
        label: "Basic salary (Rp)",
        type: "number",
        placeholder: "0",
      },
      {
        key: "salaryType",
        label: "Salary type",
        type: "select",
        options: SALARY_TYPES,
      },
      {
        key: "paymentSchedule",
        label: "Payment schedule",
        placeholder: "Default",
      },
      {
        key: "prorateSetting",
        label: "Prorate setting",
        placeholder: "Select prorate setting",
      },
      {
        key: "overtimeSetting",
        label: "Overtime setting",
        type: "select",
        options: OVERTIME_SETTINGS,
      },
    ],
  },
  {
    label: "Rekening bank",
    fields: [
      { key: "bankName", label: "Bank name" },
      { key: "bankAccount", label: "Bank account" },
      { key: "bankAccountHolder", label: "Bank account holder" },
    ],
  },
  {
    label: "Pajak & bukti potong",
    enableKey: "taxEnabled",
    fields: [
      {
        key: "npwp",
        label: "NPWP 15 digit",
        placeholder: "00.000.000.0-000.000",
      },
      {
        key: "ptkpStatus",
        label: "PTKP status",
        type: "select",
        options: PTKP_STATUSES,
        required: true,
      },
      {
        key: "taxMethod",
        label: "Tax method",
        type: "select",
        options: TAX_METHODS,
      },
      {
        key: "taxSalary",
        label: "Tax salary",
        type: "select",
        options: TAX_SALARY_OPTIONS,
      },
      {
        key: "employeeTaxStatus",
        label: "Employee tax status",
        type: "select",
        options: EMPLOYEE_TAX_STATUSES,
        required: true,
      },
      {
        key: "beginningNetto",
        label: "Beginning netto (Rp)",
        type: "number",
        placeholder: "0",
      },
      {
        key: "pph21Paid",
        label: "PPH 21 paid (Rp)",
        type: "number",
        placeholder: "0",
      },
      {
        key: "buktiPotongDocType",
        label: "Jenis dok. referensi bukti potong",
        placeholder: "Pilih jenis dokumen",
      },
      {
        key: "buktiPotongDocNumber",
        label: "Nomor dok. referensi bukti potong",
      },
      {
        key: "buktiPotongDocDate",
        label: "Tanggal dok. referensi bukti potong",
        type: "date",
      },
    ],
  },
  {
    label: "BPJS",
    enableKey: "bpjsEnabled",
    fields: [
      { key: "bpjsKetenagakerjaan", label: "BPJS ketenagakerjaan" },
      {
        key: "nppBpjsKetenagakerjaan",
        label: "NPP BPJS ketenagakerjaan",
        type: "select",
        options: POLICY_OPTIONS,
      },
      {
        key: "bpjsKetenagakerjaanDate",
        label: "BPJS ketenagakerjaan date",
        type: "date",
      },
      { key: "bpjsKesehatan", label: "BPJS kesehatan" },
      {
        key: "bpjsKesehatanFamily",
        label: "BPJS kesehatan family",
        type: "select",
        options: BPJS_FAMILY_SIZES,
      },
      { key: "bpjsKesehatanDate", label: "BPJS kesehatan date", type: "date" },
      {
        key: "bpjsKesehatanCost",
        label: "BPJS kesehatan cost",
        type: "select",
        options: POLICY_OPTIONS,
      },
      {
        key: "jhtCost",
        label: "JHT cost",
        type: "select",
        options: POLICY_OPTIONS,
      },
      {
        key: "jaminanPensiunCost",
        label: "Jaminan pensiun cost",
        type: "select",
        options: POLICY_OPTIONS,
      },
      {
        key: "jaminanPensiunDate",
        label: "Jaminan pensiun date",
        type: "date",
      },
    ],
  },
];

const PAYROLL_FIELDS = PAYROLL_SECTIONS.flatMap((section) => section.fields);

type PayrollState = Record<PayrollKey, string>;

const EMPTY_PAYROLL = Object.fromEntries(
  PAYROLL_FIELDS.map((field) => [field.key, ""]),
) as PayrollState;

const toPayrollState = (data: PayrollFields): PayrollState =>
  Object.fromEntries(
    PAYROLL_FIELDS.map((field) => {
      const value = data[field.key];
      if (value === null || value === undefined) return [field.key, ""];
      return [
        field.key,
        field.type === "date" ? toDateInput(value) : String(value),
      ];
    }),
  ) as PayrollState;

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
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
            {option}
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
  if (field.type === "select") {
    return (
      <Field label={field.label} required={field.required}>
        <EnumSelect
          value={value}
          onChange={onChange}
          options={field.options ?? []}
          placeholder="Pilih"
        />
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
  const { data: roles = [] } = useGetRoles();
  const { data: branches = [] } = useGetBranchs();
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

  useEffect(() => {
    if (!open) return;

    setTab("profil");
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
            firstName:
              editData.firstName || (editData.name || "").split(" ")[0] || "",
            lastName:
              editData.lastName ||
              (editData.name || "").split(" ").slice(1).join(" "),
            email: editData.email || "",
            password: "",
            phoneNumber: editData.phoneNumber || "",
            additionalPhone: editData.additionalPhone || "",
            roleId: editData.roleId || "",
            branchId: editData.branchId || "",
            status: editData.status || "active",
            isActive: editData.isActive ?? true,
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
        : EMPTY_FORM,
    );
  }, [open, editData]);

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
    if (!form.employeeId.trim()) missing.push("Employee ID");
    if (!form.firstName.trim()) missing.push("First name");
    if (!form.email.trim()) missing.push("Email");
    if (!editData || form.password.trim()) {
      if (form.password.trim().length < 8) {
        missing.push("Password (min. 8 karakter)");
      }
    }
    if (!form.birthDate) missing.push("Birthdate");
    if (!form.startDate) missing.push("Tanggal masuk");
    if (!form.gender) missing.push("Gender");
    if (!form.maritalStatus) missing.push("Marital status");
    if (!form.religion) missing.push("Religion");
    if (!form.roleId) missing.push("Role");
    for (const section of PAYROLL_SECTIONS) {
      if (section.enableKey && !payrollFlags[section.enableKey]) continue;
      for (const field of section.fields) {
        if (field.required && !payroll[field.key].trim()) {
          missing.push(field.label);
        }
      }
    }
    if (missing.length > 0) {
      toast.error(`Lengkapi field wajib: ${missing.join(", ")}.`);
      return;
    }
    const payload = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      employeeId: form.employeeId.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      additionalPhone: form.additionalPhone.trim() || null,
      roleId: form.roleId,
      branchId: form.branchId || null,
      status: form.status,
      isActive: form.isActive,
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
        const newPassword = form.password.trim();
        await updateUser.mutateAsync({
          id: editData.id,
          ...payload,
          ...(newPassword ? { password: newPassword } : {}),
        });
        toast.success(
          newPassword
            ? "Data user & password login diperbarui."
            : "Data user berhasil diperbarui.",
        );
      } else {
        await createUser.mutateAsync({ password: form.password, ...payload });
        toast.success("User & akun login berhasil dibuat.", {
          description: `Email: ${form.email.trim()} · Password: ${form.password}`,
          duration: 15000,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-border border-b px-5 py-4">
          <DialogTitle>
            {editData ? "Edit data user" : "Tambah data user"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="profil">Profil</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              </TabsList>

              <TabsContent value="profil" className="space-y-5">
                <FieldGroup label="Akun & penempatan">
                  <Field
                    label={editData ? "Password baru" : "Password login"}
                    htmlFor="password"
                    required={!editData}
                  >
                    <Input
                      id="password"
                      type="text"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        update({ password: event.target.value })
                      }
                      placeholder={
                        editData
                          ? "Kosongkan kalau tidak diganti"
                          : "Minimal 8 karakter"
                      }
                    />
                    <p className="text-muted-foreground text-[11px]">
                      {editData
                        ? "Isi untuk mengganti password login karyawan ini."
                        : "Akun login dibuat otomatis dari email di bawah. Catat email & password ini untuk diberikan ke karyawan."}
                    </p>
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Employee ID" htmlFor="employee-id" required>
                      <Input
                        id="employee-id"
                        value={form.employeeId}
                        readOnly
                        placeholder="Isi tanggal masuk & tanggal lahir"
                        className="bg-muted/50"
                      />
                      <p className="text-muted-foreground text-[11px]">
                        Otomatis dari tanggal masuk & tanggal lahir.
                      </p>
                    </Field>
                    <Field label="First name" htmlFor="first-name" required>
                      <Input
                        id="first-name"
                        value={form.firstName}
                        onChange={(event) =>
                          update({ firstName: event.target.value })
                        }
                        placeholder="Rizky"
                      />
                    </Field>
                    <Field label="Last name" htmlFor="last-name">
                      <Input
                        id="last-name"
                        value={form.lastName}
                        onChange={(event) =>
                          update({ lastName: event.target.value })
                        }
                        placeholder="Pratama"
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
                    <Field label="Phone number" htmlFor="phone-number">
                      <Input
                        id="phone-number"
                        value={form.phoneNumber}
                        onChange={(event) =>
                          update({ phoneNumber: event.target.value })
                        }
                        placeholder="0812xxxxxxx"
                      />
                    </Field>
                    <Field
                      label="Additional phone number"
                      htmlFor="additional-phone"
                    >
                      <Input
                        id="additional-phone"
                        value={form.additionalPhone}
                        onChange={(event) =>
                          update({ additionalPhone: event.target.value })
                        }
                        placeholder="0813xxxxxxx"
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
                    <Field label="Branch">
                      <Select
                        value={form.branchId || "none"}
                        onValueChange={(value) =>
                          update({ branchId: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanpa branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa branch</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="flex items-end pb-2">
                      <Label htmlFor="is-active" className="cursor-pointer">
                        <Checkbox
                          id="is-active"
                          checked={form.isActive}
                          onCheckedChange={(checked) =>
                            update({ isActive: checked === true })
                          }
                        />
                        Aktif
                      </Label>
                    </div>
                  </div>
                </FieldGroup>

                <FieldGroup label="Data pribadi">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Place of birth" htmlFor="birth-place">
                      <Input
                        id="birth-place"
                        value={form.birthPlace}
                        onChange={(event) =>
                          update({ birthPlace: event.target.value })
                        }
                        placeholder="Jakarta"
                      />
                    </Field>
                    <Field label="Birthdate" htmlFor="birth-date" required>
                      <Input
                        id="birth-date"
                        type="date"
                        value={form.birthDate}
                        onChange={(event) =>
                          update({ birthDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Tanggal masuk" htmlFor="start-date" required>
                      <Input
                        id="start-date"
                        type="date"
                        value={form.startDate}
                        onChange={(event) =>
                          update({ startDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Gender" required>
                      <EnumSelect
                        value={form.gender}
                        onChange={(value) => update({ gender: value })}
                        options={GENDERS}
                        placeholder="Pilih gender"
                      />
                    </Field>
                    <Field label="Marital status" required>
                      <EnumSelect
                        value={form.maritalStatus}
                        onChange={(value) => update({ maritalStatus: value })}
                        options={MARITAL_STATUSES}
                        placeholder="Pilih status"
                      />
                    </Field>
                    <Field label="Blood type">
                      <EnumSelect
                        value={form.bloodType}
                        onChange={(value) => update({ bloodType: value })}
                        options={BLOOD_TYPES}
                        placeholder="Pilih golongan darah"
                      />
                    </Field>
                    <Field label="Religion" required>
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
                    <Field label="Country" htmlFor="country">
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(event) =>
                          update({ country: event.target.value })
                        }
                        placeholder="Indonesia"
                      />
                    </Field>
                    <Field label="Postal code" htmlFor="postal-code">
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
                    <Field label="Province">
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
                    <Field label="City">
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
                      label="Citizen ID address"
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
                    Employee
                  </p>
                  <p className="text-sm font-semibold">
                    {form.employeeId || "—"} ·{" "}
                    {`${form.firstName} ${form.lastName}`.trim() || "—"}
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
                              ? `Aktif — isi data ${section.label.toLowerCase()} di bawah.`
                              : `Nonaktif — nyalakan kalau karyawan ini ikut ${section.label.toLowerCase()}.`}
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
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-border bg-popover sticky bottom-0 flex justify-end gap-2 border-t px-5 py-3">
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
      toast.success("User berhasil dihapus.");
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
          <AlertDialogTitle>Hapus user?</AlertDialogTitle>
          <AlertDialogDescription>
            Data user <strong>{userData?.name}</strong> akan dihapus permanen.
            Akun login tetap ada.
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
