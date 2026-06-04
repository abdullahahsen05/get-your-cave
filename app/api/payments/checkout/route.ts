import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStripeSubscriptionMetadata,
  getAppUrl,
  getStripeClient,
  toStripeMinorUnits,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bookingInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      address: true,
      storageType: true,
      pricePerMonth: true,
      securityDeposit: true,
      insuranceFee: true,
      status: true,
      isPublished: true,
    },
  },
  owner: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  renter: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  payments: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
    select: {
      status: true,
      stripeCheckoutSessionId: true,
    },
  },
  invoices: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
    select: {
      status: true,
      payment: {
        select: {
          status: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

type CheckoutBooking = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

function bookingIsEligibleForPayment(status: BookingStatus) {
  return status === BookingStatus.APPROVED || status === BookingStatus.ACTIVE;
}

function getBookingLatestPaymentStatus(booking: CheckoutBooking) {
  return booking.payments[0]?.status ?? null;
}

function getBookingLatestInvoiceStatus(booking: CheckoutBooking) {
  return booking.invoices[0]?.status ?? null;
}

async function loadBookingFromInvoice(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      bookingId: true,
      status: true,
      payment: {
        select: {
          status: true,
        },
      },
    },
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to start checkout." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "RENTER" || !currentUser.renterProfile?.id) {
    return NextResponse.json(
      { error: "Only renters can pay through Stripe checkout." },
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

  const invoiceId =
    typeof body === "object" && body && "invoiceId" in body
      ? String((body as { invoiceId?: unknown }).invoiceId ?? "").trim()
      : "";
  const bookingId =
    typeof body === "object" && body && "bookingId" in body
      ? String((body as { bookingId?: unknown }).bookingId ?? "").trim()
      : "";

  if (!invoiceId && !bookingId) {
    return NextResponse.json(
      { error: "An invoiceId or bookingId is required." },
      { status: 400 },
    );
  }

  let resolvedBookingId = bookingId;
  let invoiceSnapshot: Awaited<ReturnType<typeof loadBookingFromInvoice>> | null = null;

  if (invoiceId) {
    invoiceSnapshot = await loadBookingFromInvoice(invoiceId);

    if (!invoiceSnapshot) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 },
      );
    }

    resolvedBookingId = invoiceSnapshot.bookingId;

    if (
      invoiceSnapshot.status === InvoiceStatus.PAID ||
      invoiceSnapshot.payment?.status === PaymentStatus.PAID
    ) {
      return NextResponse.json(
        { error: "This invoice is already paid." },
        { status: 409 },
      );
    }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: resolvedBookingId },
    include: bookingInclude,
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 },
    );
  }

  if (booking.renterId !== currentUser.renterProfile.id) {
    return NextResponse.json(
      { error: "You can only pay for your own bookings." },
      { status: 403 },
    );
  }

  if (!bookingIsEligibleForPayment(booking.status)) {
    return NextResponse.json(
      { error: "This booking is not eligible for payment yet." },
      { status: 409 },
    );
  }

  if (
    getBookingLatestPaymentStatus(booking) === PaymentStatus.PAID ||
    getBookingLatestInvoiceStatus(booking) === InvoiceStatus.PAID
  ) {
    return NextResponse.json(
      { error: "This invoice is already paid." },
      { status: 409 },
    );
  }

  // Block if a Stripe session was already created and is still pending
  // (subscription created, waiting for webhook). Prevents duplicate subscriptions.
  const latestPayment = booking.payments[0];
  if (
    latestPayment?.status === PaymentStatus.PENDING &&
    latestPayment.stripeCheckoutSessionId
  ) {
    return NextResponse.json(
      { error: "A Stripe checkout session is already in progress for this booking. Please complete it or wait for it to expire before starting a new one." },
      { status: 409 },
    );
  }

  const isDev = process.env.NODE_ENV !== "production";
  const stripe = getStripeClient();
  const appUrl = getAppUrl(request);
  const durationMonths = Math.max(1, booking.durationMonths ?? 1);
  const monthlyAmount = booking.listing.pricePerMonth.toFixed(2);
  const subscriptionMetadata = buildStripeSubscriptionMetadata({
    bookingId: booking.id,
    renterId: currentUser.renterProfile.id,
    durationMonths: String(durationMonths),
    ...(invoiceId ? { invoiceId } : {}),
  });

  if (isDev) {
    console.log("[checkout] creating session", {
      bookingId: booking.id,
      invoiceId: invoiceId || null,
      renterEmail: booking.renter.user.email,
      monthlyAmount,
      appUrl,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: booking.renter.user.email,
    client_reference_id: booking.id,
    payment_method_types: ["card", "sepa_debit"],
    payment_method_collection: "always",
    success_url: `${appUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}${invoiceId ? `&invoice_id=${invoiceId}` : ""}&booking_id=${booking.id}`,
    cancel_url: `${appUrl}/payments/cancel?${invoiceId ? `invoice_id=${invoiceId}&` : ""}booking_id=${booking.id}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: toStripeMinorUnits(monthlyAmount),
          recurring: {
            interval: "month",
          },
          product_data: {
            name: `Monthly booking for ${booking.listing.title}`,
            description: `Monthly storage charge for ${booking.listing.city}`,
          },
        },
      },
    ],
    subscription_data: {
      metadata: subscriptionMetadata,
    },
    metadata: subscriptionMetadata,
  });

  if (isDev) {
    console.log("[checkout] session created", {
      sessionId: session.id,
      mode: session.mode,
      successUrl: session.success_url,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  }

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
}
