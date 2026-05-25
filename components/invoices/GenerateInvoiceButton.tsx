"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  bookingId: string;
  label?: string;
  className?: string;
};

export default function GenerateInvoiceButton({
  bookingId,
  label,
  className = "",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedLabel = label ?? t("invoices.generateInvoice");

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { invoice?: { id: string } }
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(t("errors.unableToGenerateInvoice"));
        return;
      }

      router.refresh();

      if (payload && "invoice" in payload && payload.invoice?.id) {
        router.push(`/invoices/${payload.invoice.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${className} ${loading ? "opacity-60 cursor-wait" : ""}`}
        disabled={loading}
        type="button"
        onClick={() => {
          void handleGenerate();
        }}
      >
        <span className="material-symbols-outlined text-sm">
          {loading ? "progress_activity" : "receipt_long"}
        </span>
        {loading ? t("common.loading") : resolvedLabel}
      </button>
      {error ? (
        <p className="text-body-sm font-body-sm text-error">{error}</p>
      ) : null}
    </div>
  );
}
