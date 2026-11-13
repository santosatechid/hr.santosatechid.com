"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput, type OtpStatus } from "@/components/ui/otp-input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useGetBranchs, useUpdateBranch } from "@/hooks/branches/useBranches";
import {
  useCreateClient,
  useSendOnboardingOtp,
  useVerifyOnboardingOtp,
} from "@/hooks/clients/useClients";
import { signOut } from "@/services/auth/authClients";
import { apiGet, apiPut } from "@/lib/http/apiClient";
import { getErrorMessage } from "@/types";
import { cn } from "@/lib/shadcn/utils";

/** Leaflet menyentuh `window`, jadi peta hanya di klien. */
const BranchGeofenceMap = dynamic(
  () => import("@/components/branches/BranchGeofenceMap"),
  { ssr: false },
);

const STYLE = {
  label: "text-[11px] font-bold text-[#202020]",
  input:
    "h-[42px] rounded-[9px] bg-white text-[12.5px] font-bold ring-1 ring-[#E8EAEE] focus-visible:ring-2 focus-visible:ring-[#2F80ED]",
} as const;

const STEPS = [
  { title: "Akun", hint: "Email login dan kata sandi." },
  { title: "Perusahaan", hint: "Nama, WhatsApp, dan alamat." },
  { title: "Area absensi", hint: "Tentukan titik dan radius absen." },
  { title: "Jam kerja", hint: "Pola hari dan toleransi terlambat." },
] as const;

const minuteToTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const timeToMinute = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return Number(hour) * 60 + Number(minute ?? 0);
};

