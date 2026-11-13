"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Clock3, History, X, XCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { useAdminRequests, useDecideRequest } from "@/hooks/requests/useRequests";
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

const STATUS_META = {
  pending: { label: "Menunggu", variant: "warning", icon: Clock3 },
  approved: { label: "Disetujui", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Ditolak", variant: "secondary", icon: XCircle },
} as const;

type StatusKey = keyof typeof STATUS_META;

/** Status selalu ikon + teks, bukan warna saja (PRD §11.1 no.6). */
function StatusChip({ status }: { status: StatusKey }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

type HistoryRow = {
  title: string;
  submittedAt?: string | null;
  status: StatusKey;
  reviewer?: string | null;
  reviewedAt?: string | null;
  note?: string | null;
};

type Pending = {
  type: "correction" | "leave";
  id: string;
  label: string;
  decision: "approve" | "reject";
};

export default function AdminRequestsPage() {
  const { data, isLoading, refetch } = useAdminRequests();
  const decide = useDecideRequest();
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<HistoryRow | null>(null);
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [correctionPage, setCorrectionPage] = useState(1);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leavePage, setLeavePage] = useState(1);

  const corrections = data?.corrections ?? [];
  const leaves = data?.leaves ?? [];

  const filteredCorrections = useMemo(() => {
    const query = correctionSearch.trim().toLowerCase();
    if (!query) return corrections;
    return corrections.filter(
      (row) =>
        row.userData.name.toLowerCase().includes(query) ||
        (row.reason || "").toLowerCase().includes(query),
    );
  }, [corrections, correctionSearch]);
  const correctionPaging = paginate(filteredCorrections, correctionPage, 10);

  const filteredLeaves = useMemo(() => {
    const query = leaveSearch.trim().toLowerCase();
    if (!query) return leaves;
    return leaves.filter(
      (row) =>
        row.userData.name.toLowerCase().includes(query) ||
        (row.leaveType || "").toLowerCase().includes(query) ||
        (row.reason || "").toLowerCase().includes(query),
    );
  }, [leaves, leaveSearch]);
  const leavePaging = paginate(filteredLeaves, leavePage, 10);

  const open = (next: Pending) => {
    setPending(next);
    setNote("");
  };

  const submit = async () => {
    if (!pending) return;
    try {
      await decide.mutateAsync({ ...pending, note });
      toast.success(
        pending.decision === "approve" ? "Pengajuan disetujui." : "Pengajuan ditolak.",
      );
      setPending(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Persetujuan"
        description="Tinjau koreksi jam dan permintaan cuti dari karyawan. Keputusan dikirim sebagai notifikasi ke karyawan dan atasan."
      />

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Koreksi jam</h2>
        <DataTableCard
          toolbar={
            <>
              <p className="text-[11.5px] font-semibold text-[#6B7280]">
                {filteredCorrections.length} pengajuan
              </p>
              <DataTableSearch
                value={correctionSearch}
                onChange={(value) => {
                  setCorrectionSearch(value);
                  setCorrectionPage(1);
                }}
                placeholder="Cari nama atau alasan"
                label="Cari pengajuan koreksi jam"
              />
            </>
          }
        >
          <Table>
            <TableHeader>
              <DataTableHeadRow>
                <DataTableHeadCell>Karyawan</DataTableHeadCell>
                <DataTableHeadCell>Tanggal</DataTableHeadCell>
                <DataTableHeadCell>Diminta</DataTableHeadCell>
                <DataTableHeadCell>Alasan</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Aksi</DataTableHeadCell>
              </DataTableHeadRow>
            </TableHeader>
            <TableBody>
              {correctionPaging.visible.map((row) => (
                <DataTableRow key={row.id}>
                  <TableCell className="font-medium">{row.userData.name}</TableCell>
                  <TableCell>{fmtDate(row.workDate)}</TableCell>
                  <TableCell>
                    {fmtTime(row.requestedCheckInAt)} –{" "}
                    {fmtTime(row.requestedCheckOutAt)}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{row.reason}</TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() =>
                            open({
                              type: "correction",
                              id: row.id,
                              label: `Koreksi ${row.userData.name}`,
                              decision: "approve",
                            })
                          }
                        >
                          <Check className="size-4" aria-hidden />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            open({
                              type: "correction",
                              id: row.id,
                              label: `Koreksi ${row.userData.name}`,
                              decision: "reject",
                            })
                          }
                        >
                          <X className="size-4" aria-hidden />
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-muted-foreground max-w-[160px] truncate text-right text-xs">
                          {row.responseNote || "—"}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setHistory({
                              title: `Koreksi ${row.userData.name} · ${fmtDate(row.workDate)}`,
                              submittedAt: row.createdAt,
                              status: row.status,
                              reviewer: row.reviewer?.name,
                              reviewedAt: row.reviewedAt,
                              note: row.responseNote,
                            })
                          }
                        >
                          <History className="size-4" aria-hidden />
                          Riwayat
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </DataTableRow>
              ))}
              {correctionPaging.visible.length === 0 && (
                <DataTableEmpty colSpan={6}>
                  {corrections.length === 0
                    ? "Belum ada pengajuan koreksi."
                    : "Tidak ada pengajuan yang cocok dengan pencarian."}
                </DataTableEmpty>
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            from={
              filteredCorrections.length === 0
                ? 0
                : (correctionPaging.current - 1) * 10 + 1
            }
            to={Math.min(correctionPaging.current * 10, filteredCorrections.length)}
            total={filteredCorrections.length}
            page={correctionPaging.current}
            pageCount={correctionPaging.pageCount}
            onPageChange={setCorrectionPage}
            noun="pengajuan"
          />
        </DataTableCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Cuti & izin</h2>
        <DataTableCard
          toolbar={
            <>
              <p className="text-[11.5px] font-semibold text-[#6B7280]">
                {filteredLeaves.length} pengajuan
              </p>
              <DataTableSearch
                value={leaveSearch}
                onChange={(value) => {
                  setLeaveSearch(value);
                  setLeavePage(1);
                }}
                placeholder="Cari nama, jenis, atau alasan"
                label="Cari pengajuan cuti dan izin"
              />
            </>
          }
        >
          <Table>
            <TableHeader>
              <DataTableHeadRow>
                <DataTableHeadCell>Karyawan</DataTableHeadCell>
                <DataTableHeadCell>Jenis</DataTableHeadCell>
                <DataTableHeadCell>Tanggal</DataTableHeadCell>
                <DataTableHeadCell>Alasan</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Aksi</DataTableHeadCell>
              </DataTableHeadRow>
            </TableHeader>
            <TableBody>
              {leavePaging.visible.map((row) => (
                <DataTableRow key={row.id}>
                  <TableCell className="font-medium">{row.userData.name}</TableCell>
                  <TableCell>{row.leaveType}</TableCell>
                  <TableCell>
                    {fmtDate(row.startDate)} – {fmtDate(row.endDate)}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{row.reason}</TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() =>
                            open({
                              type: "leave",
                              id: row.id,
                              label: `${row.leaveType} ${row.userData.name}`,
                              decision: "approve",
                            })
                          }
                        >
                          <Check className="size-4" aria-hidden />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            open({
                              type: "leave",
                              id: row.id,
                              label: `${row.leaveType} ${row.userData.name}`,
                              decision: "reject",
                            })
                          }
                        >
                          <X className="size-4" aria-hidden />
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-muted-foreground max-w-[160px] truncate text-right text-xs">
                          {row.responseNote || "—"}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setHistory({
                              title: `${row.leaveType} · ${row.userData.name}`,
                              submittedAt: row.createdAt,
                              status: row.status,
                              reviewer: row.reviewer?.name,
                              reviewedAt: row.reviewedAt,
                              note: row.responseNote,
                            })
                          }
                        >
                          <History className="size-4" aria-hidden />
                          Riwayat
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </DataTableRow>
              ))}
              {leavePaging.visible.length === 0 && (
                <DataTableEmpty colSpan={6}>
                  {leaves.length === 0
                    ? "Belum ada pengajuan cuti."
                    : "Tidak ada pengajuan yang cocok dengan pencarian."}
                </DataTableEmpty>
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            from={
              filteredLeaves.length === 0
                ? 0
                : (leavePaging.current - 1) * 10 + 1
            }
            to={Math.min(leavePaging.current * 10, filteredLeaves.length)}
            total={filteredLeaves.length}
            page={leavePaging.current}
            pageCount={leavePaging.pageCount}
            onPageChange={setLeavePage}
            noun="pengajuan"
          />
        </DataTableCard>
      </section>

      <Dialog open={Boolean(pending)} onOpenChange={(openState) => !openState && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pending?.decision === "approve" ? "Setujui" : "Tolak"} pengajuan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">{pending?.label}</p>
          <div className="space-y-2">
            <Label htmlFor="review-note">Catatan (opsional)</Label>
            <Textarea
              id="review-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tambahkan alasan atau catatan untuk karyawan."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={decide.isPending}>
              {decide.isPending ? "Menyimpan..." : "Simpan keputusan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline persetujuan (PRD §7.9): diajukan → diputuskan. */}
      <Dialog
        open={Boolean(history)}
        onOpenChange={(openState) => !openState && setHistory(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{history?.title}</DialogTitle>
          </DialogHeader>
          {history && (
            <ol className="space-y-3">
              <li className="border-border relative border-l pl-4">
                <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-[#2F80ED]" />
                <p className="text-[12px] font-bold">Diajukan karyawan</p>
                <p className="text-muted-foreground text-[11px]">
                  {fmtDate(history.submittedAt)} · {fmtTime(history.submittedAt)}
                </p>
              </li>
              <li className="border-border relative border-l pl-4">
                <span
                  className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ${
                    history.status === "pending"
                      ? "bg-[#D97706]"
                      : history.status === "approved"
                        ? "bg-[#16A34A]"
                        : "bg-[#DC2626]"
                  }`}
                />
                <p className="text-[12px] font-bold">
                  {history.status === "pending"
                    ? "Menunggu keputusan"
                    : history.status === "approved"
                      ? "Disetujui"
                      : "Ditolak"}
                  {history.reviewer ? ` oleh ${history.reviewer}` : ""}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {history.reviewedAt
                    ? `${fmtDate(history.reviewedAt)} · ${fmtTime(history.reviewedAt)}`
                    : "Belum diputuskan"}
                </p>
                {history.note && (
                  <p className="mt-1 rounded-md bg-secondary px-2 py-1.5 text-[11px]">
                    {history.note}
                  </p>
                )}
              </li>
            </ol>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistory(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
