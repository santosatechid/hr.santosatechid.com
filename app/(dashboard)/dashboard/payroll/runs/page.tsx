"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, Send } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  useBuildPayrollDraft,
  useGetPayrollPeriod,
  usePublishPayroll,
} from "@/hooks/payroll/usePayrollRun";
import { getErrorMessage } from "@/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const currentPeriod = () => {
  const now = new Date();
  const jakarta = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  return `${jakarta.getFullYear()}-${String(jakarta.getMonth() + 1).padStart(2, "0")}`;
};

export default function PayrollRunsPage() {
  const [period, setPeriod] = useState(currentPeriod);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, refetch, isLoading } = useGetPayrollPeriod(period);
  const buildDraft = useBuildPayrollDraft();
  const publish = usePublishPayroll();

  const run = data?.run ?? null;
  const slips = data?.slips ?? [];
  const published = run?.status === "published";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return slips;
    return slips.filter(
      (slip) =>
        slip.userData.name.toLowerCase().includes(query) ||
        (slip.userData.employeeId || "").toLowerCase().includes(query),
    );
  }, [slips, search]);
  const { pageCount, current, visible } = paginate(filtered, page, 10);

  const onBuild = async () => {
    try {
      await buildDraft.mutateAsync(period);
      await refetch();
      toast.success("Draft payroll dihitung. Cek angkanya dulu sebelum publikasi.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onPublish = async () => {
    if (!run) return;
    try {
      await publish.mutateAsync(run.id);
      await refetch();
      toast.success("Payroll dipublikasikan. Karyawan bisa lihat slip.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Payroll"
        description="Hitung gaji bulanan dari data karyawan, lalu publikasikan slip."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="period">Periode</Label>
          <Input
            id="period"
            type="month"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              setPage(1);
            }}
            className="w-44"
          />
        </div>
        <Button onClick={onBuild} disabled={buildDraft.isPending || published}>
          <Calculator className="size-4" />
          {buildDraft.isPending ? "Menghitung..." : "Hitung draft"}
        </Button>
        <Button
          variant={published ? "outline" : "default"}
          onClick={onPublish}
          disabled={!run || published || publish.isPending || slips.length === 0}
        >
          {published ? (
            <>
              <CheckCircle2 className="size-4" /> Sudah dipublikasikan
            </>
          ) : (
            <>
              <Send className="size-4" />
              {publish.isPending ? "Mempublikasikan..." : "Publikasikan"}
            </>
          )}
        </Button>
        {run && (
          <Badge variant={published ? "success" : "warning"}>
            {published ? "Final" : "Draft"}
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Gaji pokok diambil dari profil karyawan. Karyawan bergaji harian dihitung
        dari jumlah absensi masuk di periode ini. Pajak memakai TER PPh 21 dan
        potongan BPJS memakai porsi pekerja. Data wajib yang kosong akan
        menghentikan perhitungan, bukan dianggap nol.
      </p>

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
              placeholder="Cari nama atau NIK"
              label="Cari slip karyawan"
            />
          </>
        }
      >
        <Table>
          <TableHeader>
            <DataTableHeadRow>
              <DataTableHeadCell>Karyawan</DataTableHeadCell>
              <DataTableHeadCell>Bruto</DataTableHeadCell>
              <DataTableHeadCell>PPh 21</DataTableHeadCell>
              <DataTableHeadCell>BPJS</DataTableHeadCell>
              <DataTableHeadCell>Bersih</DataTableHeadCell>
            </DataTableHeadRow>
          </TableHeader>
          <TableBody>
            {visible.map((slip) => (
              <DataTableRow key={slip.id}>
                <TableCell className="px-4">
                  <p className="text-[12.5px] font-bold">
                    {slip.userData.name}
                  </p>
                  <p className="text-muted-foreground text-[10.5px] font-medium">
                    {slip.userData.employeeId || "—"} ·{" "}
                    {slip.breakdown?.branch || "tanpa cabang"}
                  </p>
                </TableCell>
                <TableCell className="px-4 tabular-nums">
                  {money(slip.gross)}
                </TableCell>
                <TableCell className="px-4 tabular-nums">
                  {money(slip.pph21)}
                </TableCell>
                <TableCell className="px-4 tabular-nums">
                  {money(Number(slip.jkn) + Number(slip.jht) + Number(slip.jp))}
                </TableCell>
                <TableCell className="px-4 font-bold tabular-nums">
                  {money(slip.netPay)}
                </TableCell>
              </DataTableRow>
            ))}
            {visible.length === 0 && (
              <DataTableEmpty colSpan={5}>
                {isLoading
                  ? "Memuat..."
                  : slips.length === 0
                    ? "Belum ada draft untuk periode ini. Klik Hitung draft."
                    : "Tidak ada slip yang cocok dengan pencarian."}
              </DataTableEmpty>
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          from={filtered.length === 0 ? 0 : (current - 1) * 10 + 1}
          to={Math.min(current * 10, filtered.length)}
          total={filtered.length}
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          noun="slip"
        />
      </DataTableCard>

      {run && slips.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Total bruto {money(run.totalGross)} · Total bersih {money(run.totalNet)} ·{" "}
          {slips.length} slip
        </p>
      )}
    </div>
  );
}
