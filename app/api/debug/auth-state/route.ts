import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser, getAuthCookieName, getDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const hasCookie = Boolean(cookieStore.get(getAuthCookieName())?.value);

  let userResolved = false;
  let userId: string | null = null;
  let email: string | null = null;
  let role: string | null = null;
  let status: string | null = null;
  let hasOwnerProfile = false;
  let hasRenterProfile = false;
  let dashboardDestination: string | null = null;

  try {
    const currentUser = await getCurrentUser();
    userResolved = Boolean(currentUser);

    if (currentUser) {
      userId = currentUser.id;
      email = currentUser.email;
      role = currentUser.role;
      status = currentUser.status;
      hasOwnerProfile = Boolean(currentUser.ownerProfile);
      hasRenterProfile = Boolean(currentUser.renterProfile);
      dashboardDestination = getDashboardPath(currentUser.role);
    }
  } catch {
    userResolved = false;
  }

  const host = request.headers.get("host") ?? new URL(request.url).host;

  return NextResponse.json({
    hasCookie,
    userResolved,
    userId,
    email,
    role,
    status,
    hasOwnerProfile,
    hasRenterProfile,
    dashboardDestination,
    host,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
