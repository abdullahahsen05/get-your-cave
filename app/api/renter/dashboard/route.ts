import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getRenterDashboardSnapshot } from "@/lib/dashboard/renter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view the renter dashboard." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "RENTER" || !currentUser.renterProfile) {
    return NextResponse.json(
      { error: "Only authenticated renters can view the renter dashboard." },
      { status: 403 },
    );
  }

  const data = await getRenterDashboardSnapshot(currentUser.renterProfile.id);

  return NextResponse.json({
    renter: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
    },
    ...data,
  });
}

