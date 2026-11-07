"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const { data: users = [], isLoading, refetch, error } = useGetUsers();
  const { data: roles = [] } = useGetRoles();
  const { data: branches = [] } = useGetBranchs();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserData | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.roleId === roleFilter;
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.employeeId || "").toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const openEdit = (user: UserDataTypes) => {
    setSelected(user);
    setEditOpen(true);
  };

  const openDelete = (user: UserDataTypes) => {
    setSelected(user);
    setDeleteOpen(true);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-8xl space-y-4">
      <PageHeader
        title="Users"
        description="Data karyawan, akun login, dan payroll."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Tambah user
          </Button>
        }
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau email..."
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua role</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => {
              const branch = branches.find((item) => item.id === user.branchId);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.employeeId || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.userId ? "success" : "secondary"}>
                      {user.userId ? "Terdaftar" : "Belum"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.role?.name || "—"}</TableCell>
                  <TableCell>{branch?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "secondary"}>
                      {user.isActive ? "Aktif" : "Tidak aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(user)}
                        aria-label={`Hapus ${user.name}`}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  Tidak ada user yang cocok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
