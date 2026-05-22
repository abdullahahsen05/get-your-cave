import { ContractType } from "@prisma/client";

import { createTranslator, defaultLocale, type Locale } from "@/lib/i18n";

export const CONTRACT_TEMPLATE_FILE_NAMES: Record<ContractType, string> = {
  LONG_TERM_RENTAL: "GYC_Contrat_Location_Longue_Duree.template.docx",
  SEASONAL_RENTAL: "GYC_Contrat_Location_Saisonniere.template.docx",
  PLATFORM_INTRODUCTION: "GYC_Contrat_Mise_En_Relation.template.docx",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  LONG_TERM_RENTAL: "Long-term rental",
  SEASONAL_RENTAL: "Seasonal rental",
  PLATFORM_INTRODUCTION: "Platform introduction",
};

export function getContractTypeLabel(
  contractType: ContractType,
  locale: Locale = defaultLocale,
) {
  const t = createTranslator(locale);
  return t(`contracts.types.${contractType}`);
}

export function getContractTypeBadge(
  contractType: ContractType,
  locale: Locale = defaultLocale,
) {
  const t = createTranslator(locale);
  return t(`contracts.badges.${contractType}`);
}

export function inferContractTypeFromBooking(durationMonths: number | null | undefined) {
  if (typeof durationMonths === "number" && durationMonths <= 6) {
    return ContractType.SEASONAL_RENTAL;
  }

  return ContractType.LONG_TERM_RENTAL;
}
