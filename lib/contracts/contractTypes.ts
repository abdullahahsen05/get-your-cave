import { ContractType } from "@prisma/client";

export const CONTRACT_TEMPLATE_FILE_NAMES: Record<ContractType, string> = {
  LONG_TERM_RENTAL: "GYC_Contrat_Location_Longue_Duree.template.docx",
  SEASONAL_RENTAL: "GYC_Contrat_Location_Saisonniere.template.docx",
  PLATFORM_INTRODUCTION: "GYC_Contrat_Mise_En_Relation.template.docx",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  LONG_TERM_RENTAL: "Long Term Rental",
  SEASONAL_RENTAL: "Seasonal Rental",
  PLATFORM_INTRODUCTION: "Platform Introduction",
};

export const CONTRACT_TYPE_BADGES: Record<ContractType, string> = {
  LONG_TERM_RENTAL: "LONG TERM",
  SEASONAL_RENTAL: "SEASONAL",
  PLATFORM_INTRODUCTION: "INTRODUCTION",
};

export function getContractTypeLabel(contractType: ContractType) {
  return CONTRACT_TYPE_LABELS[contractType];
}

export function getContractTypeBadge(contractType: ContractType) {
  return CONTRACT_TYPE_BADGES[contractType];
}

export function inferContractTypeFromBooking(durationMonths: number | null | undefined) {
  if (typeof durationMonths === "number" && durationMonths <= 6) {
    return ContractType.SEASONAL_RENTAL;
  }

  return ContractType.LONG_TERM_RENTAL;
}

