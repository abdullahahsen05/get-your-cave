import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers, requireAdminAccess } from "@/lib/admin";
import { adminUsersQuerySchema } from "@/lib/validations/admin";

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
  const parsed = adminUsersQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid users query parameters." }, { status: 400 });
  }

  const data = await getAdminUsers(parsed.data);
  return NextResponse.json(data);
}
