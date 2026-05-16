import { NextResponse, type NextRequest } from "next/server";

import { getAuthCookieName, getDashboardPath, verifySessionToken } from "@/lib/auth";

const protectedRoutes = [
  "/owner/:path*",
  "/renter/:path*",
  "/admin/:path*",
  "/messaging/:path*",
  "/contracts/:path*",
  "/invoices/:path*",
  "/document/:path*",
  "/create-listing",
];

const authRoutes = ["/login", "/signup"];

function matchesRoute(pathname: string, pattern: string) {
  if (pattern.endsWith("/:path*")) {
    const base = pattern.slice(0, -7);
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  return pathname === pattern;
}

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((pattern) => matchesRoute(pathname, pattern));
}

function isAuthPath(pathname: string) {
  return authRoutes.some((pattern) => matchesRoute(pathname, pattern));
}

function getLoginRedirect(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return url;
}

function getRouteRoleRequirement(pathname: string) {
  if (pathname.startsWith("/owner") || pathname === "/create-listing") {
    return "OWNER" as const;
  }

  if (pathname.startsWith("/renter")) {
    return "RENTER" as const;
  }

  if (pathname.startsWith("/admin")) {
    return "ADMIN" as const;
  }

  if (
    pathname.startsWith("/messaging") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/document")
  ) {
    return "AUTHENTICATED" as const;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthPath(pathname)) {
    const token = request.cookies.get(getAuthCookieName())?.value;
    if (!token) {
      return NextResponse.next();
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(getDashboardPath(payload.role), request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return NextResponse.redirect(getLoginRedirect(request));
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.redirect(getLoginRedirect(request));
  }

  const requirement = getRouteRoleRequirement(pathname);
  if (requirement === "AUTHENTICATED") {
    return NextResponse.next();
  }

  if (requirement && payload.role !== requirement) {
    return NextResponse.redirect(new URL(getDashboardPath(payload.role), request.url));
  }

  if (pathname === "/login" || pathname === "/signup") {
    return NextResponse.redirect(new URL(getDashboardPath(payload.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/renter/:path*",
    "/admin/:path*",
    "/messaging/:path*",
    "/contracts/:path*",
    "/invoices/:path*",
    "/document/:path*",
    "/create-listing",
    "/login",
    "/signup",
  ],
};
