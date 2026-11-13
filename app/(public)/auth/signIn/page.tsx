"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput, type OtpStatus } from "@/components/ui/otp-input";
import { toast } from "@/components/ui/toast";
import { GoogleMark } from "@/components/entry/GoogleMark";
import {
  EntryDivider,
  EntryField,
  EntryForm,
  EntryHeading,
  EntryScreen,
} from "@/components/entry/Entry";
import { apiGet, apiPut } from "@/lib/http/apiClient";
import { signIn } from "@/services/auth/authClients";

/**
 * Entry satu pintu: email dulu, lalu rutenya ditentukan akunnya.
 *
 * - Email Google → OAuth Google, tanpa kata sandi.
 * - Email lain → OTP 6 digit ke inbox; akun baru otomatis dibuat, lalu
 *   karyawan/owner membuat kata sandi sendiri.
 * - Halaman `/auth/continue` yang memutuskan tujuan setelah sesi ada
 *   (buat perusahaan atau onboarding karyawan).
 */
const GOOGLE_DOMAINS = ["gmail.com", "googlemail.com"];

const NEXT = "/auth/continue";

type Step = "email" | "otp" | "password" | "kredensial";

const isGoogleEmail = (value: string) =>
  GOOGLE_DOMAINS.includes(value.split("@")[1]?.toLowerCase() ?? "");

