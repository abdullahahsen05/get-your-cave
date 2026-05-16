"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  bookingId: string;
  label?: string;
  className?: string;
};

export default function GenerateInvoiceButton({
  bookingId,
  label = "Generate Invoice",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError((payload && "error" in payload && payload.error) || "Unable to generate invoice.");
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
        {loading ? "Generating..." : label}
      </button>
      {error ? (
        <p className="text-body-sm font-body-sm text-error">{error}</p>
      ) : null}
    </div>
  );
}
