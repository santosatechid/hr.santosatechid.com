"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

import { useGetUserByIdBetterAuthProfile } from "@/hooks/users/useUsersByIdBetterAuth";
import { useUpdateMyProfile } from "@/hooks/profile/useProfile";
import { uploadPhoto } from "@/lib/upload/photo";
import {
  useEnrollFace,
  useGetFaceTemplate,
  useRevokeFace,
} from "@/hooks/attendance/useAttendance";
import { getErrorMessage } from "@/types";
import dynamic from "next/dynamic";

/** Human touches WebGL at import time, so keep it out of SSR. */
const FaceCaptureDialog = dynamic(
  () => import("@/components/attendance/FaceCaptureDialog"),
  { ssr: false },
);
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Banknote,
  Building2,
  Loader2,
  Mail,
  ScanFace,
  Shield,
  Upload,
  User,
} from "lucide-react";

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
  const { data: face } = useGetFaceTemplate(Boolean(session?.user?.id));
  const enrollFace = useEnrollFace();
  const revokeFace = useRevokeFace();
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();

  const changePhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const avatarUrl = await uploadPhoto(file);
      await updateProfile.mutateAsync({ avatarUrl });
      await queryClient.invalidateQueries({
        queryKey: ["users-profile", session?.user?.id ?? ""],
      });
      toast.success("Foto profil diperbarui.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitFace = async (embedding: number[]) => {
    try {
      await enrollFace.mutateAsync(embedding);
      toast.success("Wajah berhasil didaftarkan untuk absensi.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const revoke = async () => {
    try {
      await revokeFace.mutateAsync();
      toast.success("Data wajah dihapus.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!session?.user) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Profil"
        description="Info akun dan data kerjamu."
        actions={
          <Button asChild variant="outline" className="h-8 text-[11.5px]">
            <Link href="/onboarding/karyawan">Lengkapi profil</Link>
          </Button>
        }
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
              unoptimized
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
              {user?.employeeId || "ID karyawan belum diisi"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={user?.isActive === false ? "secondary" : "success"}>
              {user?.isActive === false ? "Tidak aktif" : "Aktif"}
            </Badge>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void changePhoto(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11.5px]"
              disabled={uploadingPhoto}
              onClick={() => photoRef.current?.click()}
            >
              {uploadingPhoto ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-3.5" aria-hidden />
              )}
              Ganti foto
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          Data profil belum tersedia. Minta admin buat menghubungkan akunmu.
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
            <CardDescription>Atur role dan cabang akunmu.</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRow label="Role" value={user?.role?.name} />
            <InfoRow label="Branch" value={user?.branch?.name} />
            <InfoRow label="Divisi" value={user?.division?.name} />
            <InfoRow label="Status" value={user?.status} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanFace className="h-4 w-4" /> Wajah untuk absensi
            </CardTitle>
            <CardDescription>
              Opsional. Foto diproses di perangkatmu; server hanya menyimpan
              template terenkripsi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant={face ? "success" : "secondary"}>
                {face ? "Terdaftar" : "Belum terdaftar"}
              </Badge>
              <p className="text-muted-foreground text-xs">
                Wajib terdaftar sebelum bisa absen masuk atau pulang.
              </p>
            </div>
            {face ? (
              <Button
                variant="outline"
                onClick={revoke}
                disabled={revokeFace.isPending}
              >
                {revokeFace.isPending ? "Menghapus..." : "Hapus data wajah"}
              </Button>
            ) : (
              <Button onClick={() => setConsentOpen(true)}>
                Daftarkan wajah
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Data karyawan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            <InfoRow label="ID karyawan" value={user?.employeeId} />
            <InfoRow label="Tanggal mulai kerja" value={fmtDate(user?.startDate)} />
            <InfoRow label="Kota lahir" value={user?.birthPlace} />
            <InfoRow label="Tanggal lahir" value={fmtDate(user?.birthDate)} />
            <InfoRow label="Jenis kelamin" value={user?.gender} />
            <InfoRow label="Status pernikahan" value={user?.maritalStatus} />
            <InfoRow label="Agama" value={user?.religion} />
            <InfoRow label="Golongan darah" value={user?.bloodType} />
            <InfoRow label="NIK" value={user?.nik} />
            <InfoRow label="Nomor HP" value={user?.phoneNumber} />
            <InfoRow label="Nomor HP tambahan" value={user?.additionalPhone} />
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
            <InfoRow label="Negara" value={user?.country} />
            <InfoRow label="Kode pos" value={user?.postalCode} />
            <InfoRow label="Provinsi" value={user?.province} />
            <InfoRow label="Kota" value={user?.city} />
            <InfoRow label="Alamat sesuai KTP" value={user?.citizenIdAddress} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Payroll
            </CardTitle>
            <CardDescription>Gaji pokok dan rekening transfermu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            <InfoRow label="Basic salary" value={fmtMoney(user?.basicSalary)} />
            <InfoRow label="Salary type" value={user?.salaryType} />
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
              <CardDescription>PPh 21 karyawan.</CardDescription>
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
                Potongan JKN, JHT, dan JP dihitung otomatis saat payroll.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-8 md:grid-cols-2">
              <InfoRow
                label="Anggota keluarga BPJS Kesehatan"
                value={user?.bpjsKesehatanFamily}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Izinkan pencocokan wajah?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Foto wajah hanya diproses di perangkatmu. Server menyimpan template
            terenkripsi untuk mencocokkan saat absen. Kamu bisa menghapusnya
            kapan saja. Pencocokan wajah bukan pengganti verifikasi keamanan
            penuh.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked === true)}
            />
            <span>
              Saya setuju data wajah saya dipakai untuk verifikasi absensi.
            </span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={!consentChecked}
              onClick={() => {
                setConsentOpen(false);
                setCameraOpen(true);
              }}
            >
              Mulai kamera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FaceCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCaptured={submitFace}
        title="Daftarkan wajah"
        description="Hadapkan wajah ke kamera, lalu ambil foto. Gunakan cahaya yang cukup."
        busyLabel="Menyimpan wajah..."
      />
    </div>
  );
}
