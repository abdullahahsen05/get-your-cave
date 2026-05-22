import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerDashboardSnapshot } from "@/lib/dashboard/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view owner revenue." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only authenticated owners can view owner revenue." },
      { status: 403 },
    );
  }

  const data = await getOwnerDashboardSnapshot(currentUser.ownerProfile.id);

  return NextResponse.json({
    revenueSeries: data.revenueSeries,
    revenueLinePath: data.revenueLinePath,
    revenueAreaPath: data.revenueAreaPath,
    earningsGrowthPercent: data.earningsGrowthPercent,
    pendingPayoutAmount: data.pendingPayoutAmount,
    pendingPayoutReleaseDate: data.pendingPayoutReleaseDate,
  });
}

