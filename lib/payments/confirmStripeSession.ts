import { BookingStatus, InvoiceStatus, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripeClient, readStripeCheckoutMetadata } from "@/lib/stripe";

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

  const metadata = readStripeCheckoutMetadata(session.metadata);
  if (!metadata) return false;

  const paymentIntent = session.payment_intent as Stripe.PaymentIntent | string | null;
  const paymentIntentId =
    typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id ?? null;
  const latestCharge =
    typeof paymentIntent === "string" ? null : paymentIntent?.latest_charge ?? null;
  const chargeId =
    typeof latestCharge === "string" ? latestCharge : latestCharge?.id ?? null;

  const existingPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: metadata.paymentId },
        { stripeCheckoutSessionId: sessionId },
        ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
      ],
    },
    select: {
      id: true,
      bookingId: true,
      status: true,
      ownerAmount: true,
      paidAt: true,
      stripePaymentIntentId: true,
      stripeChargeId: true,
    },
  });

  if (!existingPayment) return false;
  if (existingPayment.status === PaymentStatus.PAID) return true;

  const invoice = await prisma.invoice.findUnique({
    where: { id: metadata.invoiceId },
    select: { id: true, status: true, paidAt: true, timeline: true, ownerId: true },
  });

  if (!invoice) return false;
  if (invoice.status === InvoiceStatus.PAID) return true;

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const transition = await tx.payment.updateMany({
        where: { id: existingPayment.id, status: { not: PaymentStatus.PAID } },
        data: {
          status: PaymentStatus.PAID,
          paidAt: existingPayment.paidAt ?? now,
          failedAt: null,
          stripePaymentIntentId: paymentIntentId ?? existingPayment.stripePaymentIntentId ?? undefined,
          stripeChargeId: chargeId ?? existingPayment.stripeChargeId ?? undefined,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentId: existingPayment.id,
          status: InvoiceStatus.PAID,
          paidAt: invoice.paidAt ?? now,
        },
      });

      await tx.booking.updateMany({
        where: {
          id: existingPayment.bookingId,
          status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        },
        data: { status: BookingStatus.ACTIVE },
      });

      // Only credit the owner if the payment transition actually happened (guard against double-credit from concurrent webhook)
      if (transition.count > 0 && invoice.ownerId) {
        await tx.ownerProfile.update({
          where: { id: invoice.ownerId },
          data: {
            walletBalance: { increment: existingPayment.ownerAmount },
            pendingPayout: { increment: existingPayment.ownerAmount },
            totalEarnings: { increment: existingPayment.ownerAmount },
          },
        });
      }
    });
  } catch {
    return false;
  }

  return true;
}
