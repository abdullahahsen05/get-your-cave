import { NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateInvoiceForBooking,
  getInvoicesForViewer,
} from "@/lib/invoices/generateInvoice";
import { normalizeInvoiceSort, normalizeInvoiceStatusFilter } from "@/lib/invoices/invoiceTypes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view invoices." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");
  const search = searchParams.get("q") ?? "";
  const status = normalizeInvoiceStatusFilter(searchParams.get("status"));
  const sort = normalizeInvoiceSort(searchParams.get("sort"));

  const result = await getInvoicesForViewer(
    {
      role: currentUser.role,
      ownerProfileId: currentUser.ownerProfile?.id ?? null,
      renterProfileId: currentUser.renterProfile?.id ?? null,
    },
    {
      page,
      pageSize,
      search,
      status,
      sort,
    },
  );

  return NextResponse.json({
    invoices: result.invoices,
    pagination: result.pagination,
    summary: result.summary,
    totals: result.totals,
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to generate invoices." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can generate invoices." },
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

  const bookingId = typeof body === "object" && body && "bookingId" in body
    ? String((body as { bookingId?: unknown }).bookingId ?? "")
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
      renterId: true,
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 },
    );
  }

  if (currentUser.role === "OWNER" && currentUser.ownerProfile?.id !== booking.ownerId) {
    return NextResponse.json(
      { error: "You cannot generate invoices for another owner." },
      { status: 403 },
    );
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners and admins can generate invoices." },
      { status: 403 },
    );
  }

  const generated = await generateInvoiceForBooking({
    bookingId,
    status: InvoiceStatus.ISSUED,
  });

  if (!generated) {
    return NextResponse.json(
      { error: "Unable to generate invoice for this booking." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invoice: generated });
}
