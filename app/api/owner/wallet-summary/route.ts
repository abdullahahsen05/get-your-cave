import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerWalletSummary } from "@/lib/withdrawals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: currentUser ? 403 : 401 },
    );
  }

  const summary = await getOwnerWalletSummary(currentUser.ownerProfile.id);

  if (!summary) {
    return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
  }

  return NextResponse.json(summary);
}
