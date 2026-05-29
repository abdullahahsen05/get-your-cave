"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  getInvoiceStatusOptions,
} from "@/lib/invoices/invoiceTypes";
import { normalizeLocale, type Locale } from "@/lib/i18n";
import type { SafeInvoice } from "@/lib/invoices/generateInvoice";

type Props = {
  invoices: SafeInvoice[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  totals: {
    subtotal: string;
    platformFee: string;
    totalAmount: string;
  };
  currentStatus: string;
  currentSearch: string;
  currentSort: string;
  currentRole: string;
};

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRoleLabel(role: string, t: (key: string) => string) {
  if (role === "OWNER") {
    return t("common.owner");
  }

  if (role === "RENTER") {
    return t("common.renter");
  }

  return t("common.admin");
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-[0_8px_28px_rgba(17,24,39,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-label-caps uppercase tracking-widest text-outline">
            {label}
          </p>
          <p className="font-h2 text-[clamp(1.6rem,3vw,2.4rem)] leading-none text-primary">
            {value}
          </p>
        </div>
        <span className="material-symbols-outlined mt-1 text-[24px] text-primary">
          {icon}
        </span>
      </div>
    </div>
  );
}

function InvoiceCard({
  invoice,
  locale,
  t,
}: {
  invoice: SafeInvoice;
  locale: Locale;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <article className="rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body-md font-semibold text-primary">{invoice.invoiceNumber}</p>
          <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
            {invoice.bookingTitle}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
        >
          {getInvoiceStatusLabel(invoice.status, locale)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-surface-container-low p-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            {t("invoices.booking")}
          </p>
          <p className="mt-2 font-body-sm font-semibold text-primary">{invoice.bookingNumber}</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.bookingCity}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            {t("invoices.renterOwner")}
          </p>
          <p className="mt-2 font-body-sm font-semibold text-primary">{invoice.renterName}</p>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            {t("invoices.ownerLabel", { owner: invoice.ownerName })}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            {t("invoices.due")}
          </p>
          <p className="mt-2 font-body-sm font-semibold text-primary">
            {formatDate(invoice.dueAt, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            {t("invoices.total")}
          </p>
          <p className="mt-2 font-h3 text-h3 text-primary">
            {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low"
          href={`/invoices/${invoice.id}`}
        >
          {t("common.viewDetails")}
        </Link>
        <a
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
          href={`/api/invoices/${invoice.id}/pdf`}
        >
          {t("common.download")}
        </a>
      </div>
    </article>
  );
}

export default function InvoicesWorkspace({
  invoices,
  pagination,
  totals,
  currentStatus,
  currentSearch,
  currentSort,
  currentRole,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();

    if (currentSearch) {
      params.set("q", currentSearch);
    }

    if (currentStatus) {
      params.set("status", currentStatus);
    }

    if (currentSort) {
      params.set("sort", currentSort);
    }

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const query = params.toString();
    return query ? `/invoices?${query}` : "/invoices";
  }

  const paidTotal = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
  const outstandingTotal = invoices
    .filter((invoice) => ["DRAFT", "ISSUED", "OVERDUE"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

  return (
    <main className="mx-auto min-h-screen max-w-[1380px] bg-background px-4 pb-24 pt-28 text-on-surface sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
      <section className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.24em] text-secondary">
            {t("invoices.title")}
          </p>
          <div className="space-y-3">
            <h1 className="max-w-3xl font-h1 text-[clamp(2.5rem,4vw,4.5rem)] leading-[0.96] tracking-[-0.04em] text-primary">
              {t("invoices.billingTitle")}
            </h1>
            <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              {t("invoices.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-body-sm font-body-sm text-on-surface-variant">
          <span className="rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2">
            {t("invoices.records", { count: pagination.totalItems })}
          </span>
          <span className="rounded-full border border-outline-variant bg-surface-container-low px-4 py-2">
            {t("invoices.role", { role: getRoleLabel(currentRole, t) })}
          </span>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon="receipt_long"
          label={t("invoices.totalInvoiced")}
          value={formatCurrency(totals.totalAmount, "EUR")}
        />
        <StatCard
          icon="check_circle"
          label={t("invoices.paid")}
          value={formatCurrency(paidTotal, "EUR")}
        />
        <StatCard
          icon="pending_actions"
          label={t("invoices.outstanding")}
          value={formatCurrency(outstandingTotal, "EUR")}
        />
      </section>

      <section className="mb-6 rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6">
        <form className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end" method="get">
          <div className="lg:col-span-5">
            <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
              {t("common.search")}
            </label>
            <input
              className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-secondary"
              defaultValue={currentSearch}
              name="q"
              placeholder={t("invoices.searchPlaceholder")}
              type="search"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
              {t("common.status")}
            </label>
            <select
              className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:border-secondary"
              defaultValue={currentStatus}
              name="status"
            >
              {getInvoiceStatusOptions(locale).map((option) => (
                <option key={option.value || option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
              {t("common.sortBy")}
            </label>
            <select
              className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:border-secondary"
              defaultValue={currentSort}
              name="sort"
            >
              <option value="newest">{t("invoices.newest")}</option>
              <option value="oldest">{t("invoices.oldest")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-secondary px-5 py-3 font-label-caps text-label-caps text-white transition-colors hover:bg-[#d9590f]"
              type="submit"
            >
              {t("common.apply")}
            </button>
            <Link
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-low px-5 py-3 font-label-caps text-label-caps text-primary transition-colors hover:bg-secondary-container/20"
              href="/invoices"
            >
              {t("common.reset")}
            </Link>
          </div>
        </form>
      </section>

      <section className="space-y-4 lg:hidden">
        {invoices.length ? (
          invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} locale={locale} t={t} />
          ))
        ) : (
          <div className="rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest px-6 py-16 text-center text-on-surface-variant shadow-[0_8px_28px_rgba(17,24,39,0.05)]">
            {t("invoices.noInvoices")}
          </div>
        )}
      </section>

      <section className="hidden overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_8px_28px_rgba(17,24,39,0.05)] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.invoiceNumber")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.booking")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.renterOwner")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.total")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("common.status")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.due")}
                </th>
                <th className="px-6 py-4 text-right font-label-caps text-label-caps uppercase tracking-widest text-outline">
                  {t("invoices.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {invoices.length ? (
                invoices.map((invoice) => (
                  <tr className="transition-colors hover:bg-secondary-container/10" key={invoice.id}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-body-md font-semibold text-primary">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="text-body-sm font-body-sm text-on-surface-variant">
                          {invoice.bookingTitle}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body-sm text-on-surface">
                      <div className="flex flex-col">
                        <span>{invoice.bookingNumber}</span>
                        <span className="text-on-surface-variant">{invoice.bookingCity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body-sm text-on-surface">
                      <div className="flex flex-col">
                        <span>{invoice.renterName}</span>
                        <span className="text-on-surface-variant">
                          {t("invoices.ownerLabel", { owner: invoice.ownerName })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body-md font-semibold text-primary">
                      {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
                      >
                        {getInvoiceStatusLabel(invoice.status, locale)}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-body-sm text-on-surface-variant">
                      {formatDate(invoice.dueAt, locale)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low"
                          href={`/invoices/${invoice.id}`}
                        >
                          {t("common.viewDetails")}
                        </Link>
                        <a
                          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                          href={`/api/invoices/${invoice.id}/pdf`}
                        >
                          {t("common.download")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-16 text-center text-on-surface-variant" colSpan={7}>
                    {t("invoices.noInvoices")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm font-body-sm text-on-surface-variant">
          {t("invoices.showing", { visible: invoices.length, total: pagination.totalItems })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
            <Link
            className={`rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 text-sm font-bold text-primary transition-colors ${
              pagination.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-container"
            }`}
            href={buildPageHref(Math.max(1, pagination.page - 1))}
          >
            {t("common.previous")}
          </Link>
          <span className="text-body-sm font-body-sm text-on-surface-variant">
            {t("common.pageOf", { page: pagination.page, totalPages: pagination.totalPages || 1 })}
          </span>
            <Link
            className={`rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 text-sm font-bold text-primary transition-colors ${
              pagination.page >= pagination.totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-surface-container"
            }`}
            href={buildPageHref(Math.min(pagination.totalPages || 1, pagination.page + 1))}
          >
            {t("common.next")}
          </Link>
        </div>
      </section>
    </main>
  );
}
