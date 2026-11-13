"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/shadcn/utils";

/**
 * Chrome tabel data yang sama dengan halaman Karyawan: kartu hairline, toolbar
 * pencarian, baris kosong yang jelas, dan footer jumlah + paginasi.
 */
export function DataTableCard({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ring-hr-line overflow-hidden rounded-[14px] bg-white ring-1">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EAEE] px-4 py-3">
          {toolbar}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function DataTableSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="bg-hr-panel flex h-8 w-[200px] shrink-0 items-center gap-[7px] rounded-lg px-2.5">
      <Search className="size-3.5 shrink-0 text-[#9AA2AE]" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="text-foreground placeholder:text-[#9AA2AE] min-w-0 flex-1 bg-transparent text-[11.5px] font-semibold outline-none"
      />
    </label>
  );
}

export function DataTableHeadRow({ children }: { children: ReactNode }) {
  return (
    <TableRow className="border-b border-[#E8EAEE] bg-[#FCFCFD] hover:bg-[#FCFCFD]">
      {children}
    </TableRow>
  );
}

export function DataTableHeadCell({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "h-[38px] px-4 text-[10px] font-extrabold tracking-[0.8px] whitespace-nowrap text-[#9AA2AE] uppercase",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

export function DataTableRow({
  children,
  className,
  "data-state": dataState,
}: {
  children: ReactNode;
  className?: string;
  "data-state"?: string;
}) {
  return (
    <TableRow
      data-state={dataState}
      className={cn("border-b border-[#EEF0F5] hover:bg-[#FCFCFD]", className)}
    >
      {children}
    </TableRow>
  );
}

export function DataTableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-muted-foreground py-10 text-center text-[12px]"
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

export function DataTableFooter({
  from,
  to,
  total,
  page,
  pageCount,
  onPageChange,
  noun,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  noun: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EAEE] px-4 py-2.5">
      <p className="text-muted-foreground text-[11.5px] font-semibold">
        Menampilkan {from}–{to} dari {total} {noun}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-7 rounded-[7px]"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
        </Button>
        <span className="bg-hr-panel flex h-7 items-center rounded-[7px] px-2.5 text-[11px] font-bold">
          Halaman {page} dari {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-7 rounded-[7px]"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** Potong daftar per halaman, sekaligus jaga halaman tetap valid. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    pageCount,
    current,
    visible: items.slice((current - 1) * pageSize, current * pageSize),
  };
}
