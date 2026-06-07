import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerEarningsStatement } from "@/lib/invoices/earningsStatement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const statement = await getOwnerEarningsStatement(currentUser.ownerProfile.id);
  return NextResponse.json(statement);
}
