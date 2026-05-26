"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  listingId: string;
};

export default function OwnerListingTrashButton({ listingId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(t("common.deleteListingConfirmation"));

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
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
      setIsDeleting(false);
    }
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1 opacity-100 transition-opacity duration-200 sm:left-4 sm:top-4 sm:opacity-0 sm:pointer-events-none sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
      <button
        aria-label={t("common.delete")}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-error shadow-lg shadow-black/10 backdrop-blur transition-transform hover:scale-105 hover:bg-white disabled:opacity-60 sm:h-11 sm:w-11"
        disabled={isDeleting}
        title={t("common.delete")}
        type="button"
        onClick={() => {
          void handleDelete();
        }}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isDeleting ? "hourglass_top" : "delete"}
        </span>
      </button>
      {error ? <p className="max-w-[12rem] text-xs text-error">{error}</p> : null}
    </div>
  );
}
