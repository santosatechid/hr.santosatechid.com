"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useGetPayrollBank,
  useUpdatePayrollBank,
  type PayrollBankRow,
} from "@/hooks/payroll/usePayrollBank";
import { getErrorMessage } from "@/types";
import Loading from "@/components/common/loading";
import { PageHeader } from "@/components/layout/pageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Draft = {
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
};

const toDraft = (row: PayrollBankRow): Draft => ({
  bankName: row.bankName ?? "",
  bankAccount: row.bankAccount ?? "",
  bankAccountHolder: row.bankAccountHolder ?? "",
});

const EMPTY_DRAFT: Draft = {
  bankName: "",
  bankAccount: "",
  bankAccountHolder: "",
};

const EMPTY_ROWS: PayrollBankRow[] = [];

export default function PayrollBankPage() {
  const { data, isLoading, error } = useGetPayrollBank();
  const rows = data ?? EMPTY_ROWS;
  const updateBank = useUpdatePayrollBank();
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!data) return;
    setDraft(Object.fromEntries(data.map((row) => [row.id, toDraft(row)])));
  }, [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        (row.employeeId || "").toLowerCase().includes(query) ||
        (row.bankAccount || "").includes(query),
    );
  }, [rows, search]);

  const changed = rows.filter((row) => {
    const current = draft[row.id];
    if (!current) return false;
    const original = toDraft(row);
    return (
      current.bankName !== original.bankName ||
      current.bankAccount !== original.bankAccount ||
      current.bankAccountHolder !== original.bankAccountHolder
    );
  });

  const edit = (id: string, patch: Partial<Draft>) =>
    setDraft((current) => ({
      ...current,
      [id]: { ...(current[id] ?? EMPTY_DRAFT), ...patch },
    }));

  const handleSave = async () => {
    if (changed.length === 0) return;
    try {
      await updateBank.mutateAsync(
        changed.map((row) => ({ id: row.id, ...draft[row.id] })),
      );
      toast.success(`${changed.length} data rekening tersimpan.`);
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-8xl space-y-4">
      <PageHeader
        title="Bank transfer gaji"
        description="Isi rekening tiap karyawan. Semua perubahan disimpan sekaligus."
        actions={
          <Button
            onClick={handleSave}
            disabled={changed.length === 0 || updateBank.isPending}
          >
            {updateBank.isPending
              ? "Menyimpan..."
              : changed.length > 0
                ? `Simpan (${changed.length})`
                : "Simpan"}
          </Button>
        }
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, employee ID, atau no. rekening..."
          className="max-w-sm"
        />
        <span className="text-muted-foreground text-xs">
          {filtered.length} karyawan
        </span>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Employee ID</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-44">Bank</TableHead>
              <TableHead className="w-44">No. rekening</TableHead>
              <TableHead className="w-56">Atas nama</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const value = draft[row.id] ?? EMPTY_DRAFT;
              const isChanged = changed.some((item) => item.id === row.id);
              const isComplete =
                value.bankName && value.bankAccount && value.bankAccountHolder;
              return (
                <TableRow
                  key={row.id}
                  data-state={isChanged ? "selected" : undefined}
                >
                  <TableCell className="text-muted-foreground">
                    {row.employeeId || "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.name}
                      {row.isActive ? null : (
                        <Badge variant="secondary">Tidak aktif</Badge>
                      )}
                      {isComplete ? null : (
                        <Badge variant="warning">Belum lengkap</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={value.bankName}
                      onChange={(event) =>
                        edit(row.id, { bankName: event.target.value })
                      }
                      placeholder="BCA"
                      aria-label={`Bank ${row.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={value.bankAccount}
                      onChange={(event) =>
                        edit(row.id, { bankAccount: event.target.value })
                      }
                      placeholder="1234567890"
                      inputMode="numeric"
                      aria-label={`No. rekening ${row.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={value.bankAccountHolder}
                      onChange={(event) =>
                        edit(row.id, { bankAccountHolder: event.target.value })
                      }
                      placeholder="Nama pemilik rekening"
                      aria-label={`Atas nama ${row.name}`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  Tidak ada karyawan yang cocok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
