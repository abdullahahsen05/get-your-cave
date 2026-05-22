"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import {
  formatCurrency,
} from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
  getInvoiceStatusOptions,
} from "@/lib/invoices/invoiceTypes";
import { normalizeLocale } from "@/lib/i18n";
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
    <main className="min-h-screen bg-background text-on-background pt-28 sm:pt-32 pb-24 mx-auto max-w-[1280px] px-4 sm:px-6">
      <section className="mb-12 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
            {t("invoices.title")}
          </p>
          <h1 className="font-h1 text-h1 text-primary">{t("invoices.billingTitle")}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1 max-w-2xl">
            {t("invoices.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-body-sm font-body-sm text-on-surface-variant">
          <span className="rounded-full border border-outline-variant px-4 py-2 bg-surface-container-low">
            {t("invoices.records", { count: pagination.totalItems })}
          </span>
          <span className="rounded-full border border-outline-variant px-4 py-2 bg-surface-container-low">
            {t("invoices.role", { role: currentRole })}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg border border-[#EBEBE8] shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-outline mb-2 block uppercase tracking-widest">
            {t("invoices.totalInvoiced")}
          </span>
          <div className="flex items-end justify-between gap-4">
            <span className="font-h2 text-h2 text-primary">
              {formatCurrency(totals.totalAmount, "EUR")}
            </span>
            <span className="material-symbols-outlined text-primary mb-1">
              receipt_long
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg border border-[#EBEBE8] shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-outline mb-2 block uppercase tracking-widest">
            {t("invoices.paid")}
          </span>
          <div className="flex items-end justify-between gap-4">
            <span className="font-h2 text-h2 text-primary">{formatCurrency(paidTotal, "EUR")}</span>
            <span className="material-symbols-outlined text-secondary mb-1">
              check_circle
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg border border-[#EBEBE8] shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
          <span className="font-label-caps text-label-caps text-outline mb-2 block uppercase tracking-widest">
            {t("invoices.outstanding")}
          </span>
          <div className="flex items-end justify-between gap-4">
            <span className="font-h2 text-h2 text-primary">
              {formatCurrency(outstandingTotal, "EUR")}
            </span>
            <span className="material-symbols-outlined text-error mb-1">
              pending_actions
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-4 mb-6">
        <form className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end" method="get">
          <div className="lg:col-span-5">
            <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
              {t("common.search")}
            </label>
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-full px-4 py-3 font-body-sm text-body-sm focus:outline-none focus:border-primary"
              defaultValue={currentSearch}
              name="q"
              placeholder={t("invoices.searchPlaceholder")}
              type="search"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
              {t("common.status")}
            </label>
            <select
              className="w-full bg-surface-container-low border border-outline-variant rounded-full px-4 py-3 font-body-sm text-body-sm focus:outline-none focus:border-primary"
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
            <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
              {t("common.sortBy")}
            </label>
            <select
              className="w-full bg-surface-container-low border border-outline-variant rounded-full px-4 py-3 font-body-sm text-body-sm focus:outline-none focus:border-primary"
              defaultValue={currentSort}
              name="sort"
            >
              <option value="newest">{t("invoices.newest")}</option>
              <option value="oldest">{t("invoices.oldest")}</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 bg-primary text-on-primary rounded-full px-5 py-3 font-label-caps text-label-caps"
              type="submit"
            >
              {t("common.apply")}
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-outline-variant px-5 py-3 font-label-caps text-label-caps text-primary"
              href="/invoices"
            >
              {t("common.reset")}
            </Link>
          </div>
        </form>
      </section>

      <section className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-[#EBEBE8] bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("invoices.invoiceNumber")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("invoices.booking")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("invoices.renterOwner")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("invoices.total")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("common.status")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {t("invoices.due")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest text-right">
                  {t("invoices.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBE8]">
              {invoices.length ? (
                invoices.map((invoice) => (
                  <tr className="hover:bg-surface-container-low transition-colors" key={invoice.id}>
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
                        <span className="text-on-surface-variant">
                          {invoice.bookingCity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body-sm text-on-surface">
                      <div className="flex flex-col">
                        <span>{invoice.renterName}</span>
                        <span className="text-on-surface-variant">Owner: {invoice.ownerName}</span>
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
                          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary hover:bg-surface-container transition-colors"
                          href={`/invoices/${invoice.id}`}
                        >
                          {t("common.viewDetails")}
                        </Link>
                        <button
                          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface-variant opacity-60 cursor-not-allowed"
                          disabled
                          type="button"
                          title="Invoice export coming soon"
                        >
                          {t("common.download")}
                        </button>
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

      <section className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-body-sm font-body-sm text-on-surface-variant">
          {t("invoices.showing", { visible: invoices.length, total: pagination.totalItems })}
        </p>
        <div className="flex items-center gap-3">
          <Link
            className={`rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary transition-colors ${pagination.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-container"}`}
            href={buildPageHref(Math.max(1, pagination.page - 1))}
          >
            {t("common.previous")}
          </Link>
          <span className="text-body-sm font-body-sm text-on-surface-variant">
            {t("common.pageOf", { page: pagination.page, totalPages: pagination.totalPages || 1 })}
          </span>
          <Link
            className={`rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary transition-colors ${pagination.page >= pagination.totalPages ? "pointer-events-none opacity-40" : "hover:bg-surface-container"}`}
            href={buildPageHref(Math.min(pagination.totalPages || 1, pagination.page + 1))}
          >
            {t("common.next")}
          </Link>
        </div>
      </section>
    </main>
  );
}
