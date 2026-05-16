import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createRenterBooking } from "@/lib/bookings";
import { bookingCreateSchema } from "@/lib/validations/booking";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to create bookings." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "RENTER" || !currentUser.renterProfile) {
    return NextResponse.json(
      { error: "Only authenticated renters can create bookings." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid booking details.",
      },
      { status: 400 },
    );
  }

  const booking = await createRenterBooking({
    renterProfileId: currentUser.renterProfile.id,
    data: parsed.data,
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Unable to create booking right now." },
      { status: 400 },
    );
  }

  return NextResponse.json({ booking }, { status: 201 });
}
