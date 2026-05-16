import Link from "next/link";

import GenerateInvoiceButton from "@/components/invoices/GenerateInvoiceButton";
import {
  formatCurrency,
} from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "@/lib/invoices/invoiceTypes";
import type { SafeInvoice } from "@/lib/invoices/generateInvoice";

type Props = {
  invoice: SafeInvoice;
  canGenerate: boolean;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoiceDetailPage({ invoice, canGenerate }: Props) {
  return (
    <main className="min-h-screen bg-background text-on-background pt-32 pb-24 mx-auto max-w-[1280px] px-6">
      <div className="mb-6 flex flex-col gap-2">
        <Link className="text-body-sm font-body-sm text-primary hover:underline" href="/invoices">
          ← Back to invoices
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
              Invoice detail
            </p>
            <h1 className="font-h1 text-h1 text-primary">{invoice.invoiceNumber}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
              Booking {invoice.bookingNumber} · {invoice.bookingTitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
            >
              {getInvoiceStatusLabel(invoice.status)}
            </span>
            {canGenerate ? (
              <GenerateInvoiceButton
                bookingId={invoice.bookingId}
                className="bg-primary text-on-primary"
                label="Generate / Refresh"
              />
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Booking
                </p>
                <h2 className="font-h3 text-h3 text-primary">{invoice.bookingTitle}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  {invoice.bookingAddress}, {invoice.bookingCity}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  Storage type: {invoice.bookingStorageType}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Dates
                </p>
                <div className="space-y-1 text-body-sm font-body-sm text-on-surface">
                  <p>Issued: {formatDate(invoice.issuedAt)}</p>
                  <p>Due: {formatDate(invoice.dueAt)}</p>
                  <p>Paid: {formatDate(invoice.paidAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="font-h3 text-h3 text-primary">Payment breakdown</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                Currency: {invoice.currency.toUpperCase()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#EBEBE8]">
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Description
                    </th>
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Qty
                    </th>
                    <th className="py-3 text-[10px] uppercase tracking-widest text-on-surface-variant text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE8]">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <p className="font-body-sm font-semibold text-primary">{item.description}</p>
                        <p className="text-body-sm font-body-sm text-on-surface-variant">
                          Itemized invoice line
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
          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">Summary</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Subtotal
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.subtotal, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Platform fee
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.platformFee, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Taxes
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.taxAmount, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Security deposit
                </span>
                <span className="text-body-sm font-semibold text-primary">
                  {formatCurrency(invoice.securityDeposit, invoice.currency.toUpperCase())}
                </span>
              </div>

              <div className="pt-4 border-t border-[#EBEBE8] flex items-center justify-between gap-4">
                <span className="font-body-md font-semibold text-primary">Total</span>
                <span className="font-h3 text-h3 text-primary">
                  {formatCurrency(invoice.totalAmount, invoice.currency.toUpperCase())}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">People</h2>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Renter
                </p>
                <p className="font-body-md font-semibold text-primary">{invoice.renterName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.renterEmail}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Owner
                </p>
                <p className="font-body-md font-semibold text-primary">{invoice.ownerName}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{invoice.ownerEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
            <h2 className="font-h3 text-h3 text-primary mb-6">Timeline</h2>
            <div className="space-y-4">
              {invoice.timeline.map((item) => (
                <div className="flex items-start gap-3" key={item.key}>
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${item.active ? "bg-secondary" : "bg-outline-variant"}`}
                  />
                  <div>
                    <p className="text-body-sm font-semibold text-primary">{item.label}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">
                      {item.at ? formatDate(item.at) : "Not yet"}
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
