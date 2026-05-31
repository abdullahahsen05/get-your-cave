import { BookingStatus, InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateMarketplaceSplit } from "@/lib/marketplace-split";
import { createNotificationForUser } from "@/lib/notifications";
import { finalizeStripeCheckoutSession } from "@/lib/payments/finalizeStripeCheckoutSession";
import {
  getStripeClient,
  readStripeCheckoutMetadata,
  readStripeSubscriptionMetadata,
} from "@/lib/stripe";
import { generateInvoiceNumber } from "@/lib/invoices/invoiceNumber";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEBHOOK_REVALIDATION_PATHS = [
  "/invoices",
  "/renter/dashboard",
  "/owner/dashboard",
  "/admin/dashboard",
];

function getPaymentIntentId(
  session: Stripe.Checkout.Session | Stripe.Charge | Stripe.Refund,
) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

function getStripeObjectChargeId(object: Stripe.Charge | Stripe.Refund) {
  if ("charge" in object) {
    return typeof object.charge === "string"
      ? object.charge
      : object.charge?.id ?? null;
  }

  return object.id;
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

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
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

async function sendPaymentSuccessNotifications(params: {
  paymentId: string | null;
  ownerCredited: boolean;
}) {
  if (!params.paymentId) {
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: {
      booking: {
        select: {
          bookingNumber: true,
          owner: {
            select: { userId: true },
          },
          renter: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!payment) {
    return;
  }

  await createNotificationForUser({
    userId: payment.booking.renter.userId,
    title: "Payment received",
    body: `Your payment for booking ${payment.booking.bookingNumber} was received.`,
    linkUrl: "/invoices",
  });

  if (params.ownerCredited) {
    await createNotificationForUser({
      userId: payment.booking.owner.userId,
      title: "Owner payout completed",
      body: `Your payout for booking ${payment.booking.bookingNumber} was added to your owner balance.`,
      linkUrl: "/owner/dashboard",
    });
  }
}

function getStripeWebhookSecrets() {
  const primary = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const fallbackList = process.env.STRIPE_WEBHOOK_SECRETS?.split(",") ?? [];

  return Array.from(
    new Set(
      [primary, ...fallbackList]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && value.startsWith("whsec_"))),
    ),
  );
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

function revalidatePaymentPaths(invoiceId: string) {
  for (const path of WEBHOOK_REVALIDATION_PATHS) {
    revalidatePath(path);
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/storage");
}

type RecurringBookingSnapshot = {
  id: string;
  ownerId: string;
  renterId: string;
  status: BookingStatus;
  durationMonths: number | null;
  monthlyPrice: Prisma.Decimal;
  approvedAt: Date | null;
};

async function loadBookingForRecurringSubscription(stripe: Stripe, subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = readStripeSubscriptionMetadata(subscription.metadata);

  if (!metadata) {
    return null;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: metadata.bookingId },
    include: {
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
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          storageType: true,
          pricePerMonth: true,
        },
      },
    },
  });

  if (!booking) {
    if (metadata.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: metadata.invoiceId },
        select: {
          bookingId: true,
        },
      });

      if (invoice) {
        const bookingByInvoice = await prisma.booking.findUnique({
          where: { id: invoice.bookingId },
          include: {
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
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
                address: true,
                storageType: true,
                pricePerMonth: true,
              },
            },
          },
        });

        if (bookingByInvoice) {
          return {
            booking: bookingByInvoice,
            metadata,
            subscription,
          };
        }
      }
    }

    return null;
  }

  return {
    booking,
    metadata,
    subscription,
  };
}

