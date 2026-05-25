import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  approveListingForAdmin,
  getAdminListings,
  rejectListingForAdmin,
  requireAdminAccess,
} from "@/lib/admin";
import {
  adminListingModerationActionSchema,
  adminListingsQuerySchema,
} from "@/lib/validations/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = adminListingsQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listings query parameters." }, { status: 400 });
  }

  const data = await getAdminListings(parsed.data);
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = adminListingModerationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid moderation payload." },
      { status: 400 },
    );
  }

  const adminUser = access.user;
  const { id, action, reason } = parsed.data;
  const result =
    action === "approve"
      ? await approveListingForAdmin(id, adminUser.id)
      : await rejectListingForAdmin(id, adminUser.id, reason);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
