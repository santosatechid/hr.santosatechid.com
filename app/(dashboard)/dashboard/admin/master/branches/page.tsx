"use client";
import { useEffect, useMemo, useState } from "react";

import {
  type BranchRecord,
  useCreateBranch,
  useDeleteBranch,
  useGetBranchs,
  useUpdateBranch,
} from "@/hooks/branches/useBranches";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";

const BranchGeofenceMap = dynamic(
  () => import("@/components/branches/BranchGeofenceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="border-border h-64 w-full animate-pulse rounded-xl border" />
    ),
  },
);

import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/toast";
import * as z from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────
export type BranchData = BranchRecord;

// ─── Schema ───────────────────────────────────────────────────────────────────
const branchSchema = z.object({
  name: z
    .string()
    .min(1, "Isi nama cabang dulu, ya.")
    .max(100, "Nama cabang maksimal 100 karakter."),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ─── BranchFormDialog ──────────────────────────────────────────────────────────
function BranchFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: BranchData | null;
  onSuccess: () => void;
}) {
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");
  const [geo, setGeo] = useState<{
    latitude: number | null;
    longitude: number | null;
    radius: string;
    floor: string;
  }>({ latitude: null, longitude: null, radius: "100", floor: "" });

  useEffect(() => {
    setGeo({
      latitude: editData?.latitude ?? null,
      longitude: editData?.longitude ?? null,
      radius: String(editData?.radiusMeters ?? 100),
      floor: editData?.bpjsWageFloor ? String(editData.bpjsWageFloor) : "",
    });
  }, [editData, open]);

  useEffect(() => {
    if (editData) {
      setValue("name", editData.name);
      setValue("description", editData.description || "");
      setValue("address", editData.address || "");
      setValue("phone", editData.phone || "");
      setValue("isActive", editData.isActive);
    } else {
      reset({
        name: "",
        description: "",
        phone: "",
        address: "",
        isActive: true,
      });
    }
  }, [editData, setValue, reset]);

  const onSubmit = async (data: BranchFormValues) => {
    const radiusMeters = Number(geo.radius);
    const hasCoords = geo.latitude !== null && geo.longitude !== null;
    if (!Number.isInteger(radiusMeters) || radiusMeters < 20 || radiusMeters > 5000) {
      toast.error("Radius absensi harus 20 sampai 5000 meter.");
      return;
    }
    if (!hasCoords) {
      toast.error("Tandai lokasi cabang di peta dulu, ya.");
      return;
    }

    const payload = {
      ...data,
      latitude: geo.latitude,
      longitude: geo.longitude,
      radiusMeters,
      bpjsWageFloor: geo.floor === "" ? null : Number(geo.floor),
    };

    try {
      if (editData) {
        await updateBranch.mutateAsync({
          ...payload,
          id: editData.id,
        });
        toast.success("Info cabang berhasil diperbarui!");
      } else {
        await createBranch.mutateAsync(payload);
        toast.success("Cabang baru berhasil dibuat!");
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit cabang" : "Tambah cabang baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Informasi Utama ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex h-10 items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
                <Label
                  htmlFor="isActive"
                  className="cursor-pointer font-normal"
                >
                  {isActive ? "Aktif" : "Nonaktif"}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama cabang <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={`Contoh: SMA IT ${process.env.NEXT_PUBLIC_CLIENT_NAME?.toUpperCase()}`}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Deskripsi{" "}
              <span className="text-muted-foreground text-xs">(opsional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Jelasin singkat soal cabang ini..."
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Alamat{" "}
              <span className="text-muted-foreground text-xs">(opsional)</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Masukin alamat lengkap cabang..."
              rows={2}
              {...register("address")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                No. Telepon{" "}
                <span className="text-muted-foreground text-xs">
                  (opsional)
                </span>
              </Label>
              <Input
                id="phone"
                placeholder="(021) 77833598"
                {...register("phone")}
              />
            </div>

          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Area absensi</Label>
              <span className="text-muted-foreground text-xs">
                Klik peta untuk pindahkan titik cabang.
              </span>
            </div>
            <BranchGeofenceMap
              latitude={geo.latitude}
              longitude={geo.longitude}
              radiusMeters={Number(geo.radius) || 100}
              onChange={({ latitude, longitude }) =>
                setGeo((current) => ({ ...current, latitude, longitude }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="branch-latitude">Latitude</Label>
                <Input
                  id="branch-latitude"
                  value={geo.latitude ?? ""}
                  readOnly
                  placeholder="Klik peta"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-longitude">Longitude</Label>
                <Input
                  id="branch-longitude"
                  value={geo.longitude ?? ""}
                  readOnly
                  placeholder="Klik peta"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-radius">Radius (meter)</Label>
                <Input
                  id="branch-radius"
                  type="number"
                  min={20}
                  max={5000}
                  value={geo.radius}
                  onChange={(event) =>
                    setGeo((current) => ({ ...current, radius: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-bpjs-floor">
                Batas upah BPJS (Rp)
              </Label>
              <Input
                id="branch-bpjs-floor"
                type="number"
                inputMode="numeric"
                min={0}
                value={geo.floor}
                onChange={(event) =>
                  setGeo((current) => ({ ...current, floor: event.target.value }))
                }
                placeholder="Contoh: 5000000"
              />
              <p className="text-muted-foreground text-xs">
                Upah minimum setempat untuk hitung iuran BPJS. Kosongkan kalau
                cabang ini tidak memakai BPJS.
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              Karyawan hanya bisa absen dalam radius ini. Minimal 20 m, maksimal
              5000 m.
            </p>
          </div>

          <Separator />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createBranch.isPending || updateBranch.isPending}
            >
              {createBranch.isPending || updateBranch.isPending
                ? "Menyimpan..."
                : editData
                  ? "Simpan perubahan"
                  : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── BranchDetailDialog ────────────────────────────────────────────────────────
function BranchDetailDialog({
  open,
  onOpenChange,
  branchData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchData: BranchData | null;
}) {
  if (!branchData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail cabang</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                Status
              </p>
              <Badge
                variant={branchData.isActive ? "default" : "secondary"}
                className="mt-1"
              >
                {branchData.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 text-xs">
              Nama cabang
            </p>
            <p className="text-base font-semibold">{branchData.name}</p>
          </div>

          {branchData.description && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                Deskripsi
              </p>
              <p className="text-sm">{branchData.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {branchData.address && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  Alamat
                </p>
                <p className="text-sm">{branchData.address}</p>
              </div>
            )}
            {branchData.phone && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs">
                  Telepon
                </p>
                <p className="text-sm">{branchData.phone}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Statistik */}
          <div>
            <p className="text-muted-foreground mb-3 text-xs">
              Statistik
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  label: "Pengguna",
                  value: branchData._count?.users ?? 0,
                  color: "text-success",
                  bg: "bg-success-surface",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-3xl p-3 text-center ${stat.bg} border`}
                >
                  <div className={`text-2xl font-semibold tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteBranchDialog ────────────────────────────────────────────────────────
function DeleteBranchDialog({
  open,
  onOpenChange,
  branchData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchData: BranchData | null;
  onSuccess: () => void;
}) {
  const deleteBranch = useDeleteBranch();

  const handleDelete = async () => {
    if (!branchData) return;
    try {
      await deleteBranch.mutateAsync(branchData.id);
      toast.success("Cabang berhasil dihapus!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const hasRelatedData = (branchData?._count?.users ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus cabang?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {hasRelatedData ? (
                <div className="space-y-2">
                  <p>
                    Cabang <strong>{branchData?.name}</strong> masih dipakai{" "}
                    {branchData?._count?.users ?? 0} pengguna.
                  </p>
                  <p className="text-destructive text-sm font-medium">
                    Pengguna di cabang ini bakal kehilangan kaitannya. Aksi ini nggak bisa dibatalin.
                  </p>
                </div>
              ) : (
                <p>
                  Yakin mau hapus cabang <strong>{branchData?.name}</strong>?
                  Aksi ini nggak bisa dibatalin.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteBranch.isPending}
            className="bg-destructive-solid hover:bg-destructive-solid/90"
          >
            {deleteBranch.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── BranchDataTable ───────────────────────────────────────────────────────────
export default function BranchDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowSelection, setRowSelection] = useState({});

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);

  const { data: branchs = [], isLoading, refetch } = useGetBranchs();
  const handleSuccess = () => refetch();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return branchs;
    return branchs.filter((branch) =>
      [branch.name, branch.code, branch.address, branch.adminName].some(
        (field) => (field ?? "").toLowerCase().includes(query),
      ),
    );
  }, [branchs, search]);

  const columns: ColumnDef<BranchData>[] = [
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 gap-1.5 px-2 text-[10px] font-extrabold tracking-[0.8px] uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama cabang <ArrowUpDown className="size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-[180px] truncate text-sm">
          {(row.getValue("description") as string) || "-"}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Alamat",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-[160px] truncate text-sm">
          {(row.getValue("address") as string) || "-"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Telepon",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {(row.getValue("phone") as string) || "-"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 gap-1.5 px-2 text-[10px] font-extrabold tracking-[0.8px] uppercase"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown className="size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            (row.getValue("isActive") as boolean) ? "default" : "secondary"
          }
        >
          {(row.getValue("isActive") as boolean) ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      id: "stats",
      header: "Statistik",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="text-xs">
            <span className="text-success font-medium">
              {m._count?.users ?? 0} pengguna
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const m = row.original;
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
                onClick={() => navigator.clipboard.writeText(m.id)}
              >
                Salin ID cabang
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
                  setDetailDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBranch(m);
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  const sortedRows = table.getRowModel().rows;
  const { pageCount, current, visible } = paginate(sortedRows, page, 10);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cabang"
        description="Atur cabang, penanggung jawab, dan tanda tangan operasional."
      />

      <DataTableCard
        toolbar={
          <>
            <p className="text-[11.5px] font-semibold text-[#6B7280]">
              {filtered.length} cabang
              {table.getSelectedRowModel().rows.length > 0
                ? ` · ${table.getSelectedRowModel().rows.length} dipilih`
                : ""}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <DataTableSearch
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Cari nama, kode, atau alamat"
                label="Cari cabang"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-[11.5px] font-bold"
                  >
                    Kolom <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((c) => c.getCanHide())
                    .map((column) => (
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
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-[11.5px] font-bold"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                Tambah cabang
              </Button>
            </div>
          </>
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <DataTableHeadRow key={hg.id}>
                {hg.headers.map((header) => (
                  <DataTableHeadCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </DataTableHeadCell>
                ))}
              </DataTableHeadRow>
            ))}
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((row) => (
                <DataTableRow key={row.id}>
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
                {branchs.length === 0
                  ? "Belum ada cabang. Tambah cabang pertama dulu, ya."
                  : "Nggak ada cabang yang cocok dengan pencarian."}
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
          noun="cabang"
        />
      </DataTableCard>

      {/* Dialogs */}
      <BranchFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />
      <BranchFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editData={selectedBranch}
        onSuccess={handleSuccess}
      />
      <BranchDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        branchData={selectedBranch}
      />
      <DeleteBranchDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        branchData={selectedBranch}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

