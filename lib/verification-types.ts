import { createTranslator, defaultLocale, type Locale } from "@/lib/i18n";

export const VERIFICATION_DOCUMENT_TYPES = [
  "ID_CARD",
  "PASSPORT",
  "PROOF_OF_OWNERSHIP",
  "INSURANCE_CERTIFICATE",
  "CONTRACT",
  "SIGNED_CONTRACT",
  "PROFILE_PHOTO",
  "OTHER",
] as const;

export type VerificationDocumentType =
  (typeof VERIFICATION_DOCUMENT_TYPES)[number];

export const VERIFICATION_STATUSES = [
  "NOT_SUBMITTED",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type VerificationStatusValue = (typeof VERIFICATION_STATUSES)[number];

export function getVerificationDocumentTypeLabel(
  type: VerificationDocumentType,
  locale: Locale = defaultLocale,
) {
  const t = createTranslator(locale);
  return t(`verification.documentTypes.${type}`);
}

export function getVerificationStatusLabel(
  status: VerificationStatusValue,
  locale: Locale = defaultLocale,
) {
  const t = createTranslator(locale);
  return t(`status.verification.${status}`);
}

export function getVerificationDocumentTypeOptions(locale: Locale = defaultLocale) {
  const t = createTranslator(locale);

  return VERIFICATION_DOCUMENT_TYPES.map((type) => ({
    label: t(`verification.documentTypes.${type}`),
    value: type,
  }));
}