async function syncRecurringInvoiceFromStripe(params: {
  stripe: Stripe;
  invoice: Stripe.Invoice;
  invoiceStatus: InvoiceStatus;
  paymentStatus: PaymentStatus;
  booking?: RecurringBookingSnapshot | null;
}) {
  const invoice = params.invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    payment_intent?: string | Stripe.PaymentIntent | null;
    customer?: string | Stripe.Customer | null;
    amount_paid?: number | null;
    amount_due?: number | null;
    total?: number | null;
    created?: number | null;
  };
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  if (!subscriptionId) {
    return {
      applied: false,
      bookingId: null,
      invoiceId: null,
      paymentId: null,
      ownerCredited: false,
    } as const;
  }

  const loaded = params.booking
    ? ({
        booking: params.booking,
        metadata: null,
        subscription: null,
      } as const)
    : await loadBookingForRecurringSubscription(params.stripe, subscriptionId);
  if (!loaded) {
    return {
      applied: false,
      bookingId: null,
      invoiceId: null,
      paymentId: null,
      ownerCredited: false,
    } as const;
  }

  const paymentIntentId =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    return {
      applied: false,
      bookingId: loaded.booking.id,
      invoiceId: null,
      paymentId: null,
      ownerCredited: false,
    } as const;
  }

  const amountSource =
    params.paymentStatus === PaymentStatus.PAID
      ? invoice.amount_paid
      : invoice.amount_due || invoice.total || invoice.amount_paid;
  const amount = new Prisma.Decimal(amountSource ?? 0).div(100).toDecimalPlaces(2);
  const split = calculateMarketplaceSplit(amount, amount);
  const now = new Date();
  let invoiceRecordId: string | null = null;
  let paymentRecordId: string | null = null;
  let ownerCredited = false;

  await prisma.$transaction(async (transaction) => {
    const existingPayment = await transaction.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    let currentPayment = existingPayment;

    if (existingPayment) {
      const transition = await transaction.payment.updateMany({
        where: {
          id: existingPayment.id,
          status: {
            not: params.paymentStatus,
          },
        },
        data: {
          amount: split.amount,
          currency: params.invoice.currency,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          status: params.paymentStatus,
          paidAt:
            params.paymentStatus === PaymentStatus.PAID
              ? existingPayment.paidAt ?? now
              : null,
          failedAt:
            params.paymentStatus === PaymentStatus.FAILED ? now : null,
          refundedAt: null,
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId:
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null,
        },
      });

      if (transition.count > 0) {
        currentPayment = await transaction.payment.findUnique({
          where: { id: existingPayment.id },
        });

        if (params.paymentStatus === PaymentStatus.PAID) {
          await transaction.ownerProfile.update({
            where: {
              id: loaded.booking.ownerId,
            },
            data: {
              walletBalance: {
                increment: split.ownerAmount,
              },
              pendingPayout: {
                increment: split.ownerAmount,
              },
              totalEarnings: {
                increment: split.ownerAmount,
              },
            },
          });

          ownerCredited = true;
        }
      }
    } else {
      currentPayment = await transaction.payment.create({
        data: {
          bookingId: loaded.booking.id,
          amount: split.amount,
          currency: params.invoice.currency,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          status: params.paymentStatus,
          paidAt:
            params.paymentStatus === PaymentStatus.PAID ? now : null,
          failedAt:
            params.paymentStatus === PaymentStatus.FAILED ? now : null,
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId:
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null,
        },
      });

      if (params.paymentStatus === PaymentStatus.PAID) {
        await transaction.ownerProfile.update({
          where: {
            id: loaded.booking.ownerId,
          },
          data: {
            walletBalance: {
              increment: split.ownerAmount,
            },
            pendingPayout: {
              increment: split.ownerAmount,
            },
            totalEarnings: {
              increment: split.ownerAmount,
            },
          },
        });

        ownerCredited = true;
      }
    }

    if (!currentPayment) {
      return;
    }

    paymentRecordId = currentPayment.id;

    const currentInvoice = await transaction.invoice.findFirst({
      where: { paymentId: currentPayment.id },
      include: {
        payment: true,
      },
    });

    const invoiceNumber = currentInvoice?.invoiceNumber ?? (await generateInvoiceNumber());
    const issuedAt =
      currentInvoice?.issuedAt ??
      new Date((invoice.created ?? Math.floor(now.getTime() / 1000)) * 1000);
    const dueAt =
      currentInvoice?.dueAt ??
      (params.paymentStatus === PaymentStatus.PAID ? issuedAt : null);

    const invoicePayload = {
      invoiceNumber,
      bookingId: loaded.booking.id,
      paymentId: currentPayment.id,
      ownerId: loaded.booking.ownerId,
      renterId: loaded.booking.renterId,
      subtotal: split.amount,
      platformFee: split.platformCommission,
      taxAmount: new Prisma.Decimal(0),
      totalAmount: split.amount,
      currency: params.invoice.currency,
      status: params.invoiceStatus,
      issuedAt,
      dueAt,
      timeline:
        params.invoiceStatus === InvoiceStatus.PAID
          ? [
              {
                key: "generated",
                label: "Generated",
                at: issuedAt.toISOString(),
                active: true,
              },
              {
                key: "issued",
                label: "Issued",
                at: issuedAt.toISOString(),
                active: true,
              },
              {
                key: "due",
                label: "Due",
                at: dueAt?.toISOString() ?? null,
                active: Boolean(dueAt),
              },
              {
                key: "paid",
                label: "Paid",
                at: now.toISOString(),
                active: true,
              },
            ]
          : [
              {
                key: "generated",
                label: "Generated",
                at: issuedAt.toISOString(),
                active: true,
              },
              {
                key: "issued",
                label: "Issued",
                at: issuedAt.toISOString(),
                active: true,
              },
              {
                key: "due",
                label: "Due",
                at: dueAt?.toISOString() ?? null,
                active: Boolean(dueAt),
              },
            ],
    };

    if (currentInvoice) {
      const updatedInvoice = await transaction.invoice.update({
        where: { id: currentInvoice.id },
        data: invoicePayload,
      });

      await transaction.invoiceItem.deleteMany({
        where: { invoiceId: updatedInvoice.id },
      });

      await transaction.invoiceItem.createMany({
        data: [
          {
            invoiceId: updatedInvoice.id,
            description: "Monthly rental charge",
            quantity: 1,
            unitPrice: split.amount,
            total: split.amount,
          },
        ],
      });

      invoiceRecordId = updatedInvoice.id;
    } else {
      const createdInvoice = await transaction.invoice.create({
        data: invoicePayload,
      });

      await transaction.invoiceItem.createMany({
        data: [
          {
            invoiceId: createdInvoice.id,
            description: "Monthly rental charge",
            quantity: 1,
            unitPrice: split.amount,
            total: split.amount,
          },
        ],
      });

      invoiceRecordId = createdInvoice.id;
    }

    if (
      params.paymentStatus === PaymentStatus.PAID &&
      (loaded.booking.status === BookingStatus.PENDING ||
        loaded.booking.status === BookingStatus.APPROVED)
    ) {
      await transaction.booking.update({
        where: {
          id: loaded.booking.id,
        },
        data: {
          status: BookingStatus.ACTIVE,
          approvedAt: loaded.booking.approvedAt ?? now,
        },
      });
    }
  });

  if (invoiceRecordId) {
    revalidatePaymentPaths(invoiceRecordId);
  }

  if (params.paymentStatus === PaymentStatus.FAILED) {
    await createNotificationForUser({
      userId: loaded.booking.renterId,
      title: "Payment failed",
      body: "Your recurring booking payment could not be processed. Please update your payment method.",
      linkUrl: "/invoices",
    });
  }

  return {
    applied: Boolean(invoiceRecordId),
    bookingId: loaded.booking.id,
    invoiceId: invoiceRecordId,
    paymentId: paymentRecordId,
    ownerCredited,
  } as const;
}

