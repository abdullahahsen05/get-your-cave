import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { activateUserForAdmin, requireAdminAccess } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
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

  const adminUser = access.user;
  const { id } = await context.params;

  const result = await activateUserForAdmin(id, adminUser.id);

  if ("error" in result) {
    const status = result.error === "User not found." ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
