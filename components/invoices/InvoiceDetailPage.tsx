"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import GenerateInvoiceButton from "@/components/invoices/GenerateInvoiceButton";
import StripeCheckoutButton from "@/components/payments/StripeCheckoutButton";
import { formatCurrency } from "@/lib/invoices/formatCurrency";
import { getInvoiceStatusClass, getInvoiceStatusLabel } from "@/lib/invoices/invoiceTypes";
import { normalizeLocale } from "@/lib/i18n";
import { formatStorageTypeLabel } from "@/lib/storage-types";
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

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5 border border-outline-variant/60">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-body-sm font-semibold text-primary">{value}</p>
    </div>
  );
}

function formatSplitAmount(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return formatCurrency(value, "EUR");
}

export default function InvoiceDetailPage({ invoice, canGenerate, canPay }: Props) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);

  return (
    <main className="mx-auto min-h-screen max-w-[1380px] bg-background px-4 pb-24 pt-28 text-on-surface sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
      <section className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link
            className="inline-flex items-center gap-2 text-body-sm font-body-sm text-secondary transition-colors hover:underline"
            href="/invoices"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t("invoiceDetail.backToInvoices")}
          </Link>

          <div className="space-y-3">
            <p className="font-label-caps text-label-caps uppercase tracking-[0.24em] text-secondary">
              {t("invoiceDetail.title")}
            </p>
            <h1 className="max-w-4xl font-h1 text-[clamp(2.4rem,4vw,4.8rem)] leading-[0.95] tracking-[-0.04em] text-primary">
              {invoice.invoiceNumber}
            </h1>
            <p className="max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
              {t("invoiceDetail.bookingLabel", {
                bookingNumber: invoice.bookingNumber,
                title: invoice.bookingTitle,
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
          >
            {getInvoiceStatusLabel(invoice.status, locale)}
          </span>
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary-container/20"
            href={`/api/invoices/${invoice.id}/pdf`}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {t("invoiceDetail.download")}
          </a>
          {canGenerate ? (
            <GenerateInvoiceButton
              bookingId={invoice.bookingId}
              className="w-full rounded-full bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f] sm:w-auto"
              label={t("invoiceDetail.generateRefresh")}
            />
          ) : null}
          {canPay ? (
            <StripeCheckoutButton
              bookingId={invoice.bookingId}
              className="w-full rounded-full bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f] sm:w-auto"
              invoiceId={invoice.id}
              label={t("invoiceDetail.payNow")}
            />
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_420px] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoBlock
                label={t("invoiceDetail.booking")}
                value={invoice.bookingTitle}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBlock
                  label={t("invoiceDetail.issuedAt")}
                  value={formatDate(invoice.issuedAt, locale)}
                />
                <InfoBlock
                  label={t("invoiceDetail.dueAt")}
                  value={formatDate(invoice.dueAt, locale)}
                />
                <InfoBlock
                  label={t("invoiceDetail.paidAt")}
                  value={formatDate(invoice.paidAt, locale)}
                />
                <InfoBlock
                  label={t("invoiceDetail.storageTypeLabel")}
                  value={formatStorageTypeLabel(invoice.bookingStorageType, t)}
                />
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-surface-container-low p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 text-body-sm font-body-sm text-on-surface-variant sm:grid-cols-2">
                <p>{invoice.bookingAddress}</p>
                <p>{invoice.bookingCity}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-h3 text-h3 text-primary">{t("invoiceDetail.paymentBreakdown")}</h2>
                <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.currency", { currency: invoice.currency.toUpperCase() })}
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-body-sm font-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                <span>
                  {t("invoiceDetail.totalAmount")}{" "}
                  <strong className="font-semibold text-primary">
                    {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
                  </strong>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {invoice.items.map((item) => (
                <article
                  className="rounded-[24px] border border-outline-variant/60 bg-surface-container-low p-4 sm:p-5"
                  key={item.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-body-sm font-semibold text-primary">{item.description}</p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {t("invoiceDetail.itemizedLine")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span className="rounded-full border border-outline-variant/60 bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {t("invoiceDetail.quantity")} {item.quantity}
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {t("invoiceDetail.amount")}
                        </p>
                        <p className="mt-1 font-body-md font-semibold text-primary">
                          {formatCurrency(item.total, invoice.currency.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[120px]">
          <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6 lg:p-8">
            <h2 className="font-h3 text-h3 text-primary">{t("invoiceDetail.summary")}</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                <span className="font-body-md font-semibold text-primary">
                  {t("invoiceDetail.totalAmount")}
                </span>
                <span className="font-h3 text-h3 text-primary">
                  {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
                </span>
              </div>

              {invoice.payment ? (
                <div className="rounded-2xl border border-secondary/15 bg-secondary-container/15 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {t("invoiceDetail.paymentSplit")}
                  </p>
                  <div className="mt-3 grid gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-body-md font-semibold text-primary">{t("listingDetail.ownerShare")}</span>
                      <span className="font-body-md font-semibold text-primary">
                        {formatSplitAmount(invoice.payment.ownerAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-body-md font-semibold text-primary">
                        {t("listingDetail.platformCommission")}
                      </span>
                      <span className="font-body-md font-semibold text-primary">
                        {formatSplitAmount(invoice.payment.platformCommission)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6 lg:p-8">
            <h2 className="font-h3 text-h3 text-primary">{t("invoiceDetail.people")}</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {t("invoiceDetail.renter")}
                </p>
                <p className="mt-2 font-body-md font-semibold text-primary">{invoice.renterName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.renterEmail}</p>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {t("invoiceDetail.owner")}
                </p>
                <p className="mt-2 font-body-md font-semibold text-primary">{invoice.ownerName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.ownerEmail}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] sm:p-6 lg:p-8">
            <h2 className="font-h3 text-h3 text-primary">{t("invoiceDetail.timeline")}</h2>
            <div className="mt-6 space-y-4">
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
          </section>
        </aside>
      </section>
    </main>
  );
}
