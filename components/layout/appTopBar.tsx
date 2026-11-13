"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

import { useGetUserByIdBetterAuth } from "@/hooks/users/useUsersByIdBetterAuth";
import NotificationBell from "@/components/layout/notificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/services/auth/authClients";

export default function AppTopBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: userData } = useGetUserByIdBetterAuth(session?.user?.id ?? "");
  const [query, setQuery] = useState("");

  const name = userData?.name || session?.user?.name || "Pengguna";
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header className="bg-background/95 border-sidebar-border sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-5">
      <SidebarTrigger className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md" />

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const term = query.trim();
          router.push(
            term
              ? `/dashboard/admin/master/users?q=${encodeURIComponent(term)}`
              : "/dashboard/admin/master/users",
          );
        }}
        className="bg-secondary ml-1 hidden h-8 w-full max-w-[280px] items-center gap-2 rounded-lg px-3 sm:flex"
      >
        <Search className="text-[#A5ABB5] size-3.5 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari karyawan atau user…"
          aria-label="Cari karyawan atau user"
          className="text-foreground placeholder:text-[#A5ABB5] w-full min-w-0 bg-transparent text-[11px] font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <Link
          href="/dashboard/profile"
          className="hover:bg-secondary flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors"
        >
          <span className="hidden max-w-[140px] truncate text-[11px] font-bold md:block">
            {name}
          </span>
          <Avatar className="size-7 rounded-full">
            {userData?.avatarUrl && (
              <Image
                width={28}
                height={28}
                src={userData.avatarUrl}
                alt={name}
                className="rounded-full object-cover"
              />
            )}
            <AvatarFallback className="bg-[#2F80ED] text-[10px] font-extrabold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
