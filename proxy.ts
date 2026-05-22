import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
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

async function getSessionUser(payload: Awaited<ReturnType<typeof verifySessionToken>>) {
  if (!payload) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      role: true,
      status: true,
      ownerProfile: { select: { id: true } },
      renterProfile: { select: { id: true } },
    },
  });
}

function hasRouteProfileAccess(
  role: "ADMIN" | "OWNER" | "RENTER",
  user: {
    ownerProfile?: { id: string } | null;
    renterProfile?: { id: string } | null;
    status: string;
  } | null,
) {
  if (!user) {
    return false;
  }

  if (user.status !== "ACTIVE") {
    return false;
  }

  if (role === "OWNER") {
    return Boolean(user.ownerProfile);
  }

  if (role === "RENTER") {
    return Boolean(user.renterProfile);
  }

  return true;
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
  const token = request.cookies.get(getAuthCookieName())?.value;
  const payload = token ? await verifySessionToken(token) : null;
  const sessionUser = payload ? await getSessionUser(payload) : null;

  if (isAuthPath(pathname)) {
    if (!payload || !sessionUser) {
      return NextResponse.next();
    }

    if (!hasRouteProfileAccess(sessionUser.role, sessionUser)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(getDashboardPath(sessionUser.role), request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!payload || !sessionUser) {
    return NextResponse.redirect(getLoginRedirect(request));
  }

  const requirement = getRouteRoleRequirement(pathname);
  if (requirement === "AUTHENTICATED") {
    return NextResponse.next();
  }

  if (requirement && sessionUser.role !== requirement) {
    return NextResponse.redirect(new URL(getDashboardPath(sessionUser.role), request.url));
  }

  if (!hasRouteProfileAccess(sessionUser.role, sessionUser)) {
    return NextResponse.redirect(getLoginRedirect(request));
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
