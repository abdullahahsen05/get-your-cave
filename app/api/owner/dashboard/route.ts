import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerDashboardSnapshot } from "@/lib/dashboard/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view the owner dashboard." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only authenticated owners can view the owner dashboard." },
      { status: 403 },
    );
  }

  const data = await getOwnerDashboardSnapshot(currentUser.ownerProfile.id);

  return NextResponse.json({
    owner: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
    },
    ...data,
  });
}

