"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  manageLabel,
  receiptHref,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel = status === "PENDING" || status === "APPROVED" || status === "ACTIVE";
  const resolvedManageLabel = manageLabel ?? t("dashboard.renter.manageUnit");

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

      if (!response.ok) {
        throw new Error(t("errors.unableToCancelBooking"));
      }

      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : t("errors.unableToCancelBooking"),
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
        {resolvedManageLabel}
      </Link>

      {receiptHref ? (
        <Link
          className="flex-1 min-w-[160px] text-primary-container font-bold hover:underline underline-offset-4 text-sm py-3 text-center"
          href={receiptHref}
        >
          {t("dashboard.renter.downloadReceipt")}
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
          {isCancelling ? t("common.loading") : t("dashboard.renter.cancelBooking")}
        </button>
      ) : null}

      {error ? <p className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
