"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  MapPin,
  MessageSquare,
  Shield,
  User,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useGetConnectionBotWa } from "@/hooks/whatsApp/useBotWa";
import { useGetBranchs } from "@/hooks/branches/useBranches";
import { useGetRoles } from "@/hooks/roles/useRoles";
import { useGetUsers } from "@/hooks/users/useUsers";
import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import Loading from "@/components/common/loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdminRole } from "@/services/hris/access";
import { useSession } from "@/services/auth/authClients";

const QUICK_LINKS = [
  { href: "/dashboard/admin/master/users", label: "Atur pengguna", icon: User },
  { href: "/dashboard/admin/master/roles", label: "Atur akses", icon: Shield },
  {
    href: "/dashboard/admin/master/branches",
    label: "Kelola cabang",
    icon: Building2,
  },
  { href: "/dashboard/admin/master/divisions", label: "Atur divisi", icon: Building2 },
  {
    href: "/dashboard/admin/utility/whatsapp",
    label: "WhatsApp gateway",
    icon: MessageSquare,
  },
] as const;

function initialsOf(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const {
    data: currentUser,
    isLoading: isUserLoading,
  } = useGetUserByIdBetterAuth(session?.user?.id ?? "");
  const isAdmin = isAdminRole(currentUser?.role?.name);

  useEffect(() => {
    if (!isSessionPending && !isUserLoading && session?.user && !isAdmin) {
      router.replace("/dashboard/attendance");
    }
  }, [isAdmin, isSessionPending, isUserLoading, router, session?.user]);

  const { data: users = [], isLoading: usersLoading } = useGetUsers(isAdmin);
  const { data: roles = [] } = useGetRoles(isAdmin);
  const { data: branches = [] } = useGetBranchs(isAdmin);
  const { data: connection } = useGetConnectionBotWa(isAdmin);

  if (isSessionPending || isUserLoading || !isAdmin) return <Loading />;

  const isConnected = connection?.connection === "success";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const stats = [
    {
      label: "Jumlah pengguna",
      value: usersLoading ? "…" : users.length,
      note: `${roles.length} akses terdaftar`,
      icon: Users,
      tile: "bg-[#EAF2FE]",
      ink: "text-[#1F6BD8]",
    },
    {
      label: "Role aktif",
      value: roles.length,
      note: "atur akses menu",
      icon: Shield,
      tile: "bg-[#E8F7EE]",
      ink: "text-[#15803D]",
    },
    {
      label: "Cabang",
      value: branches.length,
      note: "lokasi operasional",
      icon: Building2,
      tile: "bg-[#F3EEFE]",
      ink: "text-[#6D45C9]",
    },
    {
      label: "WhatsApp",
      value: isConnected ? "Terhubung" : "Terputus",
      note: connection?.instance || "belum terhubung",
      icon: isConnected ? Wifi : WifiOff,
      tile: isConnected ? "bg-[#E8F7EE]" : "bg-[#FFF4D6]",
      ink: isConnected ? "text-[#15803D]" : "text-[#8A6400]",
    },
  ];

  const firstName =
    currentUser?.name?.split(" ")[0] || session?.user?.name?.split(" ")[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[18px] leading-tight font-extrabold tracking-[-0.4px]">
          Hai{firstName ? `, ${firstName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-[11px] font-medium">
          {today} · {users.length} pengguna di {branches.length} cabang
        </p>
      </div>

      {/* Hint card: setup yang dilewati tetap terlihat, bukan hilang (PRD §7.8). */}
      {(branches.every((branch) => branch.latitude === null) ||
        users.length === 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {branches.every((branch) => branch.latitude === null) && (
            <Card className="border-[#F5D48A] bg-[#FFF9EC] p-[14px_15px]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#8A6400]" aria-hidden />
                <div className="space-y-1.5">
                  <p className="text-[12px] font-extrabold">
                    Area absensi belum diatur
                  </p>
                  <p className="text-[11px] leading-[16px] font-medium text-[#6b5300]">
                    Tanpa titik lokasi, karyawan tidak bisa absen. Butuh 1
                    menit: geser pin di peta, atur radius.
                  </p>
                  <Link
                    href="/dashboard/admin/master/branches"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A6400] hover:underline"
                  >
                    Atur area absensi
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {users.length === 0 && (
            <Card className="border-[#BBD6FB] bg-[#F4F8FF] p-[14px_15px]">
              <div className="flex items-start gap-3">
                <UserPlus className="mt-0.5 size-4 shrink-0 text-[#1F6BD8]" aria-hidden />
                <div className="space-y-1.5">
                  <p className="text-[12px] font-extrabold">
                    Tambahkan karyawan pertama
                  </p>
                  <p className="text-[11px] leading-[16px] font-medium text-[#1c4a86]">
                    Isi nama, jabatan, dan cabang. Gaji dan rekening bisa
                    dilengkapi nanti.
                  </p>
                  <Link
                    href="/dashboard/admin/master/users"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F6BD8] hover:underline"
                  >
                    Tambah karyawan
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, tile, ink }) => (
          <Card key={label} className="gap-2 p-[14px_15px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-semibold">
                {label}
              </span>
              <span
                className={`flex size-6 items-center justify-center rounded-[7px] ${tile}`}
              >
                <Icon className={`size-3 ${ink}`} />
              </span>
            </div>
            <div className="text-[21px] leading-none font-extrabold tracking-[-0.6px]">
              {value}
            </div>
            <div className="text-[9px] font-medium text-[#A5ABB5]">{note}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_318px]">
        <Card className="gap-3 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pengguna terbaru</CardTitle>
              <CardDescription>
                Lima anggota tim yang baru gabung.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/admin/master/users"
              className="text-[#2F80ED] text-[9px] font-bold hover:underline"
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 5).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 rounded-full">
                          <AvatarFallback className="bg-[#DBEAFE] text-[8.5px] font-extrabold text-[#374151]">
                            {initialsOf(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[9.5px] font-bold">
                            {user.name}
                          </span>
                          <span className="text-[8px] font-medium text-[#A5ABB5]">
                            {user.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[9px] font-semibold">
                      {user.role?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={user.isActive === false ? "secondary" : "success"}
                      >
                        {user.isActive === false ? "Nonaktif" : "Aktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!usersLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground py-8 text-center text-xs font-medium"
                    >
                      Belum ada pengguna. Yuk, tambahkan lewat menu Pengguna.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl border border-[#2F80ED] bg-[#2F80ED] p-[14px_15px] text-white">
            <div className="pointer-events-none absolute -top-16 right-[-70px] size-56 rounded-full bg-white/10" />
            <div className="relative flex flex-col gap-2">
              <span className="text-[8px] font-extrabold tracking-[0.8px] text-[#C6DBFC] uppercase">
                WhatsApp gateway
              </span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="size-4" />
                ) : (
                  <WifiOff className="size-4" />
                )}
                <span className="text-[20px] leading-none font-extrabold tracking-[-0.8px]">
                  {connection?.connection || "unknown"}
                </span>
              </div>
              <p className="text-[9px] font-medium text-[#D5E4FD]">
                {connection?.message ||
                  connection?.state ||
                  "Instance belum terhubung."}
              </p>
              <Link
                href="/dashboard/admin/utility/whatsapp"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-[7px] bg-white py-2 text-[9.5px] font-extrabold text-[#1F6BD8] transition-colors hover:bg-[#F2F7FE]"
              >
                Buka gateway
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>

          <Card className="gap-1">
            <CardHeader>
              <CardTitle>Akses cepat</CardTitle>
              <CardDescription>Menu yang paling sering dibuka.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:bg-secondary flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
                >
                  <Icon className="text-[#A5ABB5] size-3.5" />
                  <span className="flex-1 text-[11px] font-semibold">
                    {label}
                  </span>
                  <ChevronRight className="text-[#A5ABB5] size-3" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
