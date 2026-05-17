import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getRevenueAnalytics, requireAdminAccess } from "@/lib/admin";
import { adminRangeSchema } from "@/lib/validations/admin";

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

  const searchParams = new URL(request.url).searchParams;
  const parsedRange = adminRangeSchema.safeParse(searchParams.get("range") ?? undefined);
  const range = parsedRange.success ? parsedRange.data : "30d";
  const data = await getRevenueAnalytics(range);

  return NextResponse.json(data);
}
