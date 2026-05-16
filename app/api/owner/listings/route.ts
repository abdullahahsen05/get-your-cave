import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only authenticated owners can access owner listings." },
      { status: 403 },
    );
  }

  const listings = await getOwnerListings(currentUser.ownerProfile.id);

  return NextResponse.json({
    listings,
    owner: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
    },
  });
}

