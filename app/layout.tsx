import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type Metadata, type Viewport } from "next";
import localFont from "next/font/local";

import { ReactQueryProvider } from "@/app/providers";
import { type ReactNode } from "react";

const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-plus-jakarta",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_CLIENT_NAME || "SaaS Starter",
  description: `Aplikasi portal utama ${process.env.NEXT_PUBLIC_CLIENT_NAME || "SaaS Starter"}`,
  manifest: "/manifest.json",
  icons: {
    icon: process.env.CLIENT_FAVICON || "/favicon.ico",
    apple: process.env.CLIENT_APPLE_ICON || "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_CLIENT_NAME || "SaaS Starter",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="id"
      className={plusJakarta.variable}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <Toaster />
        <ReactQueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
