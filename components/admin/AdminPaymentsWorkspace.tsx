"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type PaymentRow = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  platformCommission: string;
  ownerAmount: string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeInvoiceId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    listingTitle: string;
    listingCity: string;
    ownerName: string;
    ownerEmail: string;
    renterName: string;
    renterEmail: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    pdfUrl: string | null;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  PAID: "bg-[#4b6547]/10 text-[#4b6547]",
  FAILED: "bg-error/10 text-error",
  REFUNDED: "bg-blue-500/10 text-blue-700",
  CANCELLED: "bg-stone-100 text-stone-500",
};

function formatMoney(value: string, currency = "EUR") {
  const n = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function truncateRef(value: string | null) {
  if (!value) return "—";
  if (value.length <= 20) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export default function AdminPaymentsWorkspace() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ limit: "100" });
        if (search.trim()) qs.set("search", search.trim());
        if (statusFilter) qs.set("status", statusFilter);
        const res = await fetch(`/api/admin/payments?${qs.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("errors.generic"));
        const data = (await res.json()) as { rows: PaymentRow[]; total: number };
        if (!cancelled) {
          setRows(data.rows);
          setTotal(data.total);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("errors.generic"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, statusFilter, t]);

  const totalPaid = rows
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const totalCommission = rows
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + Number(r.platformCommission), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] text-primary">
            {t("admin.payments.title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t("admin.payments.subtitle", { count: total })}
          </p>
        </div>
      </div>

      {rows.some((r) => r.status === "PAID") ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="tonal-card rounded-[1.5rem] border border-outline-variant/60 bg-surface/75 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              {t("admin.payments.totalPaid")}
            </p>
            <p className="mt-1 text-xl font-bold text-primary">{formatMoney(totalPaid.toFixed(2))}</p>
          </div>
          <div className="tonal-card rounded-[1.5rem] border border-outline-variant/60 bg-surface/75 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              {t("admin.payments.totalCommission")}
            </p>
            <p className="mt-1 text-xl font-bold text-secondary">{formatMoney(totalCommission.toFixed(2))}</p>
          </div>
          <div className="tonal-card rounded-[1.5rem] border border-outline-variant/60 bg-surface/75 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              {t("admin.payments.totalOwnerNet")}
            </p>
            <p className="mt-1 text-xl font-bold text-[#4b6547]">
              {formatMoney((totalPaid - totalCommission).toFixed(2))}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
            search
          </span>
          <input
            className="w-full rounded-full border border-outline-variant/60 bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:ring-0"
            placeholder={t("admin.payments.searchPlaceholder")}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-full border border-outline-variant/60 bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:ring-0"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t("admin.payments.allStatuses")}</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-secondary/20 bg-secondary-container/15 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      ) : null}

      <div className="tonal-card overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface/75 shadow-[0_12px_40px_rgba(17,24,39,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
              <tr>
                {[
                  t("admin.payments.col.booking"),
                  t("admin.payments.col.property"),
                  t("admin.payments.col.owner"),
                  t("admin.payments.col.renter"),
                  t("admin.payments.col.amount"),
                  t("admin.payments.col.commission"),
                  t("admin.payments.col.ownerNet"),
                  t("admin.payments.col.status"),
                  t("admin.payments.col.paidAt"),
                  t("admin.payments.col.stripeRef"),
                  t("admin.payments.col.invoice"),
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-on-surface-variant" colSpan={11}>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-on-surface-variant" colSpan={11}>
                    {t("admin.payments.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.bookingNumber}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(row.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.listingTitle}</p>
                      <p className="text-xs text-on-surface-variant">{row.booking.listingCity}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.ownerName}</p>
                      <p className="text-xs text-on-surface-variant">{row.booking.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.renterName}</p>
                      <p className="text-xs text-on-surface-variant">{row.booking.renterEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-primary">
                      {formatMoney(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-4 text-sm text-secondary">
                      {formatMoney(row.platformCommission, row.currency)}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#4b6547]">
                      {formatMoney(row.ownerAmount, row.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[row.status] ?? "bg-stone-100 text-stone-500"}`}
                      >
                        {row.status}
                      </span>
                      {row.refundedAt ? (
                        <p className="mt-1 text-[10px] text-on-surface-variant">
                          {t("admin.payments.refundedAt")}: {formatDate(row.refundedAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">
                      {formatDate(row.paidAt)}
                    </td>
                    <td className="px-4 py-4">
                      {row.stripePaymentIntentId ? (
                        <p className="font-mono text-xs text-on-surface-variant" title={row.stripePaymentIntentId}>
                          {truncateRef(row.stripePaymentIntentId)}
                        </p>
                      ) : row.stripeChargeId ? (
                        <p className="font-mono text-xs text-on-surface-variant" title={row.stripeChargeId}>
                          {truncateRef(row.stripeChargeId)}
                        </p>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {row.invoice ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-semibold text-primary">{row.invoice.invoiceNumber}</p>
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                              row.invoice.status === "PAID"
                                ? "bg-[#4b6547]/10 text-[#4b6547]"
                                : "bg-amber-500/10 text-amber-700"
                            }`}
                          >
                            {row.invoice.status}
                          </span>
                          {row.invoice.pdfUrl ? (
                            <a
                              href={row.invoice.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-secondary underline"
                            >
                              {t("common.download")}
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 ? (
          <div className="border-t border-outline-variant/60 bg-surface px-4 py-3 text-sm text-on-surface-variant">
            {t("admin.payments.showing", { count: rows.length, total })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
