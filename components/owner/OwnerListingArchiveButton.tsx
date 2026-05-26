"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  listingId: string;
  archived: boolean;
  label: string;
  variant?: "button" | "badge";
};

export default function OwnerListingArchiveButton({
  listingId,
  archived,
  label,
  variant = "button",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setIsArchiving(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(t("errors.unableToToggleListingArchive"));
      }

      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : t("errors.unableToToggleListingArchive"),
      );
    } finally {
      setIsArchiving(false);
    }
  }

  const buttonLabel = archived ? t("common.unarchive") : t("common.archive");
  const ariaLabel = archived ? t("common.unarchive") : t("common.archive");

  if (!archived && variant === "badge") {
    return null;
  }

  if (archived && variant === "button") {
    return null;
  }

  if (variant === "badge") {
    return (
      <button
        aria-label={ariaLabel}
        className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1.5 text-label-caps font-label-caps transition-opacity ${
          archived
            ? "bg-secondary-container text-on-secondary-fixed hover:opacity-90"
            : "bg-primary text-white hover:opacity-90"
        } disabled:opacity-60`}
        disabled={isArchiving}
        title={buttonLabel}
        type="button"
        onClick={() => {
          void handleArchive();
        }}
      >
        {isArchiving ? t("common.loading") : label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-outline-variant px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container disabled:opacity-60 sm:w-auto"
        disabled={isArchiving}
        title={buttonLabel}
        type="button"
        onClick={() => {
          void handleArchive();
        }}
      >
        {isArchiving ? t("common.loading") : buttonLabel}
      </button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
