"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ChevronsUpDown, LogOut, User as UserIcon } from "lucide-react";

import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import { canAccessPath } from "@/services/hris/access";
import { iconMap, menuGroups } from "@/config/menuGroupsSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/services/auth/authClients";

/** The Santosa HR mark, cut from the product screens. */
function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
    >
      <span className="bg-[#1147CE] flex size-6 shrink-0 items-center justify-center rounded-[7px]">
        <svg
          viewBox="0 0 399 399"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-3.5 w-3.5 overflow-visible"
        >
          <path
            d="M67 0l152 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-162 0 0-48a10 10 0 0 1 10-10z m-57 57l48 0 0 172-48 0a10 10 0 0 1-10-10l0-152a10 10 0 0 1 10-10z m114 57l95 0a10 10 0 0 1 10 10l0 48-105 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z m-67 113l105 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-95 0a10 10 0 0 1-10-10l0-48z m168-56l63 0 0 161a10 10 0 0 1-10 10l-53 0 0-171z m69-57l95 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-105 0 0-48a10 10 0 0 1 10-10z m-227 227l162 0 0 48a10 10 0 0 1-10 10l-152 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
      <span className="text-foreground text-[13px] font-extrabold tracking-[-0.3px] whitespace-nowrap">
        Santosa<span className="text-[#2F80ED]">HR</span>
      </span>
    </Link>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  // Satu menu aktif saja: path terpanjang yang cocok menang, jadi
  // /dashboard/attendance/logs tidak ikut menyalakan /dashboard/attendance.
  const activeUrl = useMemo(() => {
    const matches = menuGroups
      .flatMap((group) => group.items.map((item) => item.url))
      .filter((url) => pathname === url || pathname.startsWith(`${url}/`));
    return matches.sort((a, b) => b.length - a.length)[0] ?? null;
  }, [pathname]);
  const { data: session } = useSession();
  const { data: userData, isLoading: isUserDataLoading } =
    useGetUserByIdBetterAuth(session?.user?.id ?? "");

  if (isUserDataLoading) {
    return (
      <Sidebar collapsible="offcanvas" className="border-sidebar-border">
        <SidebarHeader className="px-3 py-4">
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <p className="text-muted-foreground px-3 text-xs font-medium">
            Memuat menu...
          </p>
        </SidebarContent>
      </Sidebar>
    );
  }

  const userRole = userData?.role?.name || "user";
  const permissions = userData?.role?.permissions || [];
  const visibleItems = (url: string) =>
    canAccessPath(userRole, permissions, url);

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signIn");
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader className="px-3 pt-4 pb-1">
        <Brand />
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        {menuGroups.map((group) => {
          const items = group.items.filter((item) => visibleItems(item.url));
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.title} className="p-0 py-1">
              <SidebarGroupLabel className="text-[8px] font-extrabold tracking-[0.8px] uppercase px-2 py-2.5">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {items.map((item) => {
                    const Icon = item.icon ? iconMap[item.icon] : null;
                    const isActive = item.url === activeUrl;

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`group/item h-auto w-full gap-2 rounded-[7px] px-2.5 py-[7px] text-[11px] ${
                            isActive
                              ? "bg-sidebar-active text-sidebar-active-foreground font-bold"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground font-medium"
                          }`}
                        >
                          <Link href={item.url}>
                            {Icon && (
                              <Icon
                                className={`size-[13px] shrink-0 ${
                                  isActive
                                    ? "text-[#2F80ED]"
                                    : "text-[#A5ABB5] group-hover/item:text-muted-foreground"
                                }`}
                              />
                            )}
                            <span className="truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-secondary flex w-full items-center gap-2 rounded-[7px] p-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Avatar className="size-[26px] shrink-0 rounded-full">
                {userData?.avatarUrl && (
                  <Image
                    width={26}
                    height={26}
                    src={userData.avatarUrl}
                    alt={userData.name || "User"}
                    className="rounded-full object-cover"
                  />
                )}
                <AvatarFallback className="bg-accent text-[9px] font-extrabold text-accent-foreground">
                  {getUserInitials(userData?.name)}
                </AvatarFallback>
              </Avatar>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground truncate text-[10px] font-bold">
                  {userData?.name || "Pengguna"}
                </span>
                <span className="text-muted-foreground truncate text-[9px] font-medium capitalize">
                  {userRole}
                </span>
              </span>
              <ChevronsUpDown className="text-[#A5ABB5] size-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="right"
            className="w-56 rounded-xl p-1"
          >
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[11px]">
              <div>Akun terhubung</div>
              <div className="text-foreground truncate font-bold">
                {session?.user?.email || "user@example.com"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile")}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium"
            >
              <UserIcon className="size-3.5" />
              Profil pengguna
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium"
            >
              <LogOut className="size-3.5" />
              Keluar dari akun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
