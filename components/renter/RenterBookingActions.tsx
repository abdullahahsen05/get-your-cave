"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  bookingId: string;
  listingId: string;
  status: string;
  manageLabel?: string;
  receiptHref?: string | null;
};

export default function RenterBookingActions({
  bookingId,
  listingId,
  status,
  manageLabel = "Manage Unit",
  receiptHref,
}: Props) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel = status === "PENDING" || status === "APPROVED" || status === "ACTIVE";

  async function handleCancel() {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to cancel booking.");
      }

      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Unable to cancel booking.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        className="flex-1 min-w-[160px] bg-primary-container text-on-primary py-3 rounded-full text-sm font-bold hover:opacity-95 transition-opacity text-center"
        href={`/storage/${listingId}`}
      >
        {manageLabel}
      </Link>

      {receiptHref ? (
        <Link
          className="flex-1 min-w-[160px] text-primary-container font-bold hover:underline underline-offset-4 text-sm py-3 text-center"
          href={receiptHref}
        >
          Download Receipt
        </Link>
      ) : null}

      {canCancel ? (
        <button
          className="flex-1 min-w-[160px] rounded-full border border-outline-variant px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
          disabled={isCancelling}
          type="button"
          onClick={() => {
            void handleCancel();
          }}
        >
          {isCancelling ? "Cancelling..." : "Cancel Booking"}
        </button>
      ) : null}

      {error ? <p className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
