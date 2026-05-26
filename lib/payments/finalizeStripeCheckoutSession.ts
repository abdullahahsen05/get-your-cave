import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { readStripeCheckoutMetadata } from "@/lib/stripe";

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

type FinalizeBooking = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type FinalizeInvoice = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

function toDecimal(value: Prisma.Decimal | number | string) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function calculatePaymentSplit(params: {
  grossAmount: Prisma.Decimal | number | string;
  commissionBaseAmount: Prisma.Decimal | number | string;
}) {
  const decimalAmount = toDecimal(params.grossAmount).toDecimalPlaces(2);
  const commissionBaseAmount = toDecimal(params.commissionBaseAmount).toDecimalPlaces(2);
  const platformCommission = commissionBaseAmount.mul(0.12).toDecimalPlaces(2);
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
    return (
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      (item as { key?: string }).key === "paid"
    );
  });

  if (paidIndex >= 0) {
    timeline[paidIndex] = paidEntry;
  } else {
    timeline.push(paidEntry);
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
    booking: booking as FinalizeBooking | null,
    invoice: invoice as FinalizeInvoice | null,
  };
}

async function findOrCreatePayment(params: {
  booking: FinalizeBooking;
  invoice: FinalizeInvoice;
  metadata: ReturnType<typeof readStripeCheckoutMetadata>;
  session: Stripe.Checkout.Session;
  paymentIntentId: string | null;
  chargeId: string | null;
}) {
  const paymentWhere = buildPaymentWhere({
    metadata: params.metadata,
    checkoutSessionId: params.session.id,
    paymentIntentId: params.paymentIntentId,
    chargeId: params.chargeId,
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

  const months = Math.max(1, params.booking.durationMonths ?? 1);
  const commissionBaseAmount = params.booking.monthlyPrice.mul(months).toDecimalPlaces(2);
  const split = calculatePaymentSplit({
    grossAmount: params.invoice.totalAmount,
    commissionBaseAmount,
  });

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

export async function finalizeStripeCheckoutSession(params: {
  stripe: Stripe;
  session: Stripe.Checkout.Session;
  revalidate?: boolean;
}) {
  const metadata = readStripeCheckoutMetadata(params.session.metadata);
  const paymentIntentId = getPaymentIntentId(params.session);
  const chargeId = await getPaymentIntentChargeId(params.stripe, paymentIntentId);
  const loaded = await loadBookingAndInvoice(metadata);

  if (!metadata || !loaded.booking || !loaded.invoice) {
    return {
      applied: false,
      bookingId: null,
      invoiceId: null,
      paymentId: null,
      ownerCredited: false,
    } as const;
  }

  const booking = loaded.booking;
  const invoice = loaded.invoice;

  const payment = await findOrCreatePayment({
    booking,
    invoice,
    metadata,
    session: params.session,
    paymentIntentId,
    chargeId,
  });

  const now = new Date();
  const invoiceMonths = Math.max(1, booking.durationMonths ?? 1);
  const paymentSplit = calculatePaymentSplit({
    grossAmount: invoice.totalAmount,
    commissionBaseAmount: booking.monthlyPrice.mul(invoiceMonths).toDecimalPlaces(2),
  });
  let ownerCredited = false;

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
            stripeCheckoutSessionId: params.session.id,
            stripePaymentIntentId: paymentIntentId,
            stripeCustomerId:
              typeof params.session.customer === "string"
                ? params.session.customer
                : params.session.customer?.id ?? currentPayment.stripeCustomerId ?? null,
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

          ownerCredited = true;
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
  } catch {
    return {
      applied: false,
      bookingId: booking.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      ownerCredited: false,
    } as const;
  }

  if (params.revalidate) {
    for (const path of WEBHOOK_REVALIDATION_PATHS) {
      revalidatePath(path);
    }

    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath("/storage");
  }

  return {
    applied: true,
    bookingId: booking.id,
    invoiceId: invoice.id,
    paymentId: payment.id,
    ownerCredited,
  } as const;
}
