"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";

import { useGetCorrections } from "@/hooks/attendance/useAttendance";
import {
  useCreateLeaveRequest,
  useGetLeaveRequests,
} from "@/hooks/requests/useRequests";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
import { PageHeader } from "@/components/layout/pageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const LEAVE_TYPES = ["Cuti tahunan", "Izin", "Sakit"];

const STATUS_LABEL = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
} as const;

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "secondary",
} as const;

const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const EMPTY_FORM = {
  leaveType: "Cuti tahunan",
  startDate: "",
  endDate: "",
  reason: "",
};

export default function RequestsPage() {
  const { data: leaves = [], isLoading, refetch } = useGetLeaveRequests();
  const { data: corrections = [] } = useGetCorrections();
  const createLeave = useCreateLeaveRequest();
  const [form, setForm] = useState(EMPTY_FORM);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error("Isi tanggal mulai dan selesai, ya.");
      return;
    }
    try {
      await createLeave.mutateAsync(form);
      toast.success("Pengajuan terkirim. Admin akan meninjau.");
      setForm(EMPTY_FORM);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengajuan"
        description="Ajukan cuti atau izin, lalu pantau statusnya di sini."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Ajukan cuti atau izin</CardTitle>
            <CardDescription>
              Saldo cuti tidak dihitung otomatis; admin meninjau tiap pengajuan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select
                    value={form.leaveType}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, leaveType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-start">Mulai</Label>
                  <Input
                    id="leave-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-end">Selesai</Label>
                  <Input
                    id="leave-end"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-reason">Alasan</Label>
                <Textarea
                  id="leave-reason"
                  rows={3}
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Ceritakan singkat alasan pengajuan."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={createLeave.isPending}>
                  {createLeave.isPending ? "Mengirim..." : "Kirim pengajuan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat cuti & izin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaves.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Belum ada pengajuan cuti atau izin.
                </p>
              )}
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {leave.leaveType} · {fmtDate(leave.startDate)} –{" "}
                      {fmtDate(leave.endDate)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {leave.reason}
                    </p>
                    {leave.responseNote && (
                      <p className="text-muted-foreground text-xs">
                        Catatan admin: {leave.responseNote}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[leave.status]}>
                    {STATUS_LABEL[leave.status]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat koreksi jam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {corrections.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Belum ada pengajuan koreksi jam.
                </p>
              )}
              {corrections.map((correction) => (
                <div
                  key={correction.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Koreksi {fmtDate(correction.workDate)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {correction.reason}
                    </p>
                    {correction.responseNote && (
                      <p className="text-muted-foreground text-xs">
                        Catatan admin: {correction.responseNote}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[correction.status]}>
                    {STATUS_LABEL[correction.status]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
