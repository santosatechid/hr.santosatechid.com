"use client";

import { useState } from "react";
import { Clock3, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  useAttendanceAction,
  useEnrollFace,
  useGetAttendanceToday,
  useGetFaceTemplate,
} from "@/hooks/attendance/useAttendance";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/pageHeader";

/** Human loads WebAssembly/WebGL at import time, so keep it out of SSR. */
const FaceCaptureDialog = dynamic(
  () => import("@/components/attendance/FaceCaptureDialog"),
  { ssr: false },
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** ponytail: fixed 0.6 match score, tune from real clock-ins if needed. */
const FACE_MATCH_THRESHOLD = 0.6;

const timeOf = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getPosition = () => {
  const { promise, resolve, reject } =
    Promise.withResolvers<GeolocationPosition>();
  if (!navigator.geolocation) {
    reject(new Error("Browser ini tidak mendukung lokasi."));
    return promise;
  }
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 0,
  });
  return promise;
};

export default function AttendancePage() {
  const { data, isLoading, error } = useGetAttendanceToday();
  const {
    data: faceTemplate,
    isLoading: templateLoading,
    error: templateError,
  } = useGetFaceTemplate();
  const action = useAttendanceAction();
  const enrollFace = useEnrollFace();
  const [pendingAction, setPendingAction] = useState<
    "check-in" | "check-out" | null
  >(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"verify" | "enroll">("verify");

  const today = data?.today;
  const branch = data?.branch;
  const hasCheckedOut = Boolean(today?.checkOutAt);
  /** Template harus benar-benar sudah dimuat; `hasFace` saja belum cukup. */
  const hasTemplate = Boolean(faceTemplate?.template?.length);
  const nextAction: "check-in" | "check-out" = today?.checkInAt
    ? "check-out"
    : "check-in";

  const submit = async (
    target: "check-in" | "check-out",
    position: GeolocationPosition,
  ) => {
    try {
      await action.mutateAsync({
        action: target,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      toast.success(
        target === "check-in"
          ? "Absen masuk tercatat."
          : "Absen pulang tercatat.",
      );
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    }
  };

  const openCamera = (mode: "verify" | "enroll") => {
    setCameraMode(mode);
    setPendingAction(nextAction);
    setCameraOpen(true);
  };

  const start = () => {
    if (templateLoading) {
      toast.error("Data wajah masih dimuat. Tunggu sebentar, lalu coba lagi.");
      return;
    }
    if (!branch) {
      toast.error("Kamu belum punya cabang. Hubungi admin, ya.");
      return;
    }
    if (branch.latitude === null || branch.longitude === null) {
      toast.error("Area absensi cabang belum diatur admin.");
      return;
    }
    // Verifikasi butuh template yang benar-benar termuat; kalau tidak ada,
    // daftarkan wajah dulu supaya absen tidak berhenti tanpa jejak.
    openCamera(hasTemplate ? "verify" : "enroll");
  };

  const enroll = async (embedding: number[]) => {
    const target = pendingAction;
    try {
      await enrollFace.mutateAsync(embedding);
    } catch (enrollError) {
      toast.error(getErrorMessage(enrollError));
      throw enrollError;
    }
    toast.success("Wajah tersimpan.");
    if (!target) return;
    try {
      const position = await getPosition();
      await submit(target, position);
    } catch (positionError) {
      toast.error(
        positionError instanceof Error
          ? positionError.message
          : "Lokasi tidak terbaca. Nyalakan GPS lalu coba lagi.",
      );
    }
  };

  const verified = async (score: number) => {
    const target = pendingAction;
    if (!target) return;
    if (score < FACE_MATCH_THRESHOLD) {
      toast.error(
        `Wajah belum cocok (${Math.round(score * 100)}%). Coba lagi dengan cahaya lebih terang.`,
      );
      return;
    }
    try {
      const position = await getPosition();
      await submit(target, position);
      setPendingAction(null);
    } catch (positionError) {
      toast.error(
        positionError instanceof Error
          ? positionError.message
          : "Lokasi tidak terbaca. Nyalakan GPS lalu coba lagi.",
      );
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Absensi"
        description="Absen masuk dan pulang dari lokasi cabangmu."
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      {templateError && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          Data wajah tidak bisa dimuat: {getErrorMessage(templateError)}{" "}
          Daftarkan ulang wajah untuk bisa absen.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-4" /> Hari ini
          </CardTitle>
          <CardDescription>{data?.date ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-secondary/40 rounded-xl px-4 py-3">
              <p className="text-muted-foreground text-[11px] font-semibold">
                Masuk
              </p>
              <p className="text-lg font-extrabold">
                {timeOf(today?.checkInAt)}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl px-4 py-3">
              <p className="text-muted-foreground text-[11px] font-semibold">
                Pulang
              </p>
              <p className="text-lg font-extrabold">
                {timeOf(today?.checkOutAt)}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl px-4 py-3">
              <p className="text-muted-foreground text-[11px] font-semibold">
                Cabang
              </p>
              <p className="text-sm font-bold">{branch?.name ?? "Belum ada"}</p>
            </div>
          </div>

          <div className="border-border flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-t pt-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {branch?.radiusMeters
                    ? `Radius ${branch.radiusMeters} m`
                    : "Area belum diatur"}
                </span>
                <span className="inline-flex items-center gap-1">
                  {hasTemplate ? (
                    <>
                      <ShieldCheck className="size-3.5" /> Wajah aktif
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="size-3.5" /> Belum daftar wajah
                    </>
                  )}
                </span>
                {today?.method && (
                  <Badge variant="outline">{today.method}</Badge>
                )}
              </div>

              {hasCheckedOut && (
                <p className="text-muted-foreground text-xs">
                  Sudah absen pulang {timeOf(today?.checkOutAt)}. Mau pulang
                  lebih larut? Absen pulang lagi — jam terakhir yang dipakai.
                </p>
              )}

              {!hasTemplate && (
                <p className="text-muted-foreground text-xs">
                  Wajah kamu belum siap dipakai absen. Absen akan meminta daftar
                  wajah dulu — sekali saja, lalu absen jalan seperti biasa.
                </p>
              )}
            </div>

            <Button
              className="w-full sm:w-auto sm:min-w-[240px]"
              size="lg"
              disabled={action.isPending || !branch || templateLoading}
              onClick={start}
            >
              {action.isPending
                ? "Menyimpan..."
                : templateLoading
                  ? "Memuat data wajah..."
                  : nextAction === "check-in"
                    ? "Absen masuk"
                    : hasCheckedOut
                      ? "Absen pulang lagi"
                      : "Absen pulang"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FaceCaptureDialog
        open={cameraOpen}
        onOpenChange={(open) => {
          setCameraOpen(open);
          if (!open) setPendingAction(null);
        }}
        onCaptured={cameraMode === "enroll" ? enroll : undefined}
        onVerified={cameraMode === "verify" ? verified : undefined}
        referenceTemplate={
          cameraMode === "verify" ? (faceTemplate?.template ?? null) : null
        }
        threshold={FACE_MATCH_THRESHOLD}
        title={cameraMode === "enroll" ? "Daftarkan wajah" : "Verifikasi wajah"}
        description={
          cameraMode === "enroll"
            ? "Wajah kamu belum tersimpan. Ambil foto sekali untuk bisa absen."
            : "Arahkan wajah ke kamera, lalu ambil foto untuk melanjutkan absen."
        }
        busyLabel={
          cameraMode === "enroll"
            ? "Menyimpan wajah..."
            : "Mencocokkan wajah..."
        }
      />
    </div>
  );
}
