"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  useCreateCorrection,
  useGetAttendanceLogs,
  useGetCorrections,
} from "@/hooks/attendance/useAttendance";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
import { PageHeader } from "@/components/layout/pageHeader";
import {
  DataTableCard,
  DataTableEmpty,
  DataTableFooter,
  DataTableHeadCell,
  DataTableHeadRow,
  DataTableRow,
  DataTableSearch,
  paginate,
} from "@/components/layout/dataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const fmtTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "secondary",
} as const;

export default function AttendanceLogsPage() {
  const { data: logs = [], isLoading, error } = useGetAttendanceLogs();
  const { data: corrections = [], refetch } = useGetCorrections();
  const createCorrection = useCreateCorrection();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: "",
    checkInAt: "",
    checkOutAt: "",
    reason: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [correctionPage, setCorrectionPage] = useState(1);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [
        log.workDate,
        fmtDate(log.workDate),
        log.method,
        log.branch?.name ?? "",
        fmtTime(log.checkInAt),
        fmtTime(log.checkOutAt),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);
  const { pageCount, current, visible } = paginate(filteredLogs, page, 10);

  const filteredCorrections = useMemo(() => {
    const query = correctionSearch.trim().toLowerCase();
    if (!query) return corrections;
    return corrections.filter((correction) =>
      [
        fmtDate(correction.workDate),
        fmtTime(correction.requestedCheckInAt),
        fmtTime(correction.requestedCheckOutAt),
        correction.reason,
        correction.status,
        correction.responseNote ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [corrections, correctionSearch]);
  const {
    pageCount: correctionPageCount,
    current: correctionCurrent,
    visible: visibleCorrections,
  } = paginate(filteredCorrections, correctionPage, 10);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.date || !form.checkInAt) {
      toast.error("Isi tanggal dan jam masuk, ya.");
      return;
    }
    try {
      await createCorrection.mutateAsync({
        date: form.date,
        checkInAt: new Date(`${form.date}T${form.checkInAt}`).toISOString(),
        checkOutAt: form.checkOutAt
          ? new Date(`${form.date}T${form.checkOutAt}`).toISOString()
          : undefined,
        reason: form.reason,
      });
      toast.success("Pengajuan koreksi terkirim. Tunggu persetujuan admin.");
      setOpen(false);
      setForm({ date: "", checkInAt: "", checkOutAt: "", reason: "" });
      refetch();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Log absensi"
        description="Riwayat absenmu dan status pengajuan koreksi."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Ajukan koreksi
          </Button>
        }
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      <DataTableCard
        toolbar={
          <>
            <p className="text-[11.5px] font-semibold text-[#6B7280]">
              {filteredLogs.length} absensi
            </p>
            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Cari tanggal, cabang, metode"
              label="Cari log absensi"
            />
          </>
        }
      >
        <Table>
          <TableHeader>
            <DataTableHeadRow>
              <DataTableHeadCell>Tanggal</DataTableHeadCell>
              <DataTableHeadCell>Masuk</DataTableHeadCell>
              <DataTableHeadCell>Pulang</DataTableHeadCell>
              <DataTableHeadCell>Cabang</DataTableHeadCell>
              <DataTableHeadCell>Metode</DataTableHeadCell>
            </DataTableHeadRow>
          </TableHeader>
          <TableBody>
            {visible.map((log) => (
              <DataTableRow key={log.id}>
                <TableCell className="px-4">{fmtDate(log.workDate)}</TableCell>
                <TableCell className="px-4">{fmtTime(log.checkInAt)}</TableCell>
                <TableCell className="px-4">
                  {fmtTime(log.checkOutAt)}
                </TableCell>
                <TableCell className="text-muted-foreground px-4">
                  {log.branch?.name ?? "—"}
                </TableCell>
                <TableCell className="px-4">
                  <Badge variant="outline">{log.method}</Badge>
                </TableCell>
              </DataTableRow>
            ))}
            {visible.length === 0 && (
              <DataTableEmpty colSpan={5}>
                {logs.length === 0
                  ? "Belum ada absensi tercatat."
                  : "Tidak ada absensi yang cocok dengan pencarian."}
              </DataTableEmpty>
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          from={filteredLogs.length === 0 ? 0 : (current - 1) * 10 + 1}
          to={Math.min(current * 10, filteredLogs.length)}
          total={filteredLogs.length}
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          noun="absensi"
        />
      </DataTableCard>

      <div className="space-y-2">
        <h2 className="text-sm font-bold">Pengajuan koreksi</h2>
        <DataTableCard
          toolbar={
            <>
              <p className="text-[11.5px] font-semibold text-[#6B7280]">
                {filteredCorrections.length} koreksi
              </p>
              <DataTableSearch
                value={correctionSearch}
                onChange={(value) => {
                  setCorrectionSearch(value);
                  setCorrectionPage(1);
                }}
                placeholder="Cari tanggal, alasan, status"
                label="Cari pengajuan koreksi"
              />
            </>
          }
        >
          <Table>
            <TableHeader>
              <DataTableHeadRow>
                <DataTableHeadCell>Tanggal</DataTableHeadCell>
                <DataTableHeadCell>Diminta</DataTableHeadCell>
                <DataTableHeadCell>Alasan</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell>Catatan admin</DataTableHeadCell>
              </DataTableHeadRow>
            </TableHeader>
            <TableBody>
              {visibleCorrections.map((correction) => (
                <DataTableRow key={correction.id}>
                  <TableCell className="px-4">
                    {fmtDate(correction.workDate)}
                  </TableCell>
                  <TableCell className="px-4">
                    {fmtTime(correction.requestedCheckInAt)} –{" "}
                    {fmtTime(correction.requestedCheckOutAt)}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate px-4">
                    {correction.reason}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant={STATUS_VARIANT[correction.status]}>
                      {correction.status === "pending"
                        ? "Menunggu"
                        : correction.status === "approved"
                          ? "Disetujui"
                          : "Ditolak"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 text-sm">
                    {correction.responseNote || "—"}
                  </TableCell>
                </DataTableRow>
              ))}
              {visibleCorrections.length === 0 && (
                <DataTableEmpty colSpan={5}>
                  {corrections.length === 0
                    ? "Belum ada pengajuan koreksi."
                    : "Tidak ada koreksi yang cocok dengan pencarian."}
                </DataTableEmpty>
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            from={
              filteredCorrections.length === 0
                ? 0
                : (correctionCurrent - 1) * 10 + 1
            }
            to={Math.min(correctionCurrent * 10, filteredCorrections.length)}
            total={filteredCorrections.length}
            page={correctionCurrent}
            pageCount={correctionPageCount}
            onPageChange={setCorrectionPage}
            noun="koreksi"
          />
        </DataTableCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajukan koreksi jam</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correction-date">Tanggal</Label>
              <Input
                id="correction-date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="correction-in">Jam masuk</Label>
                <Input
                  id="correction-in"
                  type="time"
                  value={form.checkInAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      checkInAt: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correction-out">Jam pulang</Label>
                <Input
                  id="correction-out"
                  type="time"
                  value={form.checkOutAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      checkOutAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-reason">Alasan</Label>
              <Textarea
                id="correction-reason"
                rows={3}
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Contoh: lupa absen pulang karena lembur."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createCorrection.isPending}>
                {createCorrection.isPending ? "Mengirim..." : "Kirim pengajuan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
