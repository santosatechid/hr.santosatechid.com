"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw, ShieldCheck } from "lucide-react";

import { compareEmbeddings, captureEmbedding } from "@/lib/face/human";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Minimal kemiripan agar absen boleh dikirim (PRD: face hanya verifikasi ringan). */
const DEFAULT_THRESHOLD = 0.6;

export default function FaceCaptureDialog({
  open,
  onOpenChange,
  onCaptured,
  referenceTemplate,
  onVerified,
  title = "Ambil foto wajah",
  description = "Pastikan wajah terlihat jelas dan pencahayaan cukup.",
  busyLabel = "Memeriksa wajah...",
  threshold = DEFAULT_THRESHOLD,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptured?: (embedding: number[]) => Promise<void> | void;
  referenceTemplate?: number[] | null;
  onVerified?: (score: number) => Promise<void> | void;
  title?: string;
  description?: string;
  busyLabel?: string;
  threshold?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      setBusy(false);
      setScore(null);
      return;
    }

    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 360 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) {
          setError(
            "Kamera tidak bisa dibuka. Izinkan akses kamera di browser, lalu coba lagi.",
          );
        }
      }
    }
    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    setError(null);
    setScore(null);
    try {
      const embedding = await captureEmbedding(video);
      if (!embedding) {
        setError(
          "Wajah belum terdeteksi. Dekatkan wajah ke kamera dan coba lagi.",
        );
        return;
      }
      if (referenceTemplate?.length) {
        // Skor ditampilkan dulu; absen baru bisa dikirim kalau lulus ambang.
        const value = await compareEmbeddings(referenceTemplate, embedding);
        setScore(value);
        if (value < threshold) {
          setError(
            `Kemiripan ${Math.round(value * 100)}% — minimal ${Math.round(
              threshold * 100,
            )}%. Ambil ulang dengan cahaya lebih terang.`,
          );
        }
        return;
      }
      if (!onCaptured) {
        // Mode verifikasi tanpa template: jangan tutup diam-diam, absen tidak
        // akan pernah terkirim dan pengguna tidak tahu kenapa.
        setError(
          "Data wajah belum termuat. Tutup dialog ini lalu ulangi absen.",
        );
        return;
      }
      await onCaptured(embedding);
      onOpenChange(false);
    } catch {
      setError("Gagal memproses wajah. Coba ambil ulang.");
    } finally {
      setBusy(false);
    }
  };
  const submitVerified = async () => {
    if (score === null || score < threshold) return;
    setBusy(true);
    try {
      await onVerified?.(score);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const percent = score === null ? null : Math.round(score * 100);
  const passed = score !== null && score >= threshold;
  const needsReference = Boolean(referenceTemplate?.length);
  /** Niat verifikasi tapi template tidak ada → tombol jangan menutup diam-diam. */
  const verifyBroken = Boolean(onVerified) && !needsReference;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
          {busy && (
            <div className="bg-background/70 absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-xs font-medium">{busyLabel}</p>
            </div>
          )}
        </div>

        {percent !== null && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold">Kemiripan wajah</p>
              <p
                className={`text-[18px] leading-none font-extrabold tabular-nums ${
                  passed ? "text-[#15803D]" : "text-[#DC2626]"
                }`}
              >
                {percent}%
              </p>
            </div>
            <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  passed ? "bg-[#16A34A]" : "bg-[#DC2626]"
                }`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-[10.5px]">
              {passed
                ? `Lolos verifikasi (minimal ${Math.round(threshold * 100)}%).`
                : `Belum lolos. Minimal ${Math.round(threshold * 100)}% untuk absen.`}
            </p>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {verifyBroken && (
          <p className="text-destructive text-sm">
            Data wajah belum termuat, jadi absen tidak bisa diverifikasi. Tutup
            dialog ini lalu ulangi absen.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Batal
          </Button>

          {score !== null && needsReference && (
            <Button variant="outline" onClick={capture} disabled={busy}>
              <RotateCcw className="size-4" /> Ambil ulang
            </Button>
          )}

          {score !== null && needsReference ? (
            <Button onClick={submitVerified} disabled={busy || !passed}>
              <ShieldCheck className="size-4" /> Lanjutkan absen
            </Button>
          ) : (
            <Button onClick={capture} disabled={busy || verifyBroken}>
              <Camera className="size-4" /> Ambil foto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
