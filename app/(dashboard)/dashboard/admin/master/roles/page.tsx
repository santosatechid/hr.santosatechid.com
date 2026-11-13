"use client";
import { useState, useEffect, useMemo } from "react";

import {
  useCreateRole,
  useDeleteRole,
  useGetRoles,
  useUpdateRole,
} from "@/hooks/roles/useRoles";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { type RoleDataTypes, type RolesInputData } from "@/types";
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
} from "@/components/layout/dataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alertDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/services/auth/authClients";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/toast";
import * as z from "zod";

// Import hooks (Anda perlu membuat hooks ini sesuai dengan API backend)
// Type definitions
type RoleData = RoleDataTypes;

// Form schema
const roleSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Isi nama role dulu, ya.")
    .max(50, "Nama role maksimal 50 karakter, ya."),
  description: z.string().optional(),
  isActive: z.boolean(),
  permissions: z.array(z.string()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const PAGE_SIZE = 10;

// Available permissions (sesuaikan dengan sistem Anda)
const availablePermissions = [
  { id: "/", label: "Beranda" },
  { id: "/dashboard", label: "Dashboard admin" },
  { id: "/dashboard/profile", label: "Profil" },
  { id: "/dashboard/attendance", label: "Absensi" },
  { id: "/dashboard/attendance/logs", label: "Log absensi" },
  { id: "/dashboard/requests", label: "Pengajuan" },
  { id: "/dashboard/payslips", label: "Slip gaji" },
  { id: "/dashboard/admin/master/users", label: "Kelola pengguna" },
  { id: "/dashboard/admin/master/roles", label: "Kelola akses" },
  { id: "/dashboard/admin/master/branches", label: "Kelola cabang" },
  { id: "/dashboard/admin/master/divisions", label: "Kelola divisi" },
  { id: "/dashboard/admin/requests", label: "Review pengajuan" },
  { id: "/dashboard/payroll/bank", label: "Rekening gaji" },
  { id: "/dashboard/payroll/runs", label: "Hitung payroll" },
  { id: "/dashboard/admin/utility/whatsapp", label: "WhatsApp" },
];

// Create/Edit Dialog Component
function RoleFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
  clientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: RoleDataTypes | null;
  onSuccess: () => void;
  clientId?: string;
}) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      isActive: true,
      permissions: [],
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (editData) {
      setValue("name", editData.name);
      setValue("description", editData.description || "");
      setValue("isActive", editData.isActive);
      setValue("permissions", editData.permissions || []);
      setSelectedPermissions(editData.permissions || []);
    } else {
      reset({
        isActive: true,
        permissions: [],
      });
      setSelectedPermissions([]);
    }
  }, [editData, setValue, reset]);

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((p) => p !== permissionId)
      : [...selectedPermissions, permissionId];

    setSelectedPermissions(newPermissions);
    setValue("permissions", newPermissions);
  };

  const onSubmit = async (data: RoleFormValues) => {
    const submitData = {
      ...data,
      permissions: selectedPermissions,
    };

    if (editData) {
      await updateRole.mutateAsync({
        id: editData.id,
        name: submitData.name,
        description: submitData.description,
        isActive: submitData.isActive,
        permissions: submitData.permissions,
      });
      toast.success("Role berhasil diperbarui!");
    } else {
      const now = new Date().toISOString();
      const createData: RolesInputData = {
        ...submitData,
        clientId,
        createdAt: now,
        updatedAt: now,
      };
      await createRole.mutateAsync(createData);
      toast.success("Role berhasil dibuat!");
    }
    reset();
    setSelectedPermissions([]);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit role" : "Bikin role baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama role</Label>
            <Input
              id="name"
              placeholder="Contoh: Admin, User, Manager"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Ceritain singkat soal role ini..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", !!checked)}
            />
            <Label htmlFor="isActive">Role aktif</Label>
          </div>

          <div className="space-y-3">
            <Label>Hak akses</Label>
            <p className="text-muted-foreground text-xs">
              Role non-admin hanya dapat membuka profil, absensi, log, dan pengajuan.
            </p>
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border p-3">
              {availablePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() =>
                      handlePermissionToggle(permission.id)
                    }
                  />
                  <Label htmlFor={permission.id} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createRole.isPending || updateRole.isPending}
            >
              {createRole.isPending || updateRole.isPending
                ? "Menyimpan..."
                : editData
                  ? "Perbarui"
                  : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteRoleDialog({
  open,
  onOpenChange,
  roleData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleData: RoleData | null;
  onSuccess: () => void;
}) {
  const deleteRole = useDeleteRole();

  const handleDelete = async () => {
    if (!roleData) return;
    await deleteRole.mutateAsync(roleData.id);
    toast.success("Role berhasil dihapus!");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus role?</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin mau hapus role <strong>{roleData?.name}</strong>?
            {roleData?._count?.userData && roleData._count.userData > 0 && (
              <span className="text-warning mt-2 block">
                Role ini masih dipakai {roleData._count.userData} pengguna.
              </span>
            )}
            Aksi ini nggak bisa dibatalin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRole.isPending}
            className="bg-destructive-solid hover:bg-destructive-solid/90"
          >
            {deleteRole.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main DataTable Component
function RoleDataTable({ clientId }: { clientId?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

  const { data: roles = [], isLoading, refetch } = useGetRoles();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        (role.description || "").toLowerCase().includes(query),
    );
  }, [roles, search]);

  const handleSuccess = () => {
    refetch();
  };

  const columns: ColumnDef<RoleData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 gap-1.5 px-2 text-[10px] font-extrabold tracking-[0.8px] uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Shield className="size-3" />
            Nama Role
            <ArrowUpDown className="size-3" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-xs truncate" title={description}>
            {description || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "permissions",
      header: "Hak akses",
      cell: ({ row }) => {
        const permissions = (row.getValue("permissions") as string[]) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.length > 0 ? (
              permissions.slice(0, 3).map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {availablePermissions.find((p) => p.id === permission)
                    ?.label || permission}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">Tidak ada</span>
            )}
            {permissions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{permissions.length - 3} lainnya
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 gap-1.5 px-2 text-[10px] font-extrabold tracking-[0.8px] uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Users className="size-3" />
            Pengguna
            <ArrowUpDown className="size-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const userCount = row.original._count?.userData || 0;
        return (
          <div className="text-center">
            <Badge variant="secondary" className="font-medium">
              {userCount} pengguna
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const roleData = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(roleData.id)}
              >
                Salin ID role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(roleData);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRole(roleData);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize: PAGE_SIZE })
          : updater;
      setPage(next.pageIndex + 1);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: PAGE_SIZE },
    },
  });

  const pageCount = Math.max(1, table.getPageCount());
  const current = Math.min(page, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="">
        <PageHeader
          title="Akses"
          description="Atur role dan menu yang bisa diakses tiap pengguna."
        />
        <DataTableCard
          toolbar={
            <>
              <p className="text-[11.5px] font-semibold text-[#6B7280]">
                {filtered.length} peran
              </p>
              <div className="flex items-center gap-2">
                <DataTableSearch
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder="Cari nama atau deskripsi"
                  label="Cari role"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Kolom <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah role
                </Button>
              </div>
            </>
          }
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <DataTableHeadRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <DataTableHeadCell key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </DataTableHeadCell>
                    );
                  })}
                </DataTableHeadRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </DataTableRow>
                ))
              ) : (
                <DataTableEmpty colSpan={columns.length}>
                  {roles.length === 0
                    ? "Belum ada role. Tambah role pertama lewat tombol di atas."
                    : "Tidak ada role yang cocok dengan pencarian."}
                </DataTableEmpty>
              )}
            </TableBody>
          </Table>
          <DataTableFooter
            from={filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
            to={Math.min(current * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            page={current}
            pageCount={pageCount}
            onPageChange={setPage}
            noun="peran"
          />
        </DataTableCard>

        {/* Dialogs */}
        <RoleFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleSuccess}
          clientId={clientId}
        />

        <RoleFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editData={selectedRole}
          onSuccess={handleSuccess}
          clientId={clientId}
        />

        <DeleteRoleDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          roleData={selectedRole}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

export default function UserDataTable() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;

  const { data: userData, isLoading: isLoadingUserData } =
    useGetUserByIdBetterAuth(userId as string);
  const clientId = userData?.clientId;

  // Show loading while checking authorization
  if (isPending || isLoadingUserData) {
    return <Loading />;
  }

  // // Only Admins and Client can manage roles
  // if (userRole !== "Admin" && userRole !== "Client") {
  //   unauthorized();
  //   return null;
  // }

  // Render dashboard only after authorization is confirmed
  return <RoleDataTable clientId={clientId as string} />;
}
