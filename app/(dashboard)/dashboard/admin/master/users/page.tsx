"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

import { useGetBranchs } from "@/hooks/branches/useBranches";
import { useGetRoles } from "@/hooks/roles/useRoles";
import { useGetUsers } from "@/hooks/users/useUsers";
import { getErrorMessage, type UserDataTypes } from "@/types";
import {
  DeleteUserDialog,
  type UserData,
  UserFormDialog,
} from "@/components/users/userDialogs";
import Loading from "@/components/common/loading";
import { PageHeader } from "@/components/layout/pageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/shadcn/utils";

const PAGE_SIZE = 10;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const dateOf = (value?: Date | string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

type TabKey = "all" | "active" | "inactive";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const { data: users = [], isLoading, refetch, error } = useGetUsers();
  const { data: roles = [] } = useGetRoles();
  const { data: branches = [] } = useGetBranchs();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserData | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
      const matchesTab =
        tab === "all" ||
        (tab === "active" ? user.isActive : !user.isActive);
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.employeeId || "").toLowerCase().includes(query) ||
        (user.position || "").toLowerCase().includes(query);
      return matchesRole && matchesTab && matchesSearch;
    });
  }, [users, search, roleFilter, tab]);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((user) => user.isActive).length,
      inactive: users.filter((user) => !user.isActive).length,
      noAccount: users.filter((user) => !user.userId).length,
    }),
    [users],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openEdit = (user: UserDataTypes) => {
    setSelected(user);
    setEditOpen(true);
  };

  const openDelete = (user: UserDataTypes) => {
    setSelected(user);
    setDeleteOpen(true);
  };

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
      label: "Aktif",
      value: counts.active,
      icon: UserCheck,
      tile: "bg-[#E7F7EE]",
      ink: "text-[#12A150]",
    },
    {
      label: "Nonaktif",
      value: counts.inactive,
      icon: UserX,
      tile: "bg-[#FFF4D6]",
      ink: "text-[#8A6300]",
    },
    {
      label: "Belum punya akun",
      value: counts.noAccount,
      icon: KeyRound,
      tile: "bg-[#EAF2FE]",
      ink: "text-[#1F6BD8]",
    },
  ];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "active", label: "Aktif", count: counts.active },
    { key: "inactive", label: "Nonaktif", count: counts.inactive },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        emphasis
        title="Data karyawan"
        description={`${counts.all} orang. Cari, tambah, atau ubah data di satu tempat.`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Tambah karyawan
          </Button>
        }
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

      <div className="ring-hr-line overflow-hidden rounded-[14px] bg-white ring-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EAEE] px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                aria-pressed={tab === key}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={cn(
                  "flex h-[30px] items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-semibold transition-colors",
                  tab === key
                    ? "bg-[#EAF2FE] font-extrabold text-[#1F6BD8] ring-1 ring-[#EAF2FE]"
                    : "ring-hr-line text-muted-foreground bg-white ring-1",
                )}
              >
                {label}
                <span
                  className={cn(
                    "text-[10px] font-extrabold tracking-[0.3px] tabular-nums",
                    tab === key ? "text-[#2F80ED]" : "text-[#AEB5C0]",
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="bg-hr-panel flex h-8 w-[190px] items-center gap-[7px] rounded-lg px-2.5">
              <Search className="size-3.5 shrink-0 text-[#9AA2AE]" aria-hidden />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama, NIK, jabatan"
                aria-label="Cari karyawan"
                className="text-foreground placeholder:text-[#9AA2AE] min-w-0 flex-1 bg-transparent text-[11.5px] font-semibold outline-none"
              />
            </label>

            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="ring-hr-line h-8 w-auto gap-1.5 rounded-lg bg-white px-2.5 text-[11.5px] font-bold ring-1">
                <SlidersHorizontal className="size-3.5" aria-hidden />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua peran</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-b border-[#E8EAEE] bg-[#FCFCFD] hover:bg-[#FCFCFD]">
                <TableHead className="h-[38px] pl-4 text-[10px] text-[#9AA2AE]">
                  Karyawan
                </TableHead>
                <TableHead className="h-[38px] w-[210px] text-[10px] text-[#9AA2AE]">
                  Jabatan
                </TableHead>
                <TableHead className="h-[38px] w-[140px] text-[10px] text-[#9AA2AE]">
                  Departemen
                </TableHead>
                <TableHead className="h-[38px] w-[120px] text-[10px] text-[#9AA2AE]">
                  Status
                </TableHead>
                <TableHead className="h-[38px] w-[110px] text-[10px] text-[#9AA2AE]">
                  Bergabung
                </TableHead>
                <TableHead className="h-[38px] w-[52px] pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((user) => {
                const branch = branches.find(
                  (item) => item.id === user.branchId,
                );
                return (
                  <TableRow
                    key={user.id}
                    className="border-b border-[#EEF0F5] hover:bg-[#FCFCFD]"
                  >
                    <TableCell className="h-[60px] pl-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#EAF2FE] text-[10.5px] font-extrabold text-[#1F6BD8]">
                          {initialsOf(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold">
                            {user.name}
                          </p>
                          <p className="text-muted-foreground truncate text-[10.5px] font-medium">
                            {user.email || "Belum ada email"}
                            {user.employeeId ? ` · ${user.employeeId}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="w-[210px]">
                      <p className="truncate text-[12.5px] font-semibold">
                        {user.position || "—"}
                      </p>
                      <p className="text-muted-foreground truncate text-[10.5px] font-medium">
                        {user.role?.name || "Tanpa peran"}
                        {branch ? ` · ${branch.name}` : ""}
                      </p>
                    </TableCell>

                    <TableCell className="w-[140px] text-[12px] font-medium text-[#6B7280]">
                      <span className="block truncate">
                        {user.division?.name || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="w-[120px]">
                      <span
                        className={cn(
                          "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[10px] font-extrabold",
                          user.isActive
                            ? "bg-[#E7F7EE] text-[#12A150]"
                            : "bg-[#F8F9FB] text-[#6B7280]",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-[5px] rounded-full",
                            user.isActive ? "bg-[#12A150]" : "bg-[#AEB5C0]",
                          )}
                        />
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>

                    <TableCell className="w-[110px] text-[12px] font-medium text-[#6B7280]">
                      {dateOf(user.startDate)}
                    </TableCell>

                    <TableCell className="w-[52px] pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-6"
                            aria-label={`Aksi untuk ${user.name}`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="size-3.5" aria-hidden />
                            Ubah data
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => openDelete(user)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-10 text-center text-[12px]"
                  >
                    {users.length === 0
                      ? "Belum ada karyawan. Mulai dari tombol Tambah karyawan di kanan atas."
                      : "Tidak ada karyawan yang cocok dengan pencarian atau filter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EAEE] px-4 py-2.5">
          <p className="text-muted-foreground text-[11.5px] font-semibold">
            Menampilkan{" "}
            {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} dari{" "}
            {filtered.length} karyawan
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-[7px]"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
            </Button>
            <span className="bg-hr-panel flex h-7 items-center rounded-[7px] px-2.5 text-[11px] font-bold">
              Halaman {currentPage} dari {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-[7px]"
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={currentPage === pageCount}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />
      <UserFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editData={selected}
        onSuccess={refetch}
      />
      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userData={selected}
        onSuccess={refetch}
      />
    </div>
  );
}
