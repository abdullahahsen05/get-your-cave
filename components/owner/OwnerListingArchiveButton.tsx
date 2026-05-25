"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  listingId: string;
  archived: boolean;
};

export default function OwnerListingArchiveButton({ listingId, archived }: Props) {
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

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(t("errors.unableToArchiveListing"));
      }

      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : t("errors.unableToArchiveListing"),
      );
    } finally {
      setIsArchiving(false);
    }
  }

  if (archived) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
        disabled={isArchiving}
        type="button"
        onClick={() => {
          void handleArchive();
        }}
      >
        {isArchiving ? t("common.loading") : t("common.archive")}
      </button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
