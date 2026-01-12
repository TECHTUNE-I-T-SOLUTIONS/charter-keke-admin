import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to protect routes and enforce role-based access
 * Note: NextAuth session checks are done client-side via auth context
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - no auth required
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/complete-profile",
    "/how-it-works",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/safety",
    "/faq",
    "/help",
    "/api/auth",
    "/api/upload",
    "/offline",
  ];

  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // For protected routes, allow request to proceed and let client-side auth handle it
  // Protected routes will redirect to login via useAuth hook if user isn't authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|sw.js|api).*)",
  ],
};
