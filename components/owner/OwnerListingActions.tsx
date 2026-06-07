"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ListingAvailability, ListingStatus } from "@prisma/client";

type Props = {
  listingId: string;
  availability: ListingAvailability;
};

type BusyAction = "submitReview" | "draft" | "rented" | "disable" | "delete" | null;

const actionClasses =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-60";

export default function OwnerListingActions({
  listingId,
  availability,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateListing(payload: Record<string, unknown>, action: BusyAction) {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(t("errors.unableToUpdateListing"));
      }

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : t("errors.unableToUpdateListing"),
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleDisable() {
    setBusyAction("disable");
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          availability: isDisabled
            ? ListingAvailability.AVAILABLE
            : ListingAvailability.UNAVAILABLE,
        }),
      });

      if (!response.ok) {
        throw new Error(t("errors.unableToUpdateListing"));
      }

      router.refresh();
    } catch (disableError) {
      setError(
        disableError instanceof Error ? disableError.message : t("errors.unableToUpdateListing"),
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(t("common.deleteListingConfirmation"));
    if (!confirmed) {
      return;
    }

    setBusyAction("delete");
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/delete`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(t("errors.unableToDeleteListing"));
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : t("errors.unableToDeleteListing"),
      );
    } finally {
      setBusyAction(null);
    }
  }

  const isDisabled = availability === ListingAvailability.UNAVAILABLE;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          className={`${actionClasses} border border-outline-variant/70 bg-surface-container-low text-primary hover:bg-surface-container`}
          href={`/create-listing?listingId=${listingId}`}
        >
          {t("common.edit")}
        </Link>
        <button
          className={`${actionClasses} bg-secondary text-on-secondary hover:bg-[#d9590f]`}
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            void updateListing(
              {
                status: ListingStatus.PENDING_APPROVAL,
                availability: ListingAvailability.AVAILABLE,
              },
              "submitReview",
            );
          }}
        >
          {busyAction === "submitReview"
            ? t("common.loading")
            : t("common.publish")}
        </button>
        <button
          className={`${actionClasses} border border-outline-variant/70 bg-surface-container-low text-primary hover:bg-surface-container`}
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            void updateListing(
              {
                status: ListingStatus.DRAFT,
                availability: ListingAvailability.AVAILABLE,
              },
              "draft",
            );
          }}
        >
          {busyAction === "draft" ? t("common.loading") : t("common.saveDraft")}
        </button>
        <button
          className={`${actionClasses} border border-outline-variant/70 bg-surface-container-low text-primary hover:bg-surface-container`}
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            void updateListing(
              {
                availability: ListingAvailability.OCCUPIED,
              },
              "rented",
            );
          }}
        >
          {busyAction === "rented" ? t("common.loading") : t("common.rented")}
        </button>
        <button
          className={`${actionClasses} border border-outline-variant/70 ${
            isDisabled
              ? "bg-secondary-container text-on-secondary-container hover:opacity-90"
              : "bg-surface-container-low text-primary hover:bg-surface-container"
          }`}
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            void toggleDisable();
          }}
        >
          {busyAction === "disable"
            ? t("common.loading")
            : isDisabled
              ? t("common.enable")
              : t("common.disable")}
        </button>
        <button
          className={`${actionClasses} border border-error/30 bg-error/5 text-error hover:bg-error/10`}
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            void handleDelete();
          }}
        >
          {busyAction === "delete" ? t("common.loading") : t("common.delete")}
        </button>
      </div>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
