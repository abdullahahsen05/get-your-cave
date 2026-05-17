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

export const verificationDocumentTypeLabels: Record<
  VerificationDocumentType,
  string
> = {
  ID_CARD: "ID Card",
  PASSPORT: "Passport",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  CONTRACT: "Contract",
  SIGNED_CONTRACT: "Signed Contract",
  PROFILE_PHOTO: "Profile Photo",
  OTHER: "Other",
};

export const verificationStatusLabels: Record<VerificationStatusValue, string> = {
  NOT_SUBMITTED: "NOT SUBMITTED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

