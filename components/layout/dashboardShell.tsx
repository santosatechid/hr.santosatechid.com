"use client";

import { type CSSProperties, type ReactNode } from "react";

import { AppSidebar } from "@/components/layout/appSidebar";
import AppTopBar from "@/components/layout/appTopBar";
import InstallButton from "@/components/layout/installButton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
      className="bg-background"
    >
      <AppSidebar />
      <SidebarInset className="bg-background flex min-h-svh flex-col">
        <AppTopBar />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] space-y-4 px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>
        <InstallButton />
      </SidebarInset>
    </SidebarProvider>
  );
}
