"use client";

import { useState } from "react";

type Props = {
  bookingId?: string | null;
  invoiceId?: string | null;
  className?: string;
  label?: string;
};

export default function StripeCheckoutButton({
  bookingId,
  invoiceId,
  className = "bg-primary text-on-primary",
  label = "Pay Now",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingId ?? undefined,
          invoiceId: invoiceId ?? undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        sessionId?: string;
        url?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start Stripe checkout.");
      }

      if (payload.url) {
        window.location.assign(payload.url);
        return;
      }

      throw new Error("Stripe checkout is not configured correctly.");
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        disabled={loading}
        onClick={handleCheckout}
        type="button"
      >
        <span className="material-symbols-outlined text-[18px]">
          {loading ? "progress_activity" : "payments"}
        </span>
        {loading ? "Starting checkout..." : label}
      </button>

      {error ? (
        <p className="text-body-sm font-body-sm text-error" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
