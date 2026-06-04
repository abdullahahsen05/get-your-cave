import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getAdminListingById, requireAdminAccess } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const { id } = await context.params;
  const listing = await getAdminListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}