const postAuth = async (path: string, body: unknown) => {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Permintaan gagal.");
  }
  return data;
};

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const normalizedEmail = email.trim().toLowerCase();

  const startGoogle = async () => {
    try {
      setLoading(true);
      await signIn.social(
        { provider: "google", callbackURL: NEXT },
        {
          onError: (ctx) => {
            setLoading(false);
            toast.error(ctx.error.message || "Gagal masuk pakai akun Google.");
          },
        },
      );
    } catch (error) {
      setLoading(false);
      toast.error(errorText(error, "Ada kendala saat masuk pakai Google."));
    }
  };

  const requestOtp = async () => {
    await postAuth("email-otp/send-verification-otp", {
      email: normalizedEmail,
      type: "sign-in",
    });
    setResendIn(30);
    setCode("");
    setOtpStatus("idle");
    setStep("otp");
  };

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!normalizedEmail) {
      toast.error("Isi email kerja dulu, ya.");
      return;
    }
    if (isGoogleEmail(normalizedEmail)) {
      await startGoogle();
      return;
    }
    try {
      setLoading(true);
      await requestOtp();
      toast.success(`Kode masuk dikirim ke ${normalizedEmail}.`);
    } catch (error) {
      toast.error(errorText(error, "Kode gagal dikirim. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (value: string) => {
    try {
      setLoading(true);
      await postAuth("sign-in/email-otp", {
        email: normalizedEmail,
        otp: value,
        name:
          normalizedEmail.split("@")[0].replaceAll(".", " ") ||
          normalizedEmail,
      });
      setOtpStatus("success");
      const account = await apiGet<{ hasPassword: boolean }>(
        "/api/onboarding/account",
      );
      setHasPassword(account.data.hasPassword);
      setStep("password");
    } catch (error) {
      setOtpStatus("error");
      toast.error(errorText(error, "Kode kurang pas. Coba cek lagi."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await requestOtp();
      toast.success("Kode baru sudah dikirim.");
    } catch (error) {
      toast.error(errorText(error, "Kode gagal dikirim. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi belum sama.");
      return;
    }
    try {
      setLoading(true);
      await apiPut("/api/onboarding/account", { password });
      toast.success("Kata sandi tersimpan.");
      router.replace(NEXT);
    } catch (error) {
      toast.error(errorText(error, "Kata sandi gagal disimpan."));
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!normalizedEmail || !credentialPassword) {
      toast.error("Isi email dan kata sandi dulu, ya.");
      return;
    }
    try {
      setLoading(true);
      await signIn.email(
        {
          email: normalizedEmail,
          password: credentialPassword,
          callbackURL: NEXT,
          rememberMe,
        },
        {
          onError: (ctx) => {
            setLoading(false);
            toast.error(
              ctx.error.message ||
                "Email atau kata sandi kurang pas. Coba cek lagi, ya.",
            );
          },
          onSuccess: () => {
            setLoading(false);
            router.replace(NEXT);
          },
        },
      );
    } catch (error) {
      setLoading(false);
      toast.error(errorText(error, "Ada kendala saat masuk."));
    }
  };

  return (
    <EntryScreen>
      <EntryForm>
        {step === "email" && (
          <>
            <EntryHeading
              title="Masuk ke Santosa HR"
              description="Masukkan email kerja. Kami cek akunmu dulu, lalu arahkan ke langkah yang pas."
            />
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
              <EntryField
                label="Email"
                htmlFor="email"
                delay="animate-element animate-delay-300"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </EntryField>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="animate-element animate-delay-600 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Memuat...
                  </>
                ) : (
                  "Lanjut"
                )}
              </Button>
            </form>

            <EntryDivider label="atau lanjut pakai" />

            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={loading}
              onClick={startGoogle}
              className="animate-element animate-delay-800 w-full"
            >
              <GoogleMark />
              Lanjut pakai Google
            </Button>

            <p className="text-muted-foreground animate-element animate-delay-900 text-center text-xs font-medium">
              Sudah punya kata sandi?{" "}
              <button
                type="button"
                onClick={() => setStep("kredensial")}
                className="text-interactive font-bold underline-offset-4 hover:underline"
              >
                Masuk pakai kata sandi
              </button>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <EntryHeading
              title="Cek email kamu"
              description={`Kode 6 digit dikirim ke ${normalizedEmail}. Berlaku 5 menit.`}
            />
            <div className="animate-element animate-delay-300 flex flex-col gap-5">
              <OtpInput
                length={6}
                size="md"
                autoFocus
                value={code}
                onChange={setCode}
                onComplete={(value) => void verifyCode(value)}
                status={otpStatus}
                disabled={loading}
                className="justify-center"
              />
              <Button
                type="button"
                size="lg"
                disabled={loading || code.length < 6}
                onClick={() => void verifyCode(code)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>

            <div className="animate-element animate-delay-600 flex items-center justify-between gap-3 text-xs font-medium">
              <button
                type="button"
                disabled={loading || resendIn > 0}
                onClick={() => void handleResend()}
                className="text-interactive font-bold underline-offset-4 hover:underline disabled:opacity-50"
              >
                {resendIn > 0 ? `Kirim ulang (${resendIn}s)` : "Kirim ulang kode"}
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-muted-foreground font-bold underline-offset-4 hover:underline"
              >
                Ganti email
              </button>
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <EntryHeading
              title={hasPassword ? "Atur kata sandimu" : "Buat kata sandi"}
              description={
                hasPassword
                  ? "Kata sandi akunmu diatur admin. Ganti dengan kata sandimu sendiri supaya aman."
                  : "Akun ini belum punya kata sandi. Buat sekarang supaya lain kali bisa masuk tanpa OTP."
              }
            />
            <form
              onSubmit={handleSavePassword}
              className="flex flex-col gap-6"
            >
              <EntryField
                label="Kata sandi baru"
                htmlFor="password"
                delay="animate-element animate-delay-300"
              >
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </EntryField>
              <EntryField
                label="Ulangi kata sandi"
                htmlFor="confirm"
                delay="animate-element animate-delay-400"
              >
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </EntryField>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="animate-element animate-delay-600 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan & lanjut"
                )}
              </Button>
            </form>
            {hasPassword && (
              <p className="text-muted-foreground animate-element animate-delay-800 text-center text-xs font-medium">
                Nanti saja?{" "}
                <button
                  type="button"
                  onClick={() => router.replace(NEXT)}
                  className="text-interactive font-bold underline-offset-4 hover:underline"
                >
                  Lanjut tanpa ganti kata sandi
                </button>
              </p>
            )}
          </>
        )}

        {step === "kredensial" && (
          <>
            <EntryHeading
              title="Masuk pakai kata sandi"
              description="Untuk akun yang sudah punya kata sandi sendiri."
            />
            <form
              onSubmit={handleCredentialSignIn}
              className="flex flex-col gap-6"
            >
              <EntryField
                label="Email"
                htmlFor="email"
                delay="animate-element animate-delay-300"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </EntryField>
              <EntryField
                label="Kata sandi"
                htmlFor="password"
                delay="animate-element animate-delay-400"
              >
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={credentialPassword}
                  onChange={(event) =>
                    setCredentialPassword(event.target.value)
                  }
                />
              </EntryField>
              <div className="animate-element animate-delay-500 flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-normal"
                >
                  Ingat aku di perangkat ini
                </Label>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="animate-element animate-delay-600 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Memuat...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
            <p className="text-muted-foreground animate-element animate-delay-800 text-center text-xs font-medium">
              Belum punya kata sandi?{" "}
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-interactive font-bold underline-offset-4 hover:underline"
              >
                Masuk pakai kode email
              </button>
            </p>
          </>
        )}
      </EntryForm>
    </EntryScreen>
  );
}
