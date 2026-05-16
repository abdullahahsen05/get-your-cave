import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContractForBooking } from "@/lib/contracts/generateContract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to generate contracts." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can generate contracts." },
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

  const bookingId =
    typeof body === "object" && body !== null && "bookingId" in body
      ? String((body as { bookingId?: unknown }).bookingId ?? "").trim()
      : "";

  if (!bookingId) {
    return NextResponse.json(
      { error: "bookingId is required." },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      ownerId: true,
      status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (
    currentUser.role === "OWNER" &&
    currentUser.ownerProfile?.id !== booking.ownerId
  ) {
    return NextResponse.json(
      { error: "You cannot generate a contract for another owner's booking." },
      { status: 403 },
    );
  }

  const allowedStatuses = new Set<BookingStatus>([
    BookingStatus.APPROVED,
    BookingStatus.ACTIVE,
    BookingStatus.COMPLETED,
  ]);

  if (!allowedStatuses.has(booking.status)) {
    return NextResponse.json(
      { error: "Contracts can only be generated for approved bookings." },
      { status: 409 },
    );
  }

  const result = await generateContractForBooking({
    bookingId,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Unable to generate contract." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    contract: result.contract,
    generatedAt: result.generatedAt,
    fileSizeBytes: result.fileSizeBytes,
  });
}
