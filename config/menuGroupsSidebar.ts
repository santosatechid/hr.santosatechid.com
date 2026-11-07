import {
  Building2,
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
    title: "Utama",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      { title: "Profile", url: "/dashboard/profile", icon: "profile" },
    ],
  },
  {
    title: "Master Data",
    items: [
      { title: "Users", url: "/dashboard/admin/master/users", icon: "users" },
      { title: "Roles", url: "/dashboard/admin/master/roles", icon: "roles" },
      {
        title: "Branches",
        url: "/dashboard/admin/master/branches",
        icon: "branch",
      },
    ],
  },
  {
    title: "Payroll",
    items: [
      {
        title: "Bank Transfer",
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