export default function SetupWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createClient = useCreateClient();
  const sendOtp = useSendOnboardingOtp();
  const verifyOtp = useVerifyOnboardingOtp();
  const updateBranch = useUpdateBranch();

  const [step, setStep] = useState(0);
  const [clientReady, setClientReady] = useState(false);

  const [account, setAccount] = useState<{
    email: string;
    hasPassword: boolean;
    hasGoogle: boolean;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    void apiGet<{
      email: string;
      hasPassword: boolean;
      hasGoogle: boolean;
    }>("/api/onboarding/account")
      .then((res) => setAccount(res.data))
      .catch(() => setAccount(null));
  }, []);

  const [company, setCompany] = useState({ name: "", phone: "", address: "" });
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");

  const [area, setArea] = useState({
    name: "Kantor Pusat",
    latitude: null as number | null,
    longitude: null as number | null,
    radiusMeters: 100,
  });

  const [hours, setHours] = useState({
    workDaysPerWeek: 5,
    start: "08:00",
    end: "17:00",
    tolerance: 15,
  });

  const { data: branches = [] } = useGetBranchs(clientReady);
  const mainBranch =
    branches.find((branch) => branch.code === "MAIN") ?? branches[0];

  const patchCompany = (patch: Partial<typeof company>) => {
    setCompany((current) => ({ ...current, ...patch }));
    if (patch.phone !== undefined && (otpSentTo || verifiedPhone)) {
      setOtpSentTo(null);
      setVerifiedPhone(null);
      setCode("");
      setOtpStatus("idle");
    }
  };

  const handleSendOtp = async () => {
    if (company.phone.replace(/\D/g, "").length < 9) {
      toast.error("Isi nomor WhatsApp dulu.");
      return;
    }
    setOtpStatus("idle");
    try {
      const result = await sendOtp.mutateAsync(company.phone);
      setOtpSentTo(result.phone);
      setCode("");
      toast.success("Kode OTP dikirim lewat WhatsApp.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleVerify = async (value: string) => {
    try {
      const result = await verifyOtp.mutateAsync(value);
      setVerifiedPhone(result.phone);
      setOtpStatus("success");
      toast.success("Nomor WhatsApp terverifikasi.");
    } catch (error) {
      setOtpStatus("error");
      toast.error(getErrorMessage(error));
    }
  };

  /** Langkah 1: buat client. Data lain disimpan per langkah (auto-save). */
  const saveCompany = async () => {
    if (company.name.trim().length < 2) {
      toast.error("Nama perusahaan minimal 2 karakter.");
      return false;
    }
    if (!verifiedPhone) {
      toast.error("Verifikasi nomor WhatsApp dulu.");
      return false;
    }
    try {
      await createClient.mutateAsync({
        name: company.name.trim(),
        phone: verifiedPhone,
        address: company.address.trim(),
      });
      setClientReady(true);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const saveArea = async () => {
    if (!mainBranch) return false;
    if (area.latitude === null || area.longitude === null) {
      toast.error("Tentukan titik lokasi di peta dulu, atau tekan Lewati.");
      return false;
    }
    try {
      await updateBranch.mutateAsync({
        id: mainBranch.id,
        code: mainBranch.code,
        name: area.name.trim() || "Kantor Pusat",
        address: mainBranch.address ?? undefined,
        isActive: true,
        latitude: area.latitude,
        longitude: area.longitude,
        radiusMeters: area.radiusMeters,
        workDaysPerWeek: mainBranch.workDaysPerWeek ?? 5,
        workStartMinute: mainBranch.workStartMinute ?? 480,
        workEndMinute: mainBranch.workEndMinute ?? 1020,
        lateToleranceMinutes: mainBranch.lateToleranceMinutes ?? 15,
      });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const saveHours = async () => {
    if (!mainBranch) return false;
    if (timeToMinute(hours.end) <= timeToMinute(hours.start)) {
      toast.error("Jam pulang harus setelah jam masuk.");
      return false;
    }
    try {
      await updateBranch.mutateAsync({
        id: mainBranch.id,
        code: mainBranch.code,
        name: mainBranch.name,
        address: mainBranch.address ?? undefined,
        isActive: true,
        latitude: mainBranch.latitude ?? null,
        longitude: mainBranch.longitude ?? null,
        radiusMeters: mainBranch.radiusMeters ?? null,
        workDaysPerWeek: hours.workDaysPerWeek,
        workStartMinute: timeToMinute(hours.start),
        workEndMinute: timeToMinute(hours.end),
        lateToleranceMinutes: hours.tolerance,
      });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: ["client"] });
    queryClient.invalidateQueries({ queryKey: ["branchs"] });
    toast.success("Setup selesai. Santosa HR siap dipakai.");
    router.replace("/dashboard");
    router.refresh();
  };

  /** Langkah 0: kata sandi opsional (akun Google belum punya). */
  const savePassword = async () => {
    if (!password) return true;
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter.");
      return false;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi belum sama.");
      return false;
    }
    setSavingPassword(true);
    try {
      await apiPut("/api/onboarding/account", { password });
      setAccount((current) =>
        current ? { ...current, hasPassword: true } : current,
      );
      setPassword("");
      setConfirm("");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (await savePassword()) setStep(1);
      return;
    }
    if (step === 1) {
      if (await saveCompany()) setStep(2);
      return;
    }
    if (step === 2) {
      if (await saveArea()) setStep(3);
      return;
    }
    if (await saveHours()) finish();
  };

  const busy =
    createClient.isPending ||
    updateBranch.isPending ||
    verifyOtp.isPending ||
    savingPassword;

  const exit = async () => {
    if (clientReady) {
      router.replace("/dashboard");
      return;
    }
    await signOut();
    router.push("/auth/signIn");
  };

  return (
    <div className="bg-hr-panel flex min-h-svh flex-col items-center">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 p-[26px_24px] md:p-[26px_48px]">
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
          <span className="hidden text-[12px] font-bold text-[#6B7280] sm:block">
            Butuh bantuan? Chat kami
          </span>
          <Button
            variant="outline"
            className="h-[34px] rounded-[9px] px-3 text-[11.5px] font-bold"
            onClick={() => void exit()}
          >
            Simpan &amp; keluar
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-[1000px] flex-col gap-[18px] px-6 pb-10">
          <ol className="flex w-full items-center">
            {STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li key={item.title} className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold",
                        done && "bg-[#2F80ED] text-white",
                        active &&
                          "bg-white text-[#1F6BD8] ring-2 ring-[#2F80ED] ring-inset",
                        !done &&
                          !active &&
                          "bg-white text-[#AEB5C0] ring-2 ring-[#DDE1E8] ring-inset",
                      )}
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
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] leading-[38px] font-extrabold tracking-[-1.2px]">
              {step === 0 && "Akun kamu"}
              {step === 1 && "Atur perusahaan kamu"}
              {step === 2 && "Tentukan area absensi"}
              {step === 3 && "Atur jam kerja"}
            </h1>
            <p className="max-w-[720px] text-[13.5px] leading-[21px] font-medium text-[#6B7280]">
              {step === 0 &&
                "Email ini yang dipakai untuk masuk. Kata sandi opsional kalau kamu memakai Google."}
              {step === 1 &&
                "Cukup sekali di awal. Semua data ini bisa diubah kapan saja di menu pengaturan."}
              {step === 2 &&
                "Karyawan harus berada di dalam lingkaran ini saat absen. Bisa diatur ulang kapan saja."}
              {step === 3 &&
                "Pola ini dipakai untuk menandai terlambat dan menghitung jam kerja. Semua bisa diubah nanti."}
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleNext();
            }}
            className="flex flex-col gap-[14px] rounded-[18px] bg-white p-6 ring-1 ring-[#E8EAEE] lg:flex-row lg:gap-6"
          >
            <div className="flex flex-1 flex-col gap-4">
              {step === 0 && (
                <>
                  <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                    1 · Akun login
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="account-email" className={STYLE.label}>
                      Email
                    </Label>
                    <Input
                      id="account-email"
                      value={account?.email ?? "Memuat…"}
                      readOnly
                      disabled
                      className={STYLE.input}
                    />
                    <p className="text-[10.5px] font-medium text-[#8C94A1]">
                      Email mengikuti akun yang kamu pakai untuk masuk.
                    </p>
                  </div>

                  {account?.hasPassword ? (
                    <p className="rounded-[10px] bg-[#F8F9FB] px-3 py-2.5 text-[11.5px] font-semibold text-[#6B7280]">
                      Kata sandi sudah diatur untuk akun ini. Lanjut ke langkah
                      berikutnya.
                    </p>
                  ) : (
                    <>
                      <div className="h-px w-full bg-[#F2F4F7]" />
                      <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                        2 · Buat kata sandi
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Label htmlFor="account-password" className={STYLE.label}>
                            Kata sandi
                          </Label>
                          <Input
                            id="account-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Minimal 8 karakter"
                            autoComplete="new-password"
                            className={STYLE.input}
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Label htmlFor="account-confirm" className={STYLE.label}>
                            Ulangi kata sandi
                          </Label>
                          <Input
                            id="account-confirm"
                            type="password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            placeholder="Ulangi kata sandi"
                            autoComplete="new-password"
                            className={STYLE.input}
                          />
                        </div>
                      </div>
                      <p className="text-[10.5px] font-medium text-[#8C94A1]">
                        {account?.hasGoogle
                          ? "Boleh dilewati kalau kamu selalu masuk pakai Google."
                          : "Dipakai untuk masuk berikutnya. Jangan lupa."}
                      </p>
                    </>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                    1 · Identitas perusahaan
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor="company-name" className={STYLE.label}>
                        Nama badan usaha
                      </Label>
                      <Input
                        id="company-name"
                        value={company.name}
                        onChange={(event) =>
                          patchCompany({ name: event.target.value })
                        }
                        placeholder="PT Contoh Indonesia"
                        autoComplete="organization"
                        className={STYLE.input}
                        required
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="company-phone" className={STYLE.label}>
                          Nomor WhatsApp
                        </Label>
                        {verifiedPhone ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#12A150]">
                            <BadgeCheck className="size-3" aria-hidden />
                            Terverifikasi
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleSendOtp()}
                            disabled={sendOtp.isPending}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#1F6BD8] disabled:opacity-50"
                          >
                            {sendOtp.isPending ? (
                              <Loader2
                                className="size-3 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Send className="size-3" aria-hidden />
                            )}
                            Kirim OTP
                          </button>
                        )}
                      </div>
                      <Input
                        id="company-phone"
                        value={company.phone}
                        onChange={(event) =>
                          patchCompany({ phone: event.target.value })
                        }
                        placeholder="08xxxxxxxxxx"
                        inputMode="tel"
                        autoComplete="tel"
                        disabled={Boolean(verifiedPhone)}
                        className={STYLE.input}
                        required
                      />
                    </div>
                  </div>

                  {otpSentTo && !verifiedPhone && (
                    <div className="flex flex-col gap-2 rounded-[10px] bg-[#F8F9FB] p-3">
                      <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                        2 · Kode OTP ke {otpSentTo}
                      </p>
                      <OtpInput
                        value={code}
                        onChange={(value) => {
                          setCode(value);
                          if (otpStatus === "error") setOtpStatus("idle");
                        }}
                        onComplete={(value) => void handleVerify(value)}
                        status={otpStatus}
                        disabled={verifyOtp.isPending}
                        size="sm"
                        autoFocus
                      />
                      <p className="text-[10.5px] font-medium text-[#8C94A1]">
                        Kode berlaku 5 menit. Tidak menerima kode? Kirim ulang
                        setelah 60 detik.
                      </p>
                    </div>
                  )}

                  <div className="h-px w-full bg-[#F2F4F7]" />

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="company-address" className={STYLE.label}>
                      Alamat kantor pusat
                    </Label>
                    <Textarea
                      id="company-address"
                      value={company.address}
                      onChange={(event) =>
                        patchCompany({ address: event.target.value })
                      }
                      placeholder="Alamat kantor pusat"
                      rows={3}
                      className="rounded-[9px] text-[12.5px] ring-1 ring-[#E8EAEE]"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                    Lokasi pertama
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="area-name" className={STYLE.label}>
                      Nama lokasi
                    </Label>
                    <Input
                      id="area-name"
                      value={area.name}
                      onChange={(event) =>
                        setArea((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Kantor Pusat"
                      className={STYLE.input}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className={STYLE.label}>Area absensi</Label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.geolocation?.getCurrentPosition(
                            (position) =>
                              setArea((current) => ({
                                ...current,
                                latitude: Number(
                                  position.coords.latitude.toFixed(6),
                                ),
                                longitude: Number(
                                  position.coords.longitude.toFixed(6),
                                ),
                              })),
                            () => toast.error("Lokasi tidak bisa dibaca."),
                          );
                        }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#1F6BD8]"
                      >
                        <MapPin className="size-3" aria-hidden />
                        Gunakan lokasi saya
                      </button>
                    </div>
                    <div className="h-[240px] overflow-hidden rounded-[12px] ring-1 ring-[#E8EAEE]">
                      <BranchGeofenceMap
                        latitude={area.latitude}
                        longitude={area.longitude}
                        radiusMeters={area.radiusMeters}
                        onChange={(coords) =>
                          setArea((current) => ({ ...current, ...coords }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="area-radius" className={STYLE.label}>
                      Radius area absensi: {area.radiusMeters} meter
                    </Label>
                    <input
                      id="area-radius"
                      type="range"
                      min={20}
                      max={2000}
                      step={10}
                      value={area.radiusMeters}
                      onChange={(event) =>
                        setArea((current) => ({
                          ...current,
                          radiusMeters: Number(event.target.value),
                        }))
                      }
                      className="w-full accent-[#2F80ED]"
                    />
                    <p className="text-[10.5px] font-medium text-[#8C94A1]">
                      Klik peta untuk menaruh titik kantor. Default 100 m.
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-[10.5px] font-extrabold tracking-[1.1px] text-[#8C94A1] uppercase">
                    Pola hari &amp; jam kerja
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label className={STYLE.label}>Hari kerja per minggu</Label>
                    <div className="flex gap-2">
                      {[5, 6].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setHours((current) => ({
                              ...current,
                              workDaysPerWeek: days,
                              end: days === 5 ? "17:00" : "15:00",
                            }))
                          }
                          className={cn(
                            "flex h-10 flex-1 flex-col items-start justify-center rounded-[9px] px-3 text-[12px] font-bold ring-1 transition-colors",
                            hours.workDaysPerWeek === days
                              ? "bg-[#EAF2FE] text-[#1F6BD8] ring-[1.5px] ring-[#2F80ED]"
                              : "text-[#6B7280] ring-[#E8EAEE] hover:bg-[#F8F9FB]",
                          )}
                        >
                          {days} hari
                          <span className="text-[10px] font-semibold text-[#8C94A1]">
                            {days === 5 ? "Senin–Jumat" : "Senin–Sabtu"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor="work-start" className={STYLE.label}>
                        Jam masuk
                      </Label>
                      <Input
                        id="work-start"
                        type="time"
                        value={hours.start}
                        onChange={(event) =>
                          setHours((current) => ({
                            ...current,
                            start: event.target.value,
                          }))
                        }
                        className={STYLE.input}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor="work-end" className={STYLE.label}>
                        Jam pulang
                      </Label>
                      <Input
                        id="work-end"
                        type="time"
                        value={hours.end}
                        onChange={(event) =>
                          setHours((current) => ({
                            ...current,
                            end: event.target.value,
                          }))
                        }
                        className={STYLE.input}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="work-tolerance" className={STYLE.label}>
                      Toleransi terlambat (menit)
                    </Label>
                    <Input
                      id="work-tolerance"
                      type="number"
                      min={0}
                      max={120}
                      value={hours.tolerance}
                      onChange={(event) =>
                        setHours((current) => ({
                          ...current,
                          tolerance: Number(event.target.value),
                        }))
                      }
                      className={STYLE.input}
                    />
                  </div>

                  <p className="text-[10.5px] font-medium text-[#8C94A1]">
                    {hours.workDaysPerWeek} hari kerja, {hours.start}–{hours.end}{" "}
                    (
                    {minuteToTime(
                      timeToMinute(hours.end) - timeToMinute(hours.start),
                    )}{" "}
                    jam), toleransi {hours.tolerance} menit.
                  </p>
                </>
              )}
            </div>

            <aside className="flex w-full shrink-0 flex-col gap-3 rounded-[14px] bg-[#F5F8FE] p-[18px] lg:w-[300px]">
              <p className="text-[12px] font-extrabold">Yang kami siapkan</p>
              {[
                "Email + kata sandi untuk masuk",
                "Akun untuk seluruh karyawan",
                "Area absensi + radius",
                "Jam kerja & toleransi",
                "Kode OTP lewat WhatsApp",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-white">
                    <Check className="size-[11px] text-[#12A150]" aria-hidden />
                  </span>
                  <span className="text-[11.5px] leading-[17px] font-semibold">
                    {item}
                  </span>
                </span>
              ))}
              <div className="h-px w-full bg-[#DCE5F3]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10.5px] font-semibold text-[#6B7280]">
                  Sisa waktu pengaturan
                </p>
                <p className="text-[13px] font-extrabold text-[#1F6BD8]">
                  ± {Math.max(1, STEPS.length - step)} menit lagi
                </p>
              </div>
              <p className="text-[10.5px] leading-[15px] font-medium text-[#8C94A1]">
                Semua pengaturan bisa diubah kapan saja di menu Area &amp; cabang.
              </p>
            </aside>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11.5px] font-semibold text-[#6B7280]">
              Langkah {step + 1} dari {STEPS.length} · biasanya selesai dalam 3
              menit
            </p>
            <div className="flex items-center gap-[10px]">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-[42px] rounded-[10px] px-4 text-[12.5px] font-bold"
                  onClick={() => setStep((current) => current - 1)}
                  disabled={busy}
                >
                  Kembali
                </Button>
              )}
              <Button
                type="button"
                className="h-[42px] gap-2 rounded-[10px] px-[18px] text-[12.5px] font-extrabold"
                onClick={() => void handleNext()}
                disabled={busy}
              >
                {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                {step === STEPS.length - 1 ? "Simpan & selesai" : "Simpan & lanjut"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
