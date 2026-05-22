"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  bookingId: string;
  status: string;
};

export default function OwnerBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [busyStatus, setBusyStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "PENDING") {
    return null;
  }

  async function updateBooking(nextStatus: "APPROVED" | "REJECTED") {
    setBusyStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update booking.");
      }

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update booking.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button
        className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={busyStatus !== null}
        type="button"
        onClick={() => {
          void updateBooking("APPROVED");
        }}
      >
        {busyStatus === "APPROVED" ? "Approving..." : "Approve"}
      </button>
      <button
        className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
        disabled={busyStatus !== null}
        type="button"
        onClick={() => {
          void updateBooking("REJECTED");
        }}
      >
        {busyStatus === "REJECTED" ? "Rejecting..." : "Reject"}
      </button>
      {error ? <p className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
