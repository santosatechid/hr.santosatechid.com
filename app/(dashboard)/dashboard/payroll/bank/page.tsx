"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  MoreHorizontal,
  Pencil,
  Users,
} from "lucide-react";

import {
  useGetPayrollBank,
  useUpdatePayrollBank,
  type PayrollBankRow,
} from "@/hooks/payroll/usePayrollBank";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/shadcn/utils";

const PAGE_SIZE = 10;

const isComplete = (row: PayrollBankRow) =>
  Boolean(row.bankName && row.bankAccount && row.bankAccountHolder);

type BankDraft = {
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
};

// ─── Dialog ubah rekening ─────────────────────────────────────────────────────
function BankDialog({
  onClose,
  row,
  onSuccess,
}: {
  onClose: () => void;
  row: PayrollBankRow;
  onSuccess: () => void;
}) {
  const updateBank = useUpdatePayrollBank();
  const [draft, setDraft] = useState<BankDraft>(() => ({
    bankName: row.bankName ?? "",
    bankAccount: row.bankAccount ?? "",
    bankAccountHolder: row.bankAccountHolder ?? "",
  }));

  const filled = Object.values(draft).every((value) => value.trim() !== "");

  const handleSave = async () => {
    try {
      await updateBank.mutateAsync([{ id: row.id, ...draft }]);
      toast.success(`Rekening ${row.name} berhasil disimpan.`);
      onClose();
      onSuccess();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah rekening</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-[11.5px] font-semibold">
          {row.name}
          {row.employeeId ? ` · ${row.employeeId}` : ""}
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank</Label>
            <Input
              id="bankName"
              value={draft.bankName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  bankName: event.target.value,
                }))
              }
              placeholder="BCA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccount">No. rekening</Label>
            <Input
              id="bankAccount"
              value={draft.bankAccount}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  bankAccount: event.target.value,
                }))
              }
              placeholder="1234567890"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountHolder">Nama pemilik rekening</Label>
            <Input
              id="bankAccountHolder"
              value={draft.bankAccountHolder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  bankAccountHolder: event.target.value,
                }))
              }
              placeholder="Nama sesuai buku tabungan"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!filled || updateBank.isPending}
          >
            {updateBank.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Halaman ──────────────────────────────────────────────────────────────────
const EMPTY_ROWS: PayrollBankRow[] = [];

export default function PayrollBankPage() {
  const { data, isLoading, error, refetch } = useGetPayrollBank();
  const rows = data ?? EMPTY_ROWS;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PayrollBankRow | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        (row.employeeId || "").toLowerCase().includes(query) ||
        (row.bankName || "").toLowerCase().includes(query) ||
        (row.bankAccount || "").includes(query),
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const complete = rows.filter(isComplete).length;
    return {
      all: rows.length,
      complete,
      incomplete: rows.length - complete,
      inactive: rows.filter((row) => !row.isActive).length,
    };
  }, [rows]);

  const { pageCount, current, visible } = paginate(filtered, page, PAGE_SIZE);

  if (isLoading) return <Loading />;

  const stats = [
    {
      label: "Total karyawan",
      value: counts.all,
      icon: Users,
      tile: "bg-[#E7EDF7]",
      ink: "text-[#5B6B85]",
    },
    {
      label: "Rekening lengkap",
      value: counts.complete,
      icon: CheckCircle2,
      tile: "bg-[#E7F7EE]",
      ink: "text-[#12A150]",
    },
    {
      label: "Belum lengkap",
      value: counts.incomplete,
      icon: AlertCircle,
      tile: "bg-[#FFF4D6]",
      ink: "text-[#8A6300]",
    },
    {
      label: "Karyawan nonaktif",
      value: counts.inactive,
      icon: Landmark,
      tile: "bg-[#EAF2FE]",
      ink: "text-[#1F6BD8]",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        emphasis
        title="Rekening gaji"
        description={`${counts.all} karyawan. Lengkapi bank, nomor rekening, dan nama pemiliknya.`}
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tile, ink }) => (
          <div
            key={label}
            className="ring-hr-line flex items-center gap-3 rounded-[13px] bg-white p-[14px_16px] ring-1"
          >
            <span
              className={cn(
                "flex size-[34px] shrink-0 items-center justify-center rounded-[10px]",
                tile,
              )}
            >
              <Icon className={cn("size-4", ink)} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[11.5px] font-semibold">
                {label}
              </p>
              <p className="text-[19px] leading-none font-extrabold tracking-[-0.5px] tabular-nums">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <DataTableCard
        toolbar={
          <>
            <p className="text-[11.5px] font-semibold">
              Daftar rekening
              <span className="text-muted-foreground">
                {" "}
                · {filtered.length} karyawan
              </span>
            </p>

            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Cari nama, NIK, bank, rekening"
              label="Cari rekening karyawan"
            />
          </>
        }
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <DataTableHeadRow>
                <DataTableHeadCell>Karyawan</DataTableHeadCell>
                <DataTableHeadCell className="w-[160px]">
                  Bank
                </DataTableHeadCell>
                <DataTableHeadCell className="w-[190px]">
                  No. rekening
                </DataTableHeadCell>
                <DataTableHeadCell className="w-[210px]">
                  Nama pemilik
                </DataTableHeadCell>
                <DataTableHeadCell className="w-[130px]">
                  Status
                </DataTableHeadCell>
                <DataTableHeadCell className="w-[52px]" />
              </DataTableHeadRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <DataTableRow key={row.id}>
                  <TableCell className="h-[60px] pl-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#EAF2FE] text-[10.5px] font-extrabold text-[#1F6BD8]">
                        {row.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold">
                          {row.name}
                        </p>
                        <p className="text-muted-foreground truncate text-[10.5px] font-medium">
                          {row.employeeId || "Belum ada NIK"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="w-[160px] text-[12.5px] font-semibold">
                    {row.bankName || "—"}
                  </TableCell>

                  <TableCell className="w-[190px] font-mono text-[12px] font-medium tabular-nums">
                    {row.bankAccount || "—"}
                  </TableCell>

                  <TableCell className="w-[210px] text-[12px] font-medium text-[#6B7280]">
                    <span className="block truncate">
                      {row.bankAccountHolder || "—"}
                    </span>
                  </TableCell>

                  <TableCell className="w-[130px]">
                    <span
                      className={cn(
                        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[10px] font-extrabold",
                        isComplete(row)
                          ? "bg-[#E7F7EE] text-[#12A150]"
                          : "bg-[#FFF4D6] text-[#8A6300]",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-[5px] rounded-full",
                          isComplete(row) ? "bg-[#12A150]" : "bg-[#D9A400]",
                        )}
                      />
                      {isComplete(row) ? "Lengkap" : "Belum lengkap"}
                    </span>
                    {row.isActive ? null : (
                      <p className="text-muted-foreground mt-1 text-[10px] font-semibold">
                        Karyawan nonaktif
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="w-[52px] pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground size-6"
                          aria-label={`Aksi rekening ${row.name}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelected(row)}>
                          <Pencil className="size-3.5" aria-hidden />
                          Ubah rekening
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </DataTableRow>
              ))}

              {visible.length === 0 && (
                <DataTableEmpty colSpan={6}>
                  {rows.length === 0
                    ? "Belum ada karyawan untuk diisi rekeningnya."
                    : "Tidak ada karyawan yang cocok dengan pencarian."}
                </DataTableEmpty>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTableFooter
          from={filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
          to={Math.min(current * PAGE_SIZE, filtered.length)}
          total={filtered.length}
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          noun="karyawan"
        />
      </DataTableCard>

      {selected && (
        <BankDialog
          key={selected.id}
          row={selected}
          onClose={() => setSelected(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
