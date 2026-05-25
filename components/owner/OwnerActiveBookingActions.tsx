"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  bookingId: string;
};

export default function OwnerActiveBookingActions({ bookingId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isMessaging, setIsMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMessageRenter() {
    setIsMessaging(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { conversation?: { id: string }; error?: string }
        | null;

      if (!response.ok || !payload?.conversation?.id) {
        throw new Error(t("errors.unableToOpenMessaging"));
      }

      router.push(`/messaging?conversation=${payload.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unableToOpenMessaging"));
    } finally {
      setIsMessaging(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Link
        className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
        href="/invoices"
      >
        {t("dashboard.owner.viewAllInvoices")}
      </Link>
      <button
        className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={isMessaging}
        type="button"
        onClick={() => {
          void handleMessageRenter();
        }}
      >
        {isMessaging ? t("common.loading") : t("dashboard.owner.messageRenter")}
      </button>
      {error ? <p className="w-full text-xs text-error">{error}</p> : null}
    </div>
  );
}
