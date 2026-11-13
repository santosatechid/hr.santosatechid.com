"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  useCreateDivision,
  useDeleteDivision,
  useGetDivisions,
  useUpdateDivision,
  type DivisionRecord,
} from "@/hooks/divisions/useDivisions";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

type FormState = { name: string; description: string; isActive: boolean };

const EMPTY_FORM: FormState = { name: "", description: "", isActive: true };

function DivisionFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: DivisionRecord | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const isSaving = createDivision.isPending || updateDivision.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(
      editData
        ? {
            name: editData.name,
            description: editData.description ?? "",
            isActive: editData.isActive,
          }
        : EMPTY_FORM,
    );
  }, [open, editData]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      toast.error("Nama divisi minimal 2 karakter, ya.");
      return;
    }

    try {
      if (editData) {
        await updateDivision.mutateAsync({
          id: editData.id,
          name,
          description: form.description.trim(),
          isActive: form.isActive,
        });
        toast.success("Divisi berhasil diperbarui.");
      } else {
        await createDivision.mutateAsync({
          name,
          description: form.description.trim(),
          isActive: form.isActive,
        });
        toast.success("Divisi baru berhasil dibuat.");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit divisi" : "Tambah divisi"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="division-name">Nama divisi</Label>
            <Input
              id="division-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Contoh: Keuangan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division-description">Deskripsi (opsional)</Label>
            <Textarea
              id="division-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Tugas singkat divisi ini..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="division-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isActive: checked === true }))
              }
            />
            <Label htmlFor="division-active" className="cursor-pointer font-normal">
              Divisi aktif
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : editData ? "Simpan perubahan" : "Tambah divisi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DivisionDetailDialog({
  open,
  onOpenChange,
  division,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: DivisionRecord | null;
}) {
  if (!division) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{division.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Deskripsi</p>
            <p>{division.description || "Belum ada deskripsi."}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <Badge variant={division.isActive ? "default" : "secondary"}>
              {division.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Karyawan</p>
            <p>{division._count?.users ?? 0} karyawan</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDivisionDialog({
  open,
  onOpenChange,
  division,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: DivisionRecord | null;
  onSuccess: () => void;
}) {
  const deleteDivision = useDeleteDivision();

  const remove = async () => {
    if (!division) return;
    try {
      await deleteDivision.mutateAsync(division.id);
      toast.success("Divisi berhasil dihapus. Karyawan tetap aman.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus divisi?</AlertDialogTitle>
          <AlertDialogDescription>
            Divisi <strong>{division?.name}</strong> akan dihapus. Karyawan di
            dalamnya tetap ada, hanya kaitan divisinya yang dikosongkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={remove}
            disabled={deleteDivision.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteDivision.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function DivisionsPage() {
  const { data: divisions = [], isLoading, refetch, error } = useGetDivisions();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DivisionRecord | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return divisions
      .filter((division) => {
        if (!query) return true;
        return (
          division.name.toLowerCase().includes(query) ||
          (division.description ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) =>
        sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
  }, [divisions, search, sortAsc]);

  const PAGE_SIZE = 10;
  const { pageCount, current, visible } = paginate(filtered, page, PAGE_SIZE);

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto w-full space-y-4">
      <PageHeader
        title="Divisi"
        description="Atur divisi kerja, misalnya Keuangan, HR, atau Operasional."
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Tambah divisi
          </Button>
        }
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {getErrorMessage(error)}
        </p>
      )}

      <DataTableCard
        toolbar={
          <>
            <DataTableSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Cari nama atau deskripsi divisi..."
              label="Cari divisi"
            />
            <span className="text-muted-foreground text-[11.5px] font-semibold">
              {filtered.length} divisi
            </span>
          </>
        }
      >
        <Table>
          <TableHeader>
            <DataTableHeadRow>
              <DataTableHeadCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 gap-1 text-[10px] font-extrabold tracking-[0.8px] uppercase"
                  onClick={() => {
                    setSortAsc((current) => !current);
                    setPage(1);
                  }}
                >
                  Nama divisi <ArrowUpDown className="size-3.5" />
                </Button>
              </DataTableHeadCell>
              <DataTableHeadCell>Deskripsi</DataTableHeadCell>
              <DataTableHeadCell className="w-32">Status</DataTableHeadCell>
              <DataTableHeadCell className="w-32">Karyawan</DataTableHeadCell>
              <DataTableHeadCell className="w-14 text-right">Aksi</DataTableHeadCell>
            </DataTableHeadRow>
          </TableHeader>
          <TableBody>
            {visible.map((division) => (
              <DataTableRow key={division.id}>
                <TableCell className="font-medium">{division.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-[320px] truncate">
                  {division.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={division.isActive ? "success" : "secondary"}>
                    {division.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="size-3.5" />
                    {division._count?.users ?? 0}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Aksi ${division.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelected(division);
                          setDetailOpen(true);
                        }}
                      >
                        Lihat detail
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelected(division);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelected(division);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </DataTableRow>
            ))}
            {filtered.length === 0 && (
              <DataTableEmpty colSpan={5}>
                {search
                  ? "Divisi yang kamu cari nggak ditemukan."
                  : "Belum ada divisi. Tambah divisi pertama dengan tombol di atas."}
              </DataTableEmpty>
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          from={filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}
          to={(current - 1) * PAGE_SIZE + visible.length}
          total={filtered.length}
          page={current}
          pageCount={pageCount}
          onPageChange={setPage}
          noun="divisi"
        />
      </DataTableCard>

      <DivisionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={selected}
        onSuccess={refetch}
      />
      <DivisionDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        division={selected}
      />
      <DeleteDivisionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        division={selected}
        onSuccess={refetch}
      />
    </div>
  );
}
