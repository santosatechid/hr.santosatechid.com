import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public endpoints without authentication
  if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  // console.log("Middleware - Session cookie:", sessionCookie);

  if (!sessionCookie && process.env.NODE_ENV === "production") {
    // Check if this is an API route
    if (pathname.startsWith("/api")) {
      // Return 401 Unauthorized for API routes
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    // Redirect to sign-in for dashboard routes
    // console.log("No session cookie found, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/signIn", request.url));
  }

  // Path diteruskan ke server component supaya guard layout bisa memeriksa
  // akses per halaman sesuai matriks RBAC PRD §4.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/onboarding",
    "/api/:path*",
  ],
};
