import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { calculateMarketplaceSplit } from "@/lib/marketplace-split";
import { getStripeClient, readStripeSubscriptionMetadata } from "@/lib/stripe";
import { finalizeStripeCheckoutSession } from "@/lib/payments/finalizeStripeCheckoutSession";

const REVALIDATION_PATHS = [
  "/invoices",
  "/renter/dashboard",
  "/owner/dashboard",
  "/admin/dashboard",
];

/**
 * Fallback for subscription-mode checkout sessions:
 * When the webhook has not fired yet (e.g. ngrok URL changed), the success page
 * visit can still finalize local state. Idempotent — the webhook uses the same
 * PAID-status guards so no double-credit occurs.
 */
async function tryFinalizeSubscriptionForSuccessPage(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const metadata = readStripeSubscriptionMetadata(session.metadata);
  if (!metadata?.invoiceId || !metadata?.bookingId) {
    return;
  }

  const localInvoice = await prisma.invoice.findUnique({
    where: { id: metadata.invoiceId },
    select: { id: true, status: true, bookingId: true, currency: true },
  });

  // Already finalized — nothing to do.
  if (!localInvoice || localInvoice.status === InvoiceStatus.PAID) {
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null;

  if (!subscriptionId) {
    return;
  }

  // Get the Stripe subscription's latest invoice to confirm payment.
  const invoiceList = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
  const rawStripeInvoice = invoiceList.data[0];
  if (!rawStripeInvoice || rawStripeInvoice.status !== "paid") {
    return;
  }

  // Cast to access fields that exist at runtime but are not in all SDK type definitions.
  const stripeInvoice = rawStripeInvoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
    customer?: string | Stripe.Customer | null;
    amount_paid?: number | null;
  };

  const amountPaid = new Prisma.Decimal(stripeInvoice.amount_paid ?? 0)
    .div(100)
    .toDecimalPlaces(2);
  const split = calculateMarketplaceSplit(amountPaid, amountPaid);
  const now = new Date();

  const paymentIntentId =
    typeof stripeInvoice.payment_intent === "string"
      ? stripeInvoice.payment_intent
      : (stripeInvoice.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  const customerId =
    typeof stripeInvoice.customer === "string"
      ? stripeInvoice.customer
      : (stripeInvoice.customer as Stripe.Customer | null)?.id ?? null;

  await prisma.$transaction(async (tx) => {
    // Find or create the local Payment record.
    const existingPayment = await tx.payment.findFirst({
      where: {
        OR: [
          ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
          { stripeCheckoutSessionId: session.id },
        ],
      },
    });

    const payment =
      existingPayment ??
      (await tx.payment.create({
        data: {
          bookingId: localInvoice.bookingId,
          amount: split.amount,
          currency: stripeInvoice.currency,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          status: PaymentStatus.PAID,
          paidAt: now,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId: customerId,
        },
      }));

    // Mark payment PAID if not already (idempotent).
    if (existingPayment && existingPayment.status !== PaymentStatus.PAID) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          amount: split.amount,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId: customerId,
        },
      });

      // Credit owner wallet (same guard as webhook handler).
      const booking = await tx.booking.findUnique({
        where: { id: localInvoice.bookingId },
        select: { ownerId: true },
      });
      if (booking) {
        await tx.ownerProfile.update({
          where: { id: booking.ownerId },
          data: {
            walletBalance: { increment: split.ownerAmount },
            pendingPayout: { increment: split.ownerAmount },
            totalEarnings: { increment: split.ownerAmount },
          },
        });
      }
    }

    // Mark invoice PAID.
    await tx.invoice.update({
      where: { id: localInvoice.id },
      data: {
        paymentId: payment.id,
        status: InvoiceStatus.PAID,
        paidAt: now,
      },
    });

    // Activate booking if still PENDING/APPROVED.
    await tx.booking.updateMany({
      where: {
        id: localInvoice.bookingId,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
      },
      data: { status: BookingStatus.ACTIVE, approvedAt: now },
    });
  });

  for (const path of REVALIDATION_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(`/invoices/${localInvoice.id}`);
}

export async function confirmStripeSessionIfPaid(sessionId: string): Promise<boolean> {
  const stripe = getStripeClient();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge"],
    });
  } catch {
    return false;
  }

  if (session.payment_status !== "paid") {
    return false;
  }

  if (session.mode === "subscription") {
    // Best-effort fallback sync so local DB reflects payment even before webhook fires.
    try {
      await tryFinalizeSubscriptionForSuccessPage(stripe, session);
    } catch {
      // If sync fails, Stripe still confirmed payment — webhook will eventually catch up.
    }
    return true;
  }

  const result = await finalizeStripeCheckoutSession({
    stripe,
    session,
    revalidate: false,
  });

  return result.applied;
}
