import {
  Building2,
  ClipboardList,
  Clock3,
  History,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import { type ElementType } from "react";

const iconMap: Record<string, ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  roles: Shield,
  branch: Building2,
  settings: Settings,
  bot: MessageSquare,
  profile: UserIcon,
  payroll: Landmark,
  attendance: Clock3,
  history: History,
  requests: ClipboardList,
};

export type MenuItem = {
  title: string;
  url: string;
  icon?: keyof typeof iconMap;
};

export type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export const menuGroups: MenuGroup[] = [
  {
    title: "Saya",
    items: [
      { title: "Beranda", url: "/dashboard", icon: "dashboard" },
      { title: "Absen", url: "/dashboard/attendance", icon: "attendance" },
      { title: "Riwayat absensi", url: "/dashboard/attendance/logs", icon: "history" },
      { title: "Pengajuan", url: "/dashboard/requests", icon: "requests" },
      { title: "Slip gaji", url: "/dashboard/payslips", icon: "payroll" },
      { title: "Profil", url: "/dashboard/profile", icon: "profile" },
    ],
  },
  {
    title: "Tim",
    items: [
      { title: "Karyawan", url: "/dashboard/admin/master/users", icon: "users" },
      { title: "Peran & akses", url: "/dashboard/admin/master/roles", icon: "roles" },
      { title: "Area & cabang", url: "/dashboard/admin/master/branches", icon: "branch" },
      { title: "Divisi", url: "/dashboard/admin/master/divisions", icon: "branch" },
      { title: "Persetujuan", url: "/dashboard/admin/requests", icon: "requests" },
    ],
  },
  {
    title: "Penggajian",
    items: [
      { title: "Payroll", url: "/dashboard/payroll/runs", icon: "payroll" },
      {
        title: "File bank",
        url: "/dashboard/payroll/bank",
        icon: "payroll",
      },
    ],
  },
  {
    title: "Utilitas",
    items: [
      {
        title: "WhatsApp",
        url: "/dashboard/admin/utility/whatsapp",
        icon: "bot",
      },
    ],
  },
];

export { iconMap };
