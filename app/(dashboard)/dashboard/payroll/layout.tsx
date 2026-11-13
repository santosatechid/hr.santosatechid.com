import AdminRouteGuard from "@/components/layout/adminRouteGuard";

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
