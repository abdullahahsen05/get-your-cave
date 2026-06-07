-- Phase 4: Add BoldSign digital signature fields to GeneratedContract.
-- Also adds OWNER_SIGNED, TENANT_SIGNED, SIGNATURE_FAILED to ContractStatus enum.

ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'OWNER_SIGNED';
ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'TENANT_SIGNED';
ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'SIGNATURE_FAILED';

ALTER TABLE "GeneratedContract"
  ADD COLUMN IF NOT EXISTS "generatedPdfPath"     TEXT,
  ADD COLUMN IF NOT EXISTS "boldsignDocumentId"   TEXT,
  ADD COLUMN IF NOT EXISTS "signatureProvider"    TEXT,
  ADD COLUMN IF NOT EXISTS "signedPdfPath"        TEXT,
  ADD COLUMN IF NOT EXISTS "auditTrailPath"       TEXT,
  ADD COLUMN IF NOT EXISTS "ownerSignedAt"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tenantSignedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "signatureFailedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "lastBoldsignEventId"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedContract_boldsignDocumentId_key"
  ON "GeneratedContract"("boldsignDocumentId");
