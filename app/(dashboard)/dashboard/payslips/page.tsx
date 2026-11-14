"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";

import {
  useGetMyPayslips,
  type MyPayslip,
} from "@/hooks/payroll/usePayrollRun";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
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
import { PageHeader } from "@/components/layout/pageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

const money = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const periodLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

function PayslipDetail({ slip }: { slip: MyPayslip }) {
  const bpjs = Number(slip.jkn) + Number(slip.jht) + Number(slip.jp);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">Periode</p>
          <p className="font-semibold">{periodLabel(slip.period)}</p>
        </div>
        <Badge variant="success">Final</Badge>
      </div>
      <div className="border-border divide-border divide-y rounded-xl border">
        <Row label="Gaji bruto" value={money(slip.gross)} />
        {Number(slip.taxAllowance) > 0 && (
          <Row label="Tunjangan pajak" value={money(slip.taxAllowance)} />
        )}
        <Row label="PPh 21" value={`- ${money(slip.pph21)}`} />
        <Row label="BPJS Kesehatan (1%)" value={`- ${money(slip.jkn)}`} />
        <Row label="JHT (2%)" value={`- ${money(slip.jht)}`} />
        <Row label="Jaminan Pensiun (1%)" value={`- ${money(slip.jp)}`} />
        {slip.breakdown?.daysWorked ? (
          <Row label="Hari hadir" value={String(slip.breakdown.daysWorked)} />
        ) : null}
        <Row
          label="Total potongan"
          value={`- ${money(Number(slip.pph21) + bpjs)}`}
        />
        <Row label="Gaji bersih" value={money(slip.netPay)} strong />
      </div>
      <p className="text-muted-foreground text-xs">
        Slip ini snapshot final. Perubahan profil setelah publikasi tidak
        mengubah angka di sini.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}

export default function PayslipsPage() {
  const { data: slips = [], isLoading, error } = useGetMyPayslips();
  const [selected, setSelected] = useState<MyPayslip | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return slips;
    return slips.filter((slip) =>
      periodLabel(slip.period).toLowerCase().includes(query),
    );
  }, [slips, search]);

  const { pageCount, current, visible } = paginate(filtered, page, 10);
  const from = filtered.length === 0 ? 0 : (current - 1) * 10 + 1;
  const to = Math.min(current * 10, filtered.length);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Slip gaji"
        description="Slip final yang sudah dipublikasikan admin."
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
              {filtered.length} slip
            </p>
            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Cari periode"
              label="Cari slip gaji"
            />
          </>
        }
      >
        <Table>
          <TableHeader>
            <DataTableHeadRow>
              <DataTableHeadCell>Periode</DataTableHeadCell>
              <DataTableHeadCell>Bruto</DataTableHeadCell>
              <DataTableHeadCell>Potongan</DataTableHeadCell>
              <DataTableHeadCell>Bersih</DataTableHeadCell>
              <DataTableHeadCell className="text-right">Aksi</DataTableHeadCell>
            </DataTableHeadRow>
          </TableHeader>
          <TableBody>
            {visible.map((slip) => (
              <DataTableRow key={slip.id}>
                <TableCell className="font-medium">
                  {periodLabel(slip.period)}
                </TableCell>
                <TableCell>{money(slip.gross)}</TableCell>
                <TableCell>
                  {money(
                    Number(slip.pph21) +
                      Number(slip.jkn) +
                      Number(slip.jht) +
                      Number(slip.jp),
                  )}
                </TableCell>
                <TableCell className="font-semibold">
                  {money(slip.netPay)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(slip)}
                  >
                    Lihat slip
                  </Button>
                </TableCell>
              </DataTableRow>
            ))}
            {visible.length === 0 && (
              <DataTableEmpty colSpan={5}>
                {slips.length === 0
                  ? "Belum ada slip yang dipublikasikan."
                  : "Tidak ada slip yang cocok dengan pencarian."}
              </DataTableEmpty>
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          from={from}
          to={to}
          total={filtered.length}
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          noun="slip"
        />
      </DataTableCard>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Slip gaji</DialogTitle>
          </DialogHeader>
          {selected && <PayslipDetail slip={selected} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Tutup
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" /> Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
