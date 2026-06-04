import Stripe from "stripe";
import { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { createNotificationForUser } from "@/lib/notifications";

function buildRefundedTimeline(
  existing: Prisma.JsonValue | null | undefined,
  refundedAt: Date,
) {
  const timeline = Array.isArray(existing) ? [...existing] : [];
  const entry = { key: "refunded", label: "Refunded", at: refundedAt.toISOString(), active: true };
  const idx = timeline.findIndex(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      (item as { key?: string }).key === "refunded",
  );
  if (idx >= 0) {
    timeline[idx] = entry;
  } else {
    timeline.push(entry);
  }
  return timeline;
}

/**
 * Checks Stripe for a refund on a PAID invoice and syncs local DB if one is found.
 * Returns true if the invoice was updated to REFUNDED.
 *
 * Tries payment intent lookup first, then charge ID lookup as a fallback.
 * This handles both cases: payment intent ID stored (normal flow) and
 * only charge ID stored (some edge cases).
 */
export async function syncInvoiceRefundStatusFromStripe(
  invoiceId: string,
): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      status: true,
      ownerId: true,
      timeline: true,
      invoiceNumber: true,
      bookingId: true,
      payment: {
        select: {
          id: true,
          status: true,
          ownerAmount: true,
          refundedAt: true,
          stripePaymentIntentId: true,
          stripeChargeId: true,
          bookingId: true,
        },
      },
    },
  });

  if (!invoice || invoice.status !== InvoiceStatus.PAID) {
    return false;
  }

  const payment = invoice.payment;
  if (!payment) {
    return false;
  }

  if (payment.status === PaymentStatus.REFUNDED) {
    return false;
  }

  const paymentIntentId = payment.stripePaymentIntentId;
  const storedChargeId = payment.stripeChargeId;

  // Need at least one Stripe ID to look up the refund state.
  if (!paymentIntentId && !storedChargeId) {
    return false;
  }

  let refunded = false;

  try {
    const stripe = getStripeClient();
    let charge: Stripe.Charge | null = null;

    if (paymentIntentId) {
      // Primary path: look up via payment intent, get its latest charge.
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });

      charge =
        typeof pi.latest_charge === "object" && pi.latest_charge !== null
          ? (pi.latest_charge as Stripe.Charge)
          : null;
    } else if (storedChargeId) {
      // Fallback: look up the charge directly.
      charge = await stripe.charges.retrieve(storedChargeId);
    }

    if (!charge || !charge.refunded) {
      return false;
    }

    const now = new Date();
    const resolvedChargeId = charge.id;

    const ownerId =
      invoice.ownerId ??
      (
        await prisma.booking.findUnique({
          where: { id: invoice.bookingId },
          select: { ownerId: true },
        })
      )?.ownerId;

    let walletReverted = false;

    await prisma.$transaction(async (tx) => {
      const transition = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: PaymentStatus.REFUNDED },
        },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: now,
          failedAt: null,
          ...(resolvedChargeId ? { stripeChargeId: resolvedChargeId } : {}),
        },
      });

      if (transition.count > 0 && ownerId) {
        await tx.ownerProfile.update({
          where: { id: ownerId },
          data: {
            walletBalance: { decrement: payment.ownerAmount },
            pendingPayout: { decrement: payment.ownerAmount },
            totalEarnings: { decrement: payment.ownerAmount },
          },
        });
        walletReverted = true;
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.REFUNDED,
          timeline: buildRefundedTimeline(invoice.timeline, now),
        },
      });

      refunded = transition.count > 0;
    });

    if (refunded) {
      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/renter/dashboard");
      revalidatePath("/owner/dashboard");

      await sendRefundNotificationsForInvoice({
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        walletReverted,
      }).catch(() => {
        // non-fatal — notification failure must not prevent the sync
      });
    }
  } catch {
    return false;
  }

  return refunded;
}

async function sendRefundNotificationsForInvoice(params: {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  walletReverted: boolean;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: {
      booking: {
        select: {
          listing: { select: { title: true } },
          owner: { select: { userId: true } },
          renter: { select: { userId: true } },
        },
      },
    },
  });

  if (!payment) {
    return;
  }

  await createNotificationForUser({
    userId: payment.booking.renter.userId,
    title: "Payment refunded",
    body: `Your payment for invoice ${params.invoiceNumber} has been refunded.`,
    linkUrl: `/invoices/${params.invoiceId}`,
  });

  if (params.walletReverted) {
    await createNotificationForUser({
      userId: payment.booking.owner.userId,
      title: "Refund processed",
      body: `A payment for ${payment.booking.listing.title} was refunded and your balance was adjusted.`,
      linkUrl: "/owner/dashboard",
    });
  }
}

/**
 * Syncs refund status for the viewer's most-recently paid invoices (up to 5,
 * paid within the last 30 days). Called before rendering the invoices list so
 * the list reflects refunds even when the Stripe webhook was not delivered.
 *
 * Returns the number of invoices that were updated to REFUNDED.
 */
export async function syncRecentPaidInvoicesRefundStatus(viewer: {
  role: string;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
}): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const whereClause: Prisma.InvoiceWhereInput = {
    status: InvoiceStatus.PAID,
    updatedAt: { gte: thirtyDaysAgo },
    payment: {
      OR: [
        { stripePaymentIntentId: { not: null } },
        { stripeChargeId: { not: null } },
      ],
    },
  };

  if (viewer.role === "RENTER" && viewer.renterProfileId) {
    whereClause.renterId = viewer.renterProfileId;
  } else if (viewer.role === "OWNER" && viewer.ownerProfileId) {
    whereClause.ownerId = viewer.ownerProfileId;
  } else if (viewer.role !== "ADMIN") {
    return 0;
  }

  const candidates = await prisma.invoice.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true },
  });

  if (candidates.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    candidates.map((inv) => syncInvoiceRefundStatusFromStripe(inv.id)),
  );

  return results.filter(
    (r): r is PromiseFulfilledResult<boolean> => r.status === "fulfilled" && r.value === true,
  ).length;
}
