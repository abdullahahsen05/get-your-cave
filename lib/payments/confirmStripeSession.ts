import Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe";
import { finalizeStripeCheckoutSession } from "@/lib/payments/finalizeStripeCheckoutSession";

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
    return true;
  }

  const result = await finalizeStripeCheckoutSession({
    stripe,
    session,
    revalidate: false,
  });

  return result.applied;
}
