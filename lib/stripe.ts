import Stripe from "stripe";
import { Prisma } from "@prisma/client";

let cachedStripe: Stripe | null = null;

export type StripeCheckoutMetadata = {
  bookingId: string;
  invoiceId: string;
  paymentId: string;
  renterId: string;
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
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production.");
  }

  return "http://localhost:3000";
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
