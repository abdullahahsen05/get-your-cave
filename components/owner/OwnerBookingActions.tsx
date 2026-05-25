"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  bookingId: string;
  status: string;
};

export default function OwnerBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [busyStatus, setBusyStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
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

      if (!response.ok) {
        throw new Error(t("errors.unableToUpdateBooking"));
      }

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : t("errors.unableToUpdateBooking"),
      );
    } finally {
      setBusyStatus(null);
    }
  }

  async function handleMessageRenter() {
    setIsMessaging(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { conversation?: { id: string }; error?: string }
        | null;

      if (!response.ok || !payload?.conversation?.id) {
        throw new Error(t("errors.unableToOpenMessaging"));
      }

      router.push(`/messaging?conversation=${payload.conversation.id}`);
    } catch (messageError) {
      setError(
        messageError instanceof Error ? messageError.message : t("errors.unableToOpenMessaging"),
      );
    } finally {
      setIsMessaging(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button
        className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
        disabled={busyStatus !== null || isMessaging}
        type="button"
        onClick={() => {
          void handleMessageRenter();
        }}
      >
        {isMessaging ? t("common.loading") : t("dashboard.owner.messageRenter")}
      </button>
      <button
        className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={busyStatus !== null || isMessaging}
        type="button"
        onClick={() => {
          void updateBooking("APPROVED");
        }}
      >
        {busyStatus === "APPROVED" ? t("common.loading") : t("common.approve")}
      </button>
      <button
        className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
        disabled={busyStatus !== null}
        type="button"
        onClick={() => {
          void updateBooking("REJECTED");
        }}
      >
        {busyStatus === "REJECTED" ? t("common.loading") : t("common.reject")}
      </button>
      {error ? <p className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
