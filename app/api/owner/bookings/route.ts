import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to access owner bookings." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only authenticated owners can access owner bookings." },
      { status: 403 },
    );
  }

  const bookings = await getOwnerBookings(currentUser.ownerProfile.id);

  return NextResponse.json({
    bookings,
    owner: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
    },
  });
}
