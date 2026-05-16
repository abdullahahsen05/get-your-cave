import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getRenterBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to access renter bookings." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "RENTER" || !currentUser.renterProfile) {
    return NextResponse.json(
      { error: "Only authenticated renters can access renter bookings." },
      { status: 403 },
    );
  }

  const bookings = await getRenterBookings(currentUser.renterProfile.id);

  return NextResponse.json({
    bookings,
    renter: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
    },
  });
}
