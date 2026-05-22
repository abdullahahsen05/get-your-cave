import { InvoiceStatus } from "@prisma/client";

import { createTranslator, defaultLocale, type Locale } from "@/lib/i18n";

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  DRAFT:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  ISSUED:
    "bg-primary-container/20 text-primary border border-primary-container/40",
  PAID:
    "bg-secondary-container/20 text-on-secondary-container border border-secondary-container/40",
  OVERDUE:
    "bg-error-container/20 text-error border border-error-container/40",
  REFUNDED:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  CANCELLED:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
};

export const INVOICE_STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export function getInvoiceStatusLabel(status: InvoiceStatus, locale: Locale = defaultLocale) {
  const t = createTranslator(locale);
  return t(`status.invoice.${status}`);
}

export function getInvoiceStatusOptions(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);

  return [
    { label: t("common.allStatuses"), value: "" },
    { label: t("status.invoice.DRAFT"), value: "DRAFT" },
    { label: t("status.invoice.ISSUED"), value: "ISSUED" },
    { label: t("status.invoice.PAID"), value: "PAID" },
    { label: t("status.invoice.OVERDUE"), value: "OVERDUE" },
    { label: t("status.invoice.REFUNDED"), value: "REFUNDED" },
    { label: t("status.invoice.CANCELLED"), value: "CANCELLED" },
  ] as const;
}

export function getInvoiceStatusClass(status: InvoiceStatus) {
  return INVOICE_STATUS_CLASSES[status] ?? INVOICE_STATUS_CLASSES.DRAFT;
}

export function normalizeInvoiceStatusFilter(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "ISSUED" ||
    normalized === "PAID" ||
    normalized === "OVERDUE" ||
    normalized === "REFUNDED" ||
    normalized === "CANCELLED"
  ) {
    return normalized as InvoiceStatus;
  }

  if (normalized === "PENDING") {
    return "DRAFT" as InvoiceStatus;
  }

  return null;
}

export function normalizeInvoiceSort(value: string | null | undefined) {
  return value?.toLowerCase() === "oldest" ? "oldest" : "newest";
}
