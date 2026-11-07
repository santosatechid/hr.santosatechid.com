"use client";

import Image from "next/image";

import { useGetUserByIdBetterAuthProfile } from "@/hooks/users/useUsersByIdBetterAuth";
import { PageHeader } from "@/components/layout/pageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/services/auth/authClients";
import { Banknote, Building2, Mail, Shield, User } from "lucide-react";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-2 last:border-0">
      <span className="text-muted-foreground text-[11px] font-medium">
        {label}
      </span>
      <span className="text-right text-[11px] font-semibold">
        {value || "—"}
      </span>
    </div>
  );
}

const fmtDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const fmtMoney = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const {
    data: user,
    isLoading,
    isError,
  } = useGetUserByIdBetterAuthProfile(session?.user?.id ?? "");

  if (!session?.user) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="Profil"
        description="Data akun dan profil karyawanmu."
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={72}
              height={72}
              className="h-18 w-18 rounded-full object-cover"
            />
          ) : (
            <div className="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
              <User className="text-muted-foreground h-7 w-7" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-[15px] font-extrabold tracking-[-0.3px]">
              {user?.name || session.user.name}
            </h2>
            <p className="text-muted-foreground text-[11px] font-medium">
              {user?.email || session.user.email}
            </p>
            <p className="text-muted-foreground text-[11px] font-medium">
              {user?.employeeId || "Employee ID belum diisi"}
            </p>
          </div>
          <Badge variant={user?.isActive === false ? "secondary" : "success"}>
            {user?.isActive === false ? "Tidak aktif" : "Aktif"}
          </Badge>
        </CardContent>
      </Card>

      {isError && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          Profil user_data belum tersedia. Hubungi admin untuk menghubungkan
          akun.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Akun
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Email" value={session.user.email} />
            <InfoRow
              label="Email terverifikasi"
              value={session.user.emailVerified ? "Ya" : "Belum"}
            />
            <InfoRow
              label="Login"
              value={user?.userId ? "Terdaftar" : "Belum terdaftar"}
            />
            <InfoRow label="User ID" value={session.user.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Akses
            </CardTitle>
            <CardDescription>Role dan branch dari user data.</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRow label="Role" value={user?.role?.name} />
            <InfoRow label="Branch" value={user?.branch?.name} />
            <InfoRow label="Status" value={user?.status} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Data karyawan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            <InfoRow label="Employee ID" value={user?.employeeId} />
            <InfoRow label="Tanggal masuk" value={fmtDate(user?.startDate)} />
            <InfoRow label="Tempat lahir" value={user?.birthPlace} />
            <InfoRow label="Tanggal lahir" value={fmtDate(user?.birthDate)} />
            <InfoRow label="Gender" value={user?.gender} />
            <InfoRow label="Status pernikahan" value={user?.maritalStatus} />
            <InfoRow label="Agama" value={user?.religion} />
            <InfoRow label="Golongan darah" value={user?.bloodType} />
            <InfoRow label="NIK" value={user?.nik} />
            <InfoRow label="Telepon" value={user?.phoneNumber} />
            <InfoRow label="Telepon tambahan" value={user?.additionalPhone} />
            <InfoRow label="Email profil" value={user?.email} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            <InfoRow label="Country" value={user?.country} />
            <InfoRow label="Postal code" value={user?.postalCode} />
            <InfoRow label="Province" value={user?.province} />
            <InfoRow label="City" value={user?.city} />
            <InfoRow label="Alamat sesuai KTP" value={user?.citizenIdAddress} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Payroll
            </CardTitle>
            <CardDescription>Gaji pokok dan rekening transfer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            <InfoRow label="Basic salary" value={fmtMoney(user?.basicSalary)} />
            <InfoRow label="Salary type" value={user?.salaryType} />
            <InfoRow label="Payment schedule" value={user?.paymentSchedule} />
            <InfoRow label="Prorate setting" value={user?.prorateSetting} />
            <InfoRow label="Overtime setting" value={user?.overtimeSetting} />
            <InfoRow label="Bank" value={user?.bankName} />
            <InfoRow label="No. rekening" value={user?.bankAccount} />
            <InfoRow label="Atas nama" value={user?.bankAccountHolder} />
          </CardContent>
        </Card>

        {user?.taxEnabled ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Pajak
              </CardTitle>
              <CardDescription>PPh 21 dan bukti potong.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-8 md:grid-cols-2">
              <InfoRow label="NPWP 15 digit" value={user?.npwp} />
              <InfoRow label="PTKP status" value={user?.ptkpStatus} />
              <InfoRow label="Tax method" value={user?.taxMethod} />
              <InfoRow label="Tax salary" value={user?.taxSalary} />
              <InfoRow
                label="Employee tax status"
                value={user?.employeeTaxStatus}
              />
              <InfoRow
                label="Beginning netto"
                value={fmtMoney(user?.beginningNetto)}
              />
              <InfoRow label="PPH 21 paid" value={fmtMoney(user?.pph21Paid)} />
              <InfoRow
                label="Jenis dok. bukti potong"
                value={user?.buktiPotongDocType}
              />
              <InfoRow
                label="Nomor dok. bukti potong"
                value={user?.buktiPotongDocNumber}
              />
              <InfoRow
                label="Tanggal dok. bukti potong"
                value={fmtDate(user?.buktiPotongDocDate)}
              />
            </CardContent>
          </Card>
        ) : null}

        {user?.bpjsEnabled ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> BPJS
              </CardTitle>
              <CardDescription>
                BPJS Ketenagakerjaan dan Kesehatan.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-8 md:grid-cols-2">
              <InfoRow
                label="BPJS Ketenagakerjaan"
                value={user?.bpjsKetenagakerjaan}
              />
              <InfoRow
                label="NPP BPJS Ketenagakerjaan"
                value={user?.nppBpjsKetenagakerjaan}
              />
              <InfoRow
                label="Tanggal BPJS Ketenagakerjaan"
                value={fmtDate(user?.bpjsKetenagakerjaanDate)}
              />
              <InfoRow label="BPJS Kesehatan" value={user?.bpjsKesehatan} />
              <InfoRow
                label="BPJS Kesehatan family"
                value={user?.bpjsKesehatanFamily}
              />
              <InfoRow
                label="Tanggal BPJS Kesehatan"
                value={fmtDate(user?.bpjsKesehatanDate)}
              />
              <InfoRow
                label="BPJS Kesehatan cost"
                value={user?.bpjsKesehatanCost}
              />
              <InfoRow label="JHT cost" value={user?.jhtCost} />
              <InfoRow
                label="Jaminan Pensiun cost"
                value={user?.jaminanPensiunCost}
              />
              <InfoRow
                label="Tanggal Jaminan Pensiun"
                value={fmtDate(user?.jaminanPensiunDate)}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
