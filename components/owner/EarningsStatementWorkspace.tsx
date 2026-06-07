"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { EarningsStatement } from "@/lib/invoices/earningsStatement";

function formatMoney(value: string, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const WITHDRAWAL_STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-secondary-container/30 text-on-secondary-container",
  PAID: "bg-[#4b6547]/10 text-[#4b6547]",
  REJECTED: "bg-error-container/30 text-on-error-container",
  CANCELLED: "bg-surface-container text-on-surface-variant",
};

export default function EarningsStatementWorkspace() {
  const { t } = useTranslation();
  const [data, setData] = useState<EarningsStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/earnings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: EarningsStatement) => setData(d))
      .catch(() => setError(t("errors.generic")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[20px] border border-error/30 bg-error/5 px-5 py-4 text-body-sm text-error">
        {error ?? t("errors.generic")}
      </div>
    );
  }

  const summaryCards = [
    { label: t("earnings.totalGross"), value: formatMoney(data.totalGross) },
    { label: t("earnings.totalCommission"), value: formatMoney(data.totalCommission) },
    { label: t("earnings.totalNet"), value: formatMoney(data.totalNet) },
    { label: t("earnings.totalPaidOut"), value: formatMoney(data.totalPaidOut) },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[20px] border border-outline-variant/60 bg-surface p-5 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              {card.label}
            </p>
            <p className="mt-2 text-h3 font-h3 text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-h3 font-h3 text-primary">{t("earnings.earningsHistory")}</h2>
        {data.rows.length === 0 ? (
          <div className="rounded-[20px] border border-outline-variant/60 bg-surface px-5 py-8 text-center text-body-sm text-on-surface-variant">
            {t("earnings.noEarnings")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      t("earnings.date"),
                      t("earnings.property"),
                      t("earnings.renter"),
                      t("earnings.gross"),
                      t("earnings.commission"),
                      t("earnings.net"),
                      t("earnings.refs"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant border-b border-outline-variant/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.rows.map((row) => (
                    <tr
                      key={row.paymentId}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">
                        {formatDate(row.paidAt)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm font-medium text-on-surface">{row.listingTitle}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {row.listingCity} · {row.bookingNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface">{row.renterName}</p>
                        <p className="text-[11px] text-on-surface-variant">{row.renterEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-on-surface whitespace-nowrap">
                        {formatMoney(row.grossAmount, row.currency)}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-error whitespace-nowrap">
                        −{formatMoney(row.platformCommission, row.currency)}
                      </td>
                      <td className="px-5 py-4 text-body-sm font-bold text-[#4b6547] whitespace-nowrap">
                        {formatMoney(row.ownerNet, row.currency)}
                      </td>
                      <td className="px-5 py-4 space-y-1">
                        {row.invoiceNumber ? (
                          <p className="text-[11px] text-on-surface-variant">
                            INV: {row.invoiceNumber}
                          </p>
                        ) : null}
                        {row.contractNumber ? (
                          <p className="text-[11px] text-on-surface-variant">
                            CTR: {row.contractNumber}
                          </p>
                        ) : null}
                        {row.stripeChargeId ? (
                          <p className="text-[11px] text-on-surface-variant font-mono truncate max-w-[140px]">
                            {row.stripeChargeId}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-h3 text-primary">{t("earnings.withdrawalHistory")}</h2>
        {data.withdrawals.length === 0 ? (
          <div className="rounded-[20px] border border-outline-variant/60 bg-surface px-5 py-8 text-center text-body-sm text-on-surface-variant">
            {t("earnings.noWithdrawals")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      t("earnings.requestedDate"),
                      t("earnings.amount"),
                      t("earnings.bankDetails"),
                      t("earnings.status"),
                      t("earnings.processedDate"),
                      t("earnings.paymentRef"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant border-b border-outline-variant/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.withdrawals.map((w) => (
                    <tr
                      key={w.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">
                        {formatDate(w.requestedAt)}
                      </td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-on-surface whitespace-nowrap">
                        {formatMoney(w.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface font-mono text-xs">{w.iban}</p>
                        {w.bankName ? (
                          <p className="text-[11px] text-on-surface-variant">{w.bankName}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            WITHDRAWAL_STATUS_STYLES[w.status] ??
                            "bg-surface-container text-on-surface"
                          }`}
                        >
                          {w.status.replace(/_/g, " ")}
                        </span>
                        {w.adminNote ? (
                          <p className="text-[11px] text-on-surface-variant mt-1">{w.adminNote}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">
                        {formatDate(w.processedAt)}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-on-surface-variant font-mono text-xs">
                        {w.paymentReference ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
