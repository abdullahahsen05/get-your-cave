import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  readStripeCheckoutMetadata,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEBHOOK_REVALIDATION_PATHS = [
  "/invoices",
  "/renter/dashboard",
  "/owner/dashboard",
  "/admin/dashboard",
];

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
  },
  invoices: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
  },
} satisfies Prisma.BookingInclude;

const invoiceInclude = {
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

type WebhookBooking = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type WebhookInvoice = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
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

function buildPaidTimeline(existingTimeline: Prisma.JsonValue | null | undefined, paidAt: Date) {
  const timeline = Array.isArray(existingTimeline) ? [...existingTimeline] : [];
  const paidEntry = {
    key: "paid",
    label: "Paid",
    at: paidAt.toISOString(),
    active: true,
  };
  const paidIndex = timeline.findIndex((item) => {
    return typeof item === "object" && item !== null && "key" in item && (item as { key?: string }).key === "paid";
  });

  if (paidIndex >= 0) {
    timeline[paidIndex] = paidEntry;
  } else {
    timeline.push(paidEntry);
  }

  return timeline;
}

function buildRefundedTimeline(
  existingTimeline: Prisma.JsonValue | null | undefined,
  refundedAt: Date,
) {
  const timeline = Array.isArray(existingTimeline) ? [...existingTimeline] : [];
  const refundedEntry = {
    key: "refunded",
    label: "Refunded",
    at: refundedAt.toISOString(),
    active: true,
  };
  const refundedIndex = timeline.findIndex((item) => {
    return (
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      (item as { key?: string }).key === "refunded"
    );
  });

  if (refundedIndex >= 0) {
    timeline[refundedIndex] = refundedEntry;
  } else {
    timeline.push(refundedEntry);
  }

  return timeline;
}

function getPaymentIntentId(
  session: Stripe.Checkout.Session | Stripe.Charge | Stripe.Refund,
) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

function buildPaymentWhere(params: {
  metadata: ReturnType<typeof readStripeCheckoutMetadata>;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  chargeId?: string | null;
}) {
  const or: Prisma.PaymentWhereInput[] = [];

  if (params.metadata?.paymentId) {
    or.push({ id: params.metadata.paymentId });
  }

  if (params.checkoutSessionId) {
    or.push({ stripeCheckoutSessionId: params.checkoutSessionId });
  }

  if (params.paymentIntentId) {
    or.push({ stripePaymentIntentId: params.paymentIntentId });
  }

  if (params.chargeId) {
    or.push({ stripeChargeId: params.chargeId });
  }

  return or.length ? { OR: or } : null;
}

function logWebhookDebug(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (details) {
    console.info(`[stripe-webhook] ${message}`, details);
    return;
  }

  console.info(`[stripe-webhook] ${message}`);
}

function revalidatePaymentPaths(invoiceId: string) {
  for (const path of WEBHOOK_REVALIDATION_PATHS) {
    revalidatePath(path);
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/storage`);
}

function getStripeObjectChargeId(object: Stripe.Charge | Stripe.Refund) {
  if ("charge" in object) {
    return typeof object.charge === "string"
      ? object.charge
      : object.charge?.id ?? null;
  }

  return object.id;
}

async function getPaymentIntentChargeId(
  stripe: Stripe,
  paymentIntentId: string | null,
) {
  if (!paymentIntentId) {
    return null;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  const latestCharge = paymentIntent.latest_charge;

  return typeof latestCharge === "string" ? latestCharge : latestCharge?.id ?? null;
}

async function findOrCreatePayment(params: {
  booking: WebhookBooking;
  invoice: WebhookInvoice;
  metadata: ReturnType<typeof readStripeCheckoutMetadata>;
  session: Stripe.Checkout.Session;
  paymentIntentId: string | null;
  chargeId: string | null;
}) {
  const paymentWhere = buildPaymentWhere({
    metadata: params.metadata,
    checkoutSessionId: params.session.id,
    paymentIntentId: params.paymentIntentId,
  });

  const existing = paymentWhere
    ? await prisma.payment.findFirst({
        where: paymentWhere,
        select: {
          id: true,
          bookingId: true,
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
          updatedAt: true,
        },
      })
    : null;

  if (existing) {
    return existing;
  }

  const split = calculatePaymentSplit(params.invoice.totalAmount);

  return prisma.payment.create({
    data: {
      bookingId: params.booking.id,
      amount: split.amount,
      currency: params.invoice.currency,
      platformCommission: split.platformCommission,
      ownerAmount: split.ownerAmount,
      status: PaymentStatus.PENDING,
      stripeCheckoutSessionId: params.session.id,
      stripePaymentIntentId: params.paymentIntentId ?? null,
      stripeCustomerId:
        typeof params.session.customer === "string"
          ? params.session.customer
          : params.session.customer?.id ?? null,
      stripeChargeId: params.chargeId,
    },
    select: {
      id: true,
      bookingId: true,
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
      updatedAt: true,
    },
  });
}

async function loadBookingAndInvoice(metadata: ReturnType<typeof readStripeCheckoutMetadata>) {
  if (!metadata) {
    return { booking: null, invoice: null };
  }

  const [booking, invoice] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: bookingInclude,
    }),
    prisma.invoice.findUnique({
      where: { id: metadata.invoiceId },
      include: invoiceInclude,
    }),
  ]);

  return {
    booking: booking as WebhookBooking | null,
    invoice: invoice as WebhookInvoice | null,
  };
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is required." },
      { status: 500 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";
    logWebhookDebug("signature verification failed", {
      message,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logWebhookDebug("event received", {
    eventId: event.id,
    eventType: event.type,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = readStripeCheckoutMetadata(session.metadata);
    const paymentIntentId = getPaymentIntentId(session);
    const chargeId = await getPaymentIntentChargeId(stripe, paymentIntentId);
    const loaded = await loadBookingAndInvoice(metadata);

    logWebhookDebug("checkout.session.completed payload", {
      sessionId: session.id,
      paymentIntentId,
      chargeId,
      hasMetadata: Boolean(metadata),
      hasBooking: Boolean(loaded.booking),
      hasInvoice: Boolean(loaded.invoice),
      bookingId: metadata?.bookingId ?? null,
      invoiceId: metadata?.invoiceId ?? null,
      paymentId: metadata?.paymentId ?? null,
      renterId: metadata?.renterId ?? null,
    });

    if (!metadata || !loaded.booking || !loaded.invoice) {
      logWebhookDebug("checkout.session.completed ignored because metadata or records were missing", {
        sessionId: session.id,
      });
      return NextResponse.json({ received: true });
    }

    const booking = loaded.booking;
    const invoice = loaded.invoice;

    const payment = await findOrCreatePayment({
      booking,
      invoice,
      metadata,
      session,
      paymentIntentId,
      chargeId,
    });

    const paymentSplit = calculatePaymentSplit(invoice.totalAmount);
    const now = new Date();

    try {
      await prisma.$transaction(async (transaction) => {
        const currentPayment = await transaction.payment.findUnique({
          where: { id: payment.id },
        });

        if (currentPayment && currentPayment.status !== PaymentStatus.PAID) {
          const transition = await transaction.payment.updateMany({
            where: {
              id: currentPayment.id,
              status: {
                not: PaymentStatus.PAID,
              },
            },
            data: {
              amount: paymentSplit.amount,
              currency: invoice.currency,
              platformCommission: paymentSplit.platformCommission,
              ownerAmount: paymentSplit.ownerAmount,
              status: PaymentStatus.PAID,
              paidAt: currentPayment.paidAt ?? now,
              failedAt: null,
              refundedAt: null,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? currentPayment.stripeCustomerId ?? null,
              stripeChargeId: chargeId ?? currentPayment.stripeChargeId ?? null,
            },
          });

          if (transition.count > 0) {
            await transaction.ownerProfile.update({
              where: {
                id: booking.ownerId,
              },
              data: {
                walletBalance: {
                  increment: paymentSplit.ownerAmount,
                },
                pendingPayout: {
                  increment: paymentSplit.ownerAmount,
                },
                totalEarnings: {
                  increment: paymentSplit.ownerAmount,
                },
              },
            });
          }
        }

        await transaction.invoice.update({
          where: { id: invoice.id },
          data: {
            paymentId: payment.id,
            status: InvoiceStatus.PAID,
            paidAt: invoice.paidAt ?? now,
            timeline: buildPaidTimeline(invoice.timeline, now),
          },
        });

        if (
          booking.status === BookingStatus.PENDING ||
          booking.status === BookingStatus.APPROVED
        ) {
          await transaction.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.ACTIVE,
              approvedAt: booking.approvedAt ?? now,
            },
          });
        }
      });
    } catch (error) {
      logWebhookDebug("checkout.session.completed failed", {
        sessionId: session.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Unable to confirm paid payment." },
        { status: 500 },
      );
    }

    revalidatePaymentPaths(invoice.id);
    logWebhookDebug("checkout.session.completed applied", {
      sessionId: session.id,
      invoiceId: invoice.id,
      bookingId: booking.id,
      paymentId: payment.id,
    });

    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = readStripeCheckoutMetadata(session.metadata);
    const paymentIntentId = getPaymentIntentId(session);
    const paymentWhere = buildPaymentWhere({
      metadata,
      checkoutSessionId: session.id,
      paymentIntentId,
    });

    if (paymentWhere) {
      await prisma.payment.updateMany({
        where: paymentWhere,
        data: {
          status: PaymentStatus.CANCELLED,
          failedAt: new Date(),
        },
      });

      logWebhookDebug("checkout.session.expired applied", {
        sessionId: session.id,
        paymentIntentId,
      });
    }

    return NextResponse.json({ received: true });
  }

  if (
    event.type === "charge.refunded" ||
    event.type === "refund.created" ||
    event.type === "refund.updated"
  ) {
    const refundObject = event.data.object as Stripe.Charge | Stripe.Refund;
    const metadata = readStripeCheckoutMetadata(refundObject.metadata);
    const paymentIntentId = getPaymentIntentId(refundObject);
    const chargeId = getStripeObjectChargeId(refundObject);
    const paymentWhere = buildPaymentWhere({
      metadata,
      paymentIntentId,
      chargeId,
    });

    if (!paymentWhere) {
      return NextResponse.json({ received: true });
    }

    const currentPayment = await prisma.payment.findFirst({
      where: paymentWhere,
      select: {
        id: true,
        bookingId: true,
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
        updatedAt: true,
      },
    });

    if (!currentPayment) {
      logWebhookDebug("refund ignored because payment was not found", {
        paymentIntentId,
        chargeId,
        hasMetadata: Boolean(metadata),
      });
      return NextResponse.json({ received: true });
    }

    const now = new Date();
    const currentInvoice =
      (metadata?.invoiceId
        ? await prisma.invoice.findUnique({
            where: { id: metadata.invoiceId },
            include: invoiceInclude,
          })
        : null) ??
      (await prisma.invoice.findFirst({
        where: { paymentId: currentPayment.id },
        include: invoiceInclude,
      })) ??
      (await prisma.invoice.findFirst({
        where: { bookingId: currentPayment.bookingId },
        orderBy: [{ createdAt: "desc" as const }],
        include: invoiceInclude,
      }));
    const refundOwnerId =
      currentInvoice?.ownerId ??
      (
        await prisma.booking.findUnique({
          where: { id: currentPayment.bookingId },
          select: { ownerId: true },
        })
      )?.ownerId;

    try {
      await prisma.$transaction(async (transaction) => {
        const transition = await transaction.payment.updateMany({
          where: {
            id: currentPayment.id,
            status: {
              not: PaymentStatus.REFUNDED,
            },
          },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: currentPayment.refundedAt ?? now,
            failedAt: null,
            stripePaymentIntentId: paymentIntentId ?? currentPayment.stripePaymentIntentId,
            stripeChargeId: chargeId ?? currentPayment.stripeChargeId,
          },
        });

        if (transition.count > 0 && refundOwnerId) {
          await transaction.ownerProfile.update({
            where: {
              id: refundOwnerId,
            },
            data: {
              walletBalance: {
                decrement: currentPayment.ownerAmount,
              },
              pendingPayout: {
                decrement: currentPayment.ownerAmount,
              },
              totalEarnings: {
                decrement: currentPayment.ownerAmount,
              },
            },
          });
        }

        if (currentInvoice) {
          await transaction.invoice.update({
            where: { id: currentInvoice.id },
            data: {
              paymentId: currentPayment.id,
              status: InvoiceStatus.REFUNDED,
              timeline: buildRefundedTimeline(currentInvoice.timeline, now),
            },
          });
        }
      });
    } catch (error) {
      logWebhookDebug("refund webhook failed", {
        paymentIntentId,
        chargeId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Unable to process refund webhook." },
        { status: 500 },
      );
    }

    if (currentInvoice) {
      revalidatePaymentPaths(currentInvoice.id);
    }

    logWebhookDebug("refund applied", {
      paymentId: currentPayment.id,
      bookingId: currentPayment.bookingId,
      invoiceId: currentInvoice?.id ?? null,
      paymentIntentId,
      chargeId,
    });

    return NextResponse.json({ received: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = readStripeCheckoutMetadata(paymentIntent.metadata);
    const paymentWhere = buildPaymentWhere({
      metadata,
      paymentIntentId: paymentIntent.id,
    });

    if (paymentWhere) {
      await prisma.payment.updateMany({
        where: paymentWhere,
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      logWebhookDebug("payment_intent.payment_failed applied", {
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "refund.failed" || event.type === "charge.refund.updated") {
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
