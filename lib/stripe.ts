import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getAppUrl as getSharedAppUrl } from "@/lib/app-url";

let cachedStripe: Stripe | null = null;

export type StripeCheckoutMetadata = {
  bookingId: string;
  invoiceId: string;
  paymentId: string;
  renterId: string;
};

export type StripeSubscriptionMetadata = {
  bookingId: string;
  renterId: string;
  durationMonths: string;
  invoiceId?: string;
};

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey);
  }

  return cachedStripe;
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function getAppUrl(request?: Request) {
  return getSharedAppUrl(request);
}

export function toStripeMinorUnits(value: Prisma.Decimal | number | string) {
  return Math.round(Number(value instanceof Prisma.Decimal ? value.toString() : value) * 100);
}

export function buildStripeCheckoutMetadata(input: StripeCheckoutMetadata) {
  return {
    bookingId: input.bookingId,
    invoiceId: input.invoiceId,
    paymentId: input.paymentId,
    renterId: input.renterId,
  };
}

export function buildStripeSubscriptionMetadata(input: StripeSubscriptionMetadata) {
  return {
    bookingId: input.bookingId,
    renterId: input.renterId,
    durationMonths: input.durationMonths,
    ...(input.invoiceId ? { invoiceId: input.invoiceId } : {}),
  };
}

export function readStripeCheckoutMetadata(metadata: Stripe.Metadata | null | undefined) {
  const bookingId = metadata?.bookingId?.trim();
  const invoiceId = metadata?.invoiceId?.trim();
  const paymentId = metadata?.paymentId?.trim();
  const renterId = metadata?.renterId?.trim();

  if (!bookingId || !invoiceId || !paymentId || !renterId) {
    return null;
  }

  return {
    bookingId,
    invoiceId,
    paymentId,
    renterId,
  } satisfies StripeCheckoutMetadata;
}

export function readStripeSubscriptionMetadata(
  metadata: Stripe.Metadata | null | undefined,
) {
  const bookingId = metadata?.bookingId?.trim();
  const renterId = metadata?.renterId?.trim();
  const durationMonths = metadata?.durationMonths?.trim();
  const invoiceId = metadata?.invoiceId?.trim();

  if (!bookingId || !renterId || !durationMonths) {
    return null;
  }

  return {
    bookingId,
    renterId,
    durationMonths,
    ...(invoiceId ? { invoiceId } : {}),
  } satisfies StripeSubscriptionMetadata;
}
