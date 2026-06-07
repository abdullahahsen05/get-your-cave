import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const status = url.searchParams.get("status") ?? "";

  const where = status && Object.values(BookingStatus).includes(status as BookingStatus)
    ? { status: status as BookingStatus }
    : {};

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        monthlyPrice: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        listing: { select: { title: true, city: true } },
        owner: { select: { user: { select: { fullName: true, email: true } } } },
        renter: { select: { user: { select: { fullName: true, email: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    limit,
    bookings: bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      monthlyPrice: b.monthlyPrice.toString(),
      startDate: b.startDate.toISOString(),
      endDate: b.endDate?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      listingTitle: b.listing.title,
      listingCity: b.listing.city,
      ownerName: b.owner.user.fullName,
      ownerEmail: b.owner.user.email,
      renterName: b.renter.user.fullName,
      renterEmail: b.renter.user.email,
    })),
  });
}
