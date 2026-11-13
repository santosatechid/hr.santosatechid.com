"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Loader2,
  MessageCircle,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/profile/useProfile";
import { signOut } from "@/services/auth/authClients";
import { cn } from "@/lib/shadcn/utils";
import { uploadPhoto } from "@/lib/upload/photo";
import { getErrorMessage } from "@/types";

const STEPS = ["Data diri", "Foto & dokumen", "Selesai"] as const;

const STYLE = {
  label: "text-[11px] font-bold text-[#202020]",
  input:
    "h-[42px] rounded-[9px] bg-white text-[12.5px] font-bold ring-1 ring-[#E8EAEE] focus-visible:ring-2 focus-visible:ring-[#2F80ED]",
  section:
    "text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase",
} as const;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const dateOf = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : null;

export default function EmployeeOnboarding() {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: "",
    address: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Isi form sekali saja, setelah profil pertama kali datang.
  if (profile && !hydrated) {
    setHydrated(true);
    setForm({
      phoneNumber: profile.phoneNumber ?? "",
      address: profile.address ?? "",
      birthPlace: profile.birthPlace ?? "",
      birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
      gender: profile.gender ?? "",
    });
    setAvatarUrl(profile.avatarUrl ?? null);
  }

  const saveProfile = async (patch: Parameters<typeof updateProfile.mutateAsync>[0]) => {
    try {
      await updateProfile.mutateAsync(patch);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try {
      setAvatarUrl(await uploadPhoto(file));
      toast.success("Foto terunggah.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!form.phoneNumber.trim()) {
        toast.error("Isi nomor HP dulu.");
        return;
      }
      const ok = await saveProfile({
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim() || null,
        birthPlace: form.birthPlace.trim() || null,
        birthDate: form.birthDate || null,
        gender: form.gender || null,
      });
      if (ok) setStep(1);
      return;
    }
    if (step === 1) {
      if (avatarUrl && avatarUrl !== profile?.avatarUrl) {
        const ok = await saveProfile({ avatarUrl });
        if (!ok) return;
      }
      setStep(2);
      return;
    }
    finish();
  };

  const finish = () => {
    toast.success("Profil kamu lengkap. Selamat bergabung!");
    router.replace("/dashboard/attendance");
    router.refresh();
  };

  const meta = [
    profile?.position || null,
    profile?.enrollmentDate
      ? `mulai ${dateOf(profile.enrollmentDate)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-hr-panel flex min-h-svh flex-col items-center">
      <div className="flex w-full items-center justify-between p-[26px_48px]">
        <div className="flex items-center gap-[9px]">
          <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-[#1147CE]">
            <svg viewBox="0 0 19 19" aria-hidden className="size-[19px]">
              <path
                d="M3.19 0h7.239q.094 0 .182.036.087.036.154.103.067.067.104.155.036.087.036.182v1.81q0 .094-.036.182-.037.087-.104.154-.067.067-.154.104-.088.036-.182.036h-7.715v-2.286q0-.095.037-.182.036-.088.103-.155.067-.067.154-.103.088-.036.182-.036zM.476 2.714h2.286v8.191h-2.286q-.095 0-.182-.036-.088-.037-.155-.104-.067-.067-.103-.154-.036-.088-.036-.182v-7.239q0-.094.036-.182.036-.087.103-.154.067-.067.155-.103.087-.037.182-.037zM5.905 5.429h4.524q.094 0 .182.036.087.036.154.103.067.067.104.155.036.087.036.182v2.285h-5q-.095 0-.182-.036-.088-.036-.155-.103-.067-.067-.103-.154-.036-.088-.036-.183v-1.809q0-.095.036-.182.036-.088.103-.155.067-.067.155-.103.087-.036.182-.036zM2.714 10.81h5q.095 0 .183.036.087.036.154.103.067.067.103.154.036.088.036.183v1.809q0 .095-.036.182-.036.088-.103.155-.067.067-.154.103-.088.036-.183.036h-4.524q-.094 0-.182-.036-.087-.036-.154-.103-.067-.067-.103-.155-.037-.087-.037-.182zM10.714 8.143h3v7.667q0 .094-.036.182-.036.087-.103.154-.067.067-.155.103-.087.037-.182.037h-2.524zM14 5.429h4.524q.095 0 .182.036.088.036.155.103.067.067.103.155.036.087.036.182v1.809q0 .095-.036.183-.036.087-.103.154-.067.067-.155.103-.087.036-.182.036h-5v-2.285q0-.095.036-.182.036-.088.103-.155.067-.067.155-.103.087-.036.182-.036zM3.19 16.238h7.715v2.286q0 .095-.036.182-.037.088-.104.155-.067.067-.154.103-.088.036-.182.036h-7.239q-.094 0-.182-.036-.087-.036-.154-.103-.067-.067-.103-.155-.037-.087-.037-.182v-1.81q0-.094.037-.182.036-.087.103-.154.067-.067.154-.104.088-.036.182-.036z"
                fill="#fff"
              />
            </svg>
          </span>
          <span className="text-[19px] font-extrabold tracking-[-0.5px]">
            Santosa<span className="text-[#2F80ED]">HR</span>
          </span>
        </div>

        <div className="flex items-center gap-[14px]">
          <span className="text-[12px] font-bold text-[#6B7280]">
            Butuh bantuan? Chat HR
          </span>
          <Button
            variant="outline"
            className="h-[34px] rounded-[9px] px-3 text-[11.5px] font-bold"
            onClick={() => void signOut().then(() => router.push("/auth/signIn"))}
          >
            Keluar
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-1 justify-center">
        <div className="flex w-full max-w-[940px] flex-col gap-4 px-6 pb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-[10px]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-full bg-[#EAF2FE] text-[13px] font-extrabold text-[#1F6BD8]">
                  {initialsOf(profile?.name ?? "")}
                </span>
              )}
              <div>
                <p className="text-[13px] font-extrabold">{profile?.name ?? "—"}</p>
                <p className="text-[11.5px] font-medium text-[#6B7280]">
                  {meta || "Karyawan baru"}
                </p>
              </div>
            </div>
            <span className="flex h-7 items-center rounded-full bg-white px-3 text-[11px] font-bold text-[#6B7280] ring-1 ring-[#E8EAEE]">
              Langkah {step + 1} dari {STEPS.length} · ± 2 menit
            </span>
          </div>

          <ol className="flex w-full items-center">
            {STEPS.map((label, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li key={label} className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold",
                        done && "bg-[#2F80ED] text-white",
                        active &&
                          "bg-white text-[#1F6BD8] ring-2 ring-[#2F80ED] ring-inset",
                        !done &&
                          !active &&
                          "bg-white text-[#AEB5C0] ring-2 ring-[#DDE1E8] ring-inset",
                      )}
                      aria-hidden
                    >
                      {done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    {index < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          "h-[2px] flex-1",
                          done ? "bg-[#2F80ED]" : "bg-[#E4E7EC]",
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11.5px]",
                      done && "font-bold text-[#202020]",
                      active && "font-extrabold text-[#1F6BD8]",
                      !done && !active && "font-bold text-[#9AA2AE]",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] leading-tight font-extrabold tracking-[-1.1px]">
              {step === 0 && "Lengkapi data diri"}
              {step === 1 && "Tambah foto & dokumen"}
              {step === 2 && "Semua siap"}
            </h1>
            <p className="max-w-[700px] text-[13.5px] leading-[21px] font-medium text-[#6B7280]">
              {step === 0 &&
                "Data ini dipakai untuk slip gaji, absensi, dan kontak darurat. Bisa diubah kapan saja."}
              {step === 1 &&
                "Foto dipakai untuk profil, absensi selfie, dan slip gaji. Sekali di awal saja."}
              {step === 2 &&
                "Profil kamu sudah lengkap. Absen pertama bisa langsung dari HP."}
            </p>
          </div>

          {step === 0 && (
            <div className="rounded-[18px] bg-white p-[22px] ring-1 ring-[#E8EAEE]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone" className={STYLE.label}>
                    Nomor HP
                  </Label>
                  <Input
                    id="phone"
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    placeholder="08xxxxxxxxxx"
                    inputMode="tel"
                    className={STYLE.input}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gender" className={STYLE.label}>
                    Jenis kelamin
                  </Label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        gender: event.target.value,
                      }))
                    }
                    className={cn(STYLE.input, "px-3")}
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="birth-place" className={STYLE.label}>
                    Tempat lahir
                  </Label>
                  <Input
                    id="birth-place"
                    value={form.birthPlace}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthPlace: event.target.value,
                      }))
                    }
                    className={STYLE.input}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="birth-date" className={STYLE.label}>
                    Tanggal lahir
                  </Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={form.birthDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                    className={STYLE.input}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="address" className={STYLE.label}>
                    Alamat tinggal
                  </Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    rows={3}
                    className="rounded-[9px] text-[12.5px] ring-1 ring-[#E8EAEE]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-[14px] rounded-[18px] bg-white p-[22px] ring-1 ring-[#E8EAEE] sm:flex-row sm:gap-[22px]">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void handlePhoto(file);
                }}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-[10px] rounded-[16px] bg-[#F5F8FE] px-6 py-[52px] ring-[1.5px] transition-colors",
                  dragging ? "ring-[#2F80ED]" : "ring-[#C9DCFB]",
                )}
              >
                <span className="flex size-[72px] items-center justify-center rounded-full bg-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Foto profil"
                      width={72}
                      height={72}
                      className="size-[72px] rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Camera className="size-[30px] text-[#2F80ED]" aria-hidden />
                  )}
                </span>
                <p className="max-w-[460px] text-center text-[13px] font-extrabold">
                  Tarik foto ke sini atau pilih dari galeri
                </p>
                <p className="text-[11px] font-semibold text-[#8C94A1]">
                  JPG atau PNG · maks 2 MB · minimal 400×400 px
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handlePhoto(file);
                    event.target.value = "";
                  }}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handlePhoto(file);
                    event.target.value = "";
                  }}
                />
                <Button
                  className="h-[38px] gap-2 rounded-[9px] px-4 text-[12px] font-extrabold"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="size-3.5" aria-hidden />
                  )}
                  Pilih foto
                </Button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => cameraRef.current?.click()}
                  className="text-[10.5px] font-semibold text-[#1F6BD8] underline-offset-4 hover:underline disabled:opacity-50"
                >
                  atau ambil langsung pakai kamera HP
                </button>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-[300px]">
                <div className="flex flex-col gap-2.5 rounded-[12px] bg-[#F8F9FB] p-4">
                  <p className="text-[12px] font-extrabold">
                    Tips foto cepat diterima
                  </p>
                  {[
                    "Wajah terlihat jelas, tanpa masker",
                    "Latar polos & terang",
                    "Foto terbaru, maksimal 6 bulan",
                    "Tanpa filter dan tanpa topi",
                  ].map((tip) => (
                    <span key={tip} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-[#12A150]"
                        aria-hidden
                      />
                      <span className="text-[11.5px] leading-[17px] font-semibold">
                        {tip}
                      </span>
                    </span>
                  ))}
                </div>

                {avatarUrl && (
                  <div className="flex items-center gap-[10px] rounded-[12px] bg-white p-[14px] ring-1 ring-[#E8EAEE]">
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={52}
                      height={52}
                      className="size-[52px] rounded-full object-cover"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-extrabold">
                        foto-profil
                      </p>
                      <p className="text-[10.5px] font-medium text-[#6B7280]">
                        tersimpan
                      </p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-[#E7F7EE] px-2 py-[3px] text-[9.5px] font-extrabold text-[#12A150]">
                      <Check className="size-2.5" aria-hidden />
                      OK
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-[12px] bg-white p-3 ring-1 ring-[#E8EAEE]">
                  <MessageCircle
                    className="size-4 shrink-0 text-[#2F80ED]"
                    aria-hidden
                  />
                  <p className="text-[10.5px] leading-[15px] font-semibold text-[#6B7280]">
                    Fotonya ditolak? Chat HR, biasanya dibalas &lt; 1 jam.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-[18px] bg-white p-[22px] ring-1 ring-[#E8EAEE]">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Nomor HP", form.phoneNumber || "—"],
                  ["Jenis kelamin", form.gender || "—"],
                  ["Tempat lahir", form.birthPlace || "—"],
                  [
                    "Tanggal lahir",
                    form.birthDate
                      ? new Date(form.birthDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—",
                  ],
                  ["Alamat", form.address || "—"],
                  ["Foto profil", avatarUrl ? "Sudah diunggah" : "Belum ada"],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className={STYLE.section}>{label}</p>
                    <p className="text-[12.5px] font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <p className="text-[11.5px] font-semibold text-[#6B7280]">
              Foto dan data bisa diubah kapan saja dari profil kamu
            </p>
            <div className="flex items-center gap-[10px]">
              {step === 0 ? (
                <Button
                  variant="outline"
                  className="h-10 rounded-[10px] px-4 text-[12.5px] font-bold"
                  onClick={() => router.replace("/dashboard/attendance")}
                >
                  Nanti saja
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-10 rounded-[10px] px-4 text-[12.5px] font-bold"
                  onClick={() => setStep((current) => current - 1)}
                >
                  Kembali
                </Button>
              )}

              <Button
                className="h-10 gap-2 rounded-[10px] px-[18px] text-[12.5px] font-extrabold"
                onClick={() => void handleNext()}
                disabled={updateProfile.isPending || uploading}
              >
                {updateProfile.isPending && (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                )}
                {step === 2 ? "Simpan & selesai" : "Simpan & lanjut"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
