import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateInvoiceForBookingIdIfNeeded } from "@/lib/invoices/generateInvoice";
import { prisma } from "@/lib/prisma";
import {
  buildStripeCheckoutMetadata,
  getAppUrl,
  getStripeClient,
  toStripeMinorUnits,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const invoiceInclude = {
  booking: {
    include: {
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
      },
      invoices: {
        orderBy: [{ createdAt: "desc" as const }],
        take: 1,
      },
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      platformCommission: true,
      ownerAmount: true,
      stripeCheckoutSessionId: true,
      stripePaymentIntentId: true,
      stripeCustomerId: true,
      stripeChargeId: true,
      paidAt: true,
      failedAt: true,
      refundedAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.InvoiceInclude;

const bookingInclude = {
  listing: {
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
      },
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
  },
  invoices: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
  },
} satisfies Prisma.BookingInclude;

type CheckoutInvoice = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

type CheckoutBooking = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

function toDecimal(value: Prisma.Decimal | number | string) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function calculatePaymentSplit(amount: Prisma.Decimal | number | string) {
  const decimalAmount = toDecimal(amount).toDecimalPlaces(2);
  const platformCommission = decimalAmount.mul(0.2).toDecimalPlaces(2);
  const ownerAmount = decimalAmount.sub(platformCommission).toDecimalPlaces(2);

  return {
    amount: decimalAmount,
    platformCommission,
    ownerAmount,
  };
}

function bookingIsEligibleForPayment(status: BookingStatus) {
  return status === BookingStatus.APPROVED || status === BookingStatus.ACTIVE;
}

function getPaymentAmount(invoice: CheckoutInvoice) {
  return toDecimal(invoice.totalAmount).toDecimalPlaces(2);
}

function getCurrentPayment(invoice: CheckoutInvoice, booking: CheckoutBooking) {
  return invoice.payment ?? booking.payments[0] ?? null;
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

  let invoice: CheckoutInvoice | null = null;
  let booking: CheckoutBooking | null = null;

  if (invoiceId) {
    invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceInclude,
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 },
      );
    }

    booking = invoice.booking as CheckoutBooking;
  }

  if (bookingId) {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    if (invoice && invoice.bookingId !== booking.id) {
      return NextResponse.json(
        { error: "Invoice and booking do not match." },
        { status: 400 },
      );
    }
  }

  if (!booking || !invoice) {
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

    const generated = await generateInvoiceForBookingIdIfNeeded(booking.id);

    if (!generated) {
      return NextResponse.json(
        { error: "Unable to prepare an invoice for this booking." },
        { status: 400 },
      );
    }

    invoice = await prisma.invoice.findUnique({
      where: { id: generated.id },
      include: invoiceInclude,
    });
  }

  if (!invoice || !booking) {
    return NextResponse.json(
      { error: "Unable to load payment details." },
      { status: 400 },
    );
  }

  if (invoice.renterId !== currentUser.renterProfile.id || booking.renterId !== currentUser.renterProfile.id) {
    return NextResponse.json(
      { error: "You can only pay for your own invoices." },
      { status: 403 },
    );
  }

  if (!bookingIsEligibleForPayment(booking.status)) {
    return NextResponse.json(
      { error: "This booking is not eligible for payment yet." },
      { status: 409 },
    );
  }

  if (invoice.status === InvoiceStatus.PAID || invoice.payment?.status === PaymentStatus.PAID || booking.payments[0]?.status === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "This invoice is already paid." },
      { status: 409 },
    );
  }

  const paymentAmount = getPaymentAmount(invoice);
  const split = calculatePaymentSplit(paymentAmount);

  const payment = await prisma.$transaction(async (transaction) => {
    const currentPayment = getCurrentPayment(invoice!, booking!);

    if (currentPayment?.status === PaymentStatus.PAID) {
      return null;
    }

    if (currentPayment) {
      const updated = await transaction.payment.update({
        where: { id: currentPayment.id },
        data: {
          amount: split.amount,
          currency: invoice!.currency,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          status: PaymentStatus.PENDING,
          paidAt: null,
          failedAt: null,
          refundedAt: null,
        },
      });

      if (invoice!.paymentId !== updated.id) {
        await transaction.invoice.update({
          where: { id: invoice!.id },
          data: {
            paymentId: updated.id,
          },
        });
      }

      return updated;
    }

    const created = await transaction.payment.create({
      data: {
        bookingId: booking!.id,
        amount: split.amount,
        currency: invoice!.currency,
        platformCommission: split.platformCommission,
        ownerAmount: split.ownerAmount,
        status: PaymentStatus.PENDING,
      },
    });

    await transaction.invoice.update({
      where: { id: invoice!.id },
      data: {
        paymentId: created.id,
      },
    });

    return created;
  });

  if (!payment) {
    return NextResponse.json(
      { error: "This invoice is already paid." },
      { status: 409 },
    );
  }

  const stripe = getStripeClient();
  const appUrl = getAppUrl(request);
  const metadata = buildStripeCheckoutMetadata({
    bookingId: booking.id,
    invoiceId: invoice.id,
    paymentId: payment.id,
    renterId: currentUser.renterProfile.id,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.renter.user.email,
    client_reference_id: payment.id,
    success_url: `${appUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}&booking_id=${booking.id}`,
    cancel_url: `${appUrl}/payments/cancel?invoice_id=${invoice.id}&booking_id=${booking.id}`,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: toStripeMinorUnits(split.amount),
          product_data: {
            name: `Booking payment for ${booking.listing.title}`,
            description: `Storage booking payment for ${booking.listing.city}`,
          },
        },
      },
    ],
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeCheckoutSessionId: session.id,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
}