async function applyRecurringCheckoutRecovery(params: {
  booking: RecurringBookingSnapshot;
  localInvoiceId: string;
  stripeInvoice: Stripe.Invoice;
  sessionId: string;
}) {
  const stripeInvoice = params.stripeInvoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
    customer?: string | Stripe.Customer | null;
    amount_paid?: number | null;
    amount_due?: number | null;
    total?: number | null;
  };

  const amountSource =
    stripeInvoice.amount_paid ??
    stripeInvoice.amount_due ??
    stripeInvoice.total ??
    0;
  const amount = new Prisma.Decimal(amountSource).div(100).toDecimalPlaces(2);
  const split = calculateMarketplaceSplit(amount, amount);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const currentInvoice = await transaction.invoice.findUnique({
      where: { id: params.localInvoiceId },
      include: {
        payment: true,
      },
    });

    if (!currentInvoice) {
      return {
        applied: false,
        bookingId: params.booking.id,
        invoiceId: null,
        paymentId: null,
        ownerCredited: false,
      } as const;
    }

    if (currentInvoice.status === InvoiceStatus.PAID) {
      return {
        applied: false,
        bookingId: params.booking.id,
        invoiceId: currentInvoice.id,
        paymentId: currentInvoice.paymentId,
        ownerCredited: false,
      } as const;
    }

    const existingPayment = currentInvoice.paymentId
      ? await transaction.payment.findUnique({
          where: { id: currentInvoice.paymentId },
        })
      : await transaction.payment.findFirst({
          where: { stripeCheckoutSessionId: params.sessionId },
        });

    const payment =
      existingPayment ??
      (await transaction.payment.create({
        data: {
          bookingId: params.booking.id,
          amount: split.amount,
          currency: params.stripeInvoice.currency,
          platformCommission: split.platformCommission,
          ownerAmount: split.ownerAmount,
          status: PaymentStatus.PAID,
          paidAt: now,
          stripeCheckoutSessionId: params.sessionId,
          stripePaymentIntentId:
          typeof stripeInvoice.payment_intent === "string"
              ? stripeInvoice.payment_intent
              : stripeInvoice.payment_intent?.id ?? null,
          stripeCustomerId:
            typeof stripeInvoice.customer === "string"
              ? stripeInvoice.customer
              : stripeInvoice.customer?.id ?? null,
        },
      }));

    await transaction.payment.updateMany({
      where: {
        id: payment.id,
        status: {
          not: PaymentStatus.PAID,
        },
      },
      data: {
        amount: split.amount,
        currency: stripeInvoice.currency,
        platformCommission: split.platformCommission,
        ownerAmount: split.ownerAmount,
        status: PaymentStatus.PAID,
        paidAt: now,
        stripeCheckoutSessionId: params.sessionId,
        stripePaymentIntentId:
          typeof stripeInvoice.payment_intent === "string"
            ? stripeInvoice.payment_intent
            : stripeInvoice.payment_intent?.id ?? null,
        stripeCustomerId:
          typeof stripeInvoice.customer === "string"
            ? stripeInvoice.customer
            : stripeInvoice.customer?.id ?? null,
      },
    });

    const invoicePayload = {
      paymentId: payment.id,
      ownerId: params.booking.ownerId,
      renterId: params.booking.renterId,
      subtotal: split.amount,
      platformFee: split.platformCommission,
      taxAmount: new Prisma.Decimal(0),
      totalAmount: split.amount,
      currency: stripeInvoice.currency,
      status: InvoiceStatus.PAID,
      paidAt: now,
      dueAt: currentInvoice.dueAt ?? currentInvoice.issuedAt ?? now,
      timeline: [
        {
          key: "generated",
          label: "Generated",
          at: (currentInvoice.issuedAt ?? now).toISOString(),
          active: true,
        },
        {
          key: "issued",
          label: "Issued",
          at: (currentInvoice.issuedAt ?? now).toISOString(),
          active: true,
        },
        {
          key: "due",
          label: "Due",
          at: (currentInvoice.dueAt ?? currentInvoice.issuedAt ?? now).toISOString(),
          active: true,
        },
        {
          key: "paid",
          label: "Paid",
          at: now.toISOString(),
          active: true,
        },
      ],
    };

    await transaction.invoice.update({
      where: { id: currentInvoice.id },
      data: invoicePayload,
    });

    await transaction.invoiceItem.deleteMany({
      where: { invoiceId: currentInvoice.id },
    });

    await transaction.invoiceItem.createMany({
      data: [
        {
          invoiceId: currentInvoice.id,
          description: "Total amount",
          quantity: 1,
          unitPrice: split.amount,
          total: split.amount,
        },
      ],
    });

    if (
      params.booking.status === BookingStatus.PENDING ||
      params.booking.status === BookingStatus.APPROVED
    ) {
      await transaction.booking.update({
        where: { id: params.booking.id },
        data: {
          status: BookingStatus.ACTIVE,
          approvedAt: params.booking.approvedAt ?? now,
        },
      });
    }

    await transaction.ownerProfile.update({
      where: { id: params.booking.ownerId },
      data: {
        walletBalance: { increment: split.ownerAmount },
        pendingPayout: { increment: split.ownerAmount },
        totalEarnings: { increment: split.ownerAmount },
      },
    });

    revalidatePaymentPaths(currentInvoice.id);

    return {
      applied: true,
      bookingId: params.booking.id,
      invoiceId: currentInvoice.id,
      paymentId: payment.id,
      ownerCredited: true,
    } as const;
  });
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const webhookSecrets = getStripeWebhookSecrets();

  let event: Stripe.Event | null = null;

  try {
    if (webhookSecrets.length === 0) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required.");
    }

    let lastError: unknown = null;

    for (const candidateSecret of webhookSecrets) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, candidateSecret);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!event) {
      throw lastError ?? new Error("Invalid Stripe webhook.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";
    logWebhookDebug("signature verification failed", {
      message,
      candidateSecrets: webhookSecrets.length,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const verifiedEvent = event;
  logWebhookDebug("event received", {
    eventId: verifiedEvent.id,
    eventType: verifiedEvent.type,
  });

  if (
    verifiedEvent.type === "checkout.session.completed" ||
    verifiedEvent.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = verifiedEvent.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (subscriptionId) {
        const loaded = await loadBookingForRecurringSubscription(stripe, subscriptionId);

        if (loaded) {
          const durationMonths = Math.max(
            1,
            Number(loaded.metadata.durationMonths) || loaded.booking.durationMonths || 1,
          );
          const cancelAt = Math.floor(addMonths(new Date(), durationMonths).getTime() / 1000);

          await stripe.subscriptions.update(subscriptionId, {
            cancel_at: cancelAt,
            metadata: {
              ...loaded.metadata,
              subscriptionId,
            },
          });

          const latestInvoices = await stripe.invoices.list({
            subscription: subscriptionId,
            limit: 1,
          });
          const latestInvoice = latestInvoices.data[0] ?? null;

          if (latestInvoice) {
            const initialInvoiceStatus =
              latestInvoice.status === "paid"
                ? InvoiceStatus.PAID
                : InvoiceStatus.ISSUED;
          const initialPaymentStatus =
              latestInvoice.status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING;

          const initialResult = await syncRecurringInvoiceFromStripe({
            stripe,
            invoice: latestInvoice,
            invoiceStatus: initialInvoiceStatus,
            paymentStatus: initialPaymentStatus,
            booking: loaded.booking,
          });

          if (initialResult.applied && initialPaymentStatus === PaymentStatus.PAID) {
            await sendPaymentSuccessNotifications({
              paymentId: initialResult.paymentId,
              ownerCredited: initialResult.ownerCredited,
            });
          }

          logWebhookDebug("subscription checkout invoice synced", {
            sessionId: session.id,
            subscriptionId,
            bookingId: initialResult.bookingId,
            invoiceId: initialResult.invoiceId,
            applied: initialResult.applied,
            paymentId: initialResult.paymentId,
            ownerCredited: initialResult.ownerCredited,
          });

          if (!initialResult.applied && loaded.metadata.invoiceId) {
            const recoveryResult = await applyRecurringCheckoutRecovery({
              booking: loaded.booking,
              localInvoiceId: loaded.metadata.invoiceId,
              stripeInvoice: latestInvoice,
              sessionId: session.id,
            });

            if (recoveryResult.applied && initialPaymentStatus === PaymentStatus.PAID) {
              await sendPaymentSuccessNotifications({
                paymentId: recoveryResult.paymentId,
                ownerCredited: recoveryResult.ownerCredited,
              });
            }

            logWebhookDebug("subscription checkout recovery applied", {
              sessionId: session.id,
              subscriptionId,
              bookingId: recoveryResult.bookingId,
              invoiceId: recoveryResult.invoiceId,
              applied: recoveryResult.applied,
              paymentId: recoveryResult.paymentId,
              ownerCredited: recoveryResult.ownerCredited,
            });
          }
        }

          logWebhookDebug("subscription checkout completed", {
            sessionId: session.id,
            subscriptionId,
            bookingId: loaded.booking.id,
            cancelAt: new Date(cancelAt * 1000).toISOString(),
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    const result = await finalizeStripeCheckoutSession({
      stripe,
      session,
      revalidate: true,
    });

    if (result.applied) {
      await sendPaymentSuccessNotifications({
        paymentId: result.paymentId,
        ownerCredited: result.ownerCredited,
      });
    }

    logWebhookDebug("checkout session finalized", {
      sessionId: session.id,
      applied: result.applied,
      invoiceId: result.invoiceId,
      bookingId: result.bookingId,
      paymentId: result.paymentId,
      ownerCredited: result.ownerCredited,
    });

    return NextResponse.json({ received: true });
  }

  if (verifiedEvent.type === "checkout.session.expired") {
    const session = verifiedEvent.data.object as Stripe.Checkout.Session;
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
    verifiedEvent.type === "invoice.finalized" ||
    verifiedEvent.type === "invoice.payment_action_required" ||
    verifiedEvent.type === "invoice.payment_failed" ||
    verifiedEvent.type === "invoice.payment_succeeded" ||
    verifiedEvent.type === "invoice.paid"
  ) {
    const invoice = verifiedEvent.data.object as Stripe.Invoice;
    const invoiceStatus =
      verifiedEvent.type === "invoice.payment_failed"
        ? InvoiceStatus.OVERDUE
        : verifiedEvent.type === "invoice.finalized" ||
            verifiedEvent.type === "invoice.payment_action_required"
          ? InvoiceStatus.ISSUED
          : InvoiceStatus.PAID;
    const paymentStatus =
      verifiedEvent.type === "invoice.payment_failed"
        ? PaymentStatus.FAILED
        : verifiedEvent.type === "invoice.finalized" ||
            verifiedEvent.type === "invoice.payment_action_required"
          ? PaymentStatus.PENDING
          : PaymentStatus.PAID;

    const result = await syncRecurringInvoiceFromStripe({
      stripe,
      invoice,
      invoiceStatus,
      paymentStatus,
    });

    if (result.applied && paymentStatus === PaymentStatus.PAID) {
      await sendPaymentSuccessNotifications({
        paymentId: result.paymentId,
        ownerCredited: result.ownerCredited,
      });
    }

    logWebhookDebug("subscription invoice synced", {
      eventType: verifiedEvent.type,
      invoiceId: invoice.id,
      bookingId: result.bookingId,
      applied: result.applied,
      paymentId: result.paymentId,
      ownerCredited: result.ownerCredited,
    });

    return NextResponse.json({ received: true });
  }

  if (
    verifiedEvent.type === "customer.subscription.created" ||
    verifiedEvent.type === "customer.subscription.updated" ||
    verifiedEvent.type === "customer.subscription.paused" ||
    verifiedEvent.type === "customer.subscription.resumed" ||
    verifiedEvent.type === "customer.subscription.trial_will_end"
  ) {
    const subscription = verifiedEvent.data.object as Stripe.Subscription;
    logWebhookDebug("subscription lifecycle event", {
      eventType: verifiedEvent.type,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    return NextResponse.json({ received: true });
  }

  if (verifiedEvent.type === "customer.subscription.deleted") {
    const subscription = verifiedEvent.data.object as Stripe.Subscription;
    const metadata = readStripeSubscriptionMetadata(subscription.metadata);

    if (metadata) {
      await prisma.booking.updateMany({
        where: {
          id: metadata.bookingId,
        },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    logWebhookDebug("subscription deleted", {
      subscriptionId: subscription.id,
      bookingId: metadata?.bookingId ?? null,
    });

    return NextResponse.json({ received: true });
  }

  if (
    verifiedEvent.type === "charge.refunded" ||
    verifiedEvent.type === "refund.created" ||
    verifiedEvent.type === "refund.updated"
  ) {
    const refundObject = verifiedEvent.data.object as Stripe.Charge | Stripe.Refund;
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
    const invoicePaymentSelect = {
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
    } as const;

    const currentInvoice =
      (metadata?.invoiceId
        ? await prisma.invoice.findUnique({
            where: { id: metadata.invoiceId },
            include: {
              payment: {
                select: invoicePaymentSelect,
              },
            },
          })
        : null) ??
      (await prisma.invoice.findFirst({
        where: { paymentId: currentPayment.id },
        include: {
          payment: {
            select: invoicePaymentSelect,
          },
        },
      })) ??
      (await prisma.invoice.findFirst({
        where: { bookingId: currentPayment.bookingId },
        orderBy: [{ createdAt: "desc" as const }],
        include: {
          payment: {
            select: invoicePaymentSelect,
          },
        },
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

  if (verifiedEvent.type === "payment_intent.payment_failed") {
    const paymentIntent = verifiedEvent.data.object as Stripe.PaymentIntent;
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

      if (metadata?.renterId) {
        await createNotificationForUser({
          userId: metadata.renterId,
          title: "Payment failed",
          body: "Your Stripe payment failed. Please try another payment method or update your card.",
          linkUrl: "/invoices",
        });
      }

      logWebhookDebug("payment_intent.payment_failed applied", {
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json({ received: true });
  }

  if (verifiedEvent.type === "refund.failed" || verifiedEvent.type === "charge.refund.updated") {
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
