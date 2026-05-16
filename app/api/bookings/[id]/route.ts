import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getBookingForViewer, updateBookingForViewer } from "@/lib/bookings";
import { bookingUpdateSchema } from "@/lib/validations/booking";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const booking = await getBookingForViewer(id, currentUser
    ? {
        role: currentUser.role,
        ownerProfileId: currentUser.ownerProfile?.id ?? null,
        renterProfileId: currentUser.renterProfile?.id ?? null,
      }
    : undefined);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ booking });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to update bookings." },
      { status: 401 },
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

  const parsed = bookingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid booking details.",
      },
      { status: 400 },
    );
  }

  const booking = await updateBookingForViewer({
    bookingId: id,
    viewer: {
      role: currentUser.role,
      ownerProfileId: currentUser.ownerProfile?.id ?? null,
      renterProfileId: currentUser.renterProfile?.id ?? null,
    },
    data: parsed.data,
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Unable to update booking right now." },
      { status: 403 },
    );
  }

  return NextResponse.json({ booking });
}
