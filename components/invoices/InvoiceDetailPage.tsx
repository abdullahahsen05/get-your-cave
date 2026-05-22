"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import GenerateInvoiceButton from "@/components/invoices/GenerateInvoiceButton";
import StripeCheckoutButton from "@/components/payments/StripeCheckoutButton";
import {
  formatCurrency,
} from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "@/lib/invoices/invoiceTypes";
import { normalizeLocale } from "@/lib/i18n";
import type { SafeInvoice } from "@/lib/invoices/generateInvoice";

type Props = {
  invoice: SafeInvoice;
  canGenerate: boolean;
  canPay: boolean;
};

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoiceDetailPage({ invoice, canGenerate, canPay }: Props) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);

  return (
    <main className="min-h-screen bg-background text-on-background pt-28 sm:pt-32 pb-24 mx-auto max-w-[1280px] px-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-2">
        <Link className="text-body-sm font-body-sm text-primary hover:underline" href="/invoices">
          ← {t("invoiceDetail.backToInvoices")}
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
              {t("invoiceDetail.title")}
            </p>
            <h1 className="font-h1 text-h1 text-primary">{invoice.invoiceNumber}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
              {t("invoiceDetail.bookingLabel", { bookingNumber: invoice.bookingNumber, title: invoice.bookingTitle })}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
            >
              {getInvoiceStatusLabel(invoice.status, locale)}
            </span>
            {canGenerate ? (
              <GenerateInvoiceButton
                bookingId={invoice.bookingId}
                className="bg-primary text-on-primary"
                label={t("invoiceDetail.generateRefresh")}
              />
            ) : null}
            {canPay ? (
              <StripeCheckoutButton
                bookingId={invoice.bookingId}
                className="bg-primary text-on-primary"
                invoiceId={invoice.id}
                label={t("invoiceDetail.payNow")}
              />
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  {t("invoiceDetail.booking")}
                </p>
                <h2 className="font-h3 text-h3 text-primary">{invoice.bookingTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  {invoice.bookingAddress}, {invoice.bookingCity}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  {t("invoiceDetail.storageType", { storageType: invoice.bookingStorageType })}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  {t("invoiceDetail.dates")}
                </p>
                <div className="space-y-1 text-body-sm font-body-sm text-on-surface">
                  <p>{t("invoiceDetail.issuedAt")}: {formatDate(invoice.issuedAt, locale)}</p>
                  <p>{t("invoiceDetail.dueAt")}: {formatDate(invoice.dueAt, locale)}</p>
                  <p>{t("invoiceDetail.paidAt")}: {formatDate(invoice.paidAt, locale)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="font-h3 text-h3 text-primary">{t("invoiceDetail.paymentBreakdown")}</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("invoiceDetail.currency", { currency: invoice.currency.toUpperCase() })}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#EBEBE8]">
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {t("invoiceDetail.description")}
                    </th>
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {t("invoiceDetail.quantity")}
                    </th>
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant text-right">
                      {t("invoiceDetail.amount")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE8]">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <p className="font-body-sm font-semibold text-primary">{item.description}</p>
                        <p className="text-body-sm font-body-sm text-on-surface-variant">
                          {t("invoiceDetail.itemizedLine")}
                        </p>
                      </td>
                      <td className="py-4 text-body-sm font-body-sm text-on-surface">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right font-body-sm font-semibold text-primary">
                        {formatCurrency(item.total, invoice.currency.toUpperCase())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">{t("invoiceDetail.summary")}</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.subtotal")}
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.subtotal, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.platformFee")}
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.platformFee, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.taxes")}
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.taxAmount, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.securityDeposit")}
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.securityDeposit, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="pt-4 border-t border-[#EBEBE8] flex items-center justify-between gap-4">
                <span className="font-body-md font-semibold text-primary">{t("invoiceDetail.total")}</span>
                <span className="font-h3 text-h3 text-primary">
                  {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">{t("invoiceDetail.people")}</h2>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  {t("invoiceDetail.renter")}
                </p>
                <p className="font-body-md font-semibold text-primary">{invoice.renterName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.renterEmail}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  {t("invoiceDetail.owner")}
                </p>
                <p className="font-body-md font-semibold text-primary">{invoice.ownerName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.ownerEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">{t("invoiceDetail.timeline")}</h2>
            <div className="space-y-4">
              {invoice.timeline.map((item) => (
                <div className="flex items-start gap-3" key={item.key}>
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${item.active ? "bg-secondary" : "bg-outline-variant"}`}
                  />
                  <div>
                    <p className="text-body-sm font-semibold text-primary">{item.label}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">
                      {item.at ? formatDate(item.at, locale) : t("invoiceDetail.notYet")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
