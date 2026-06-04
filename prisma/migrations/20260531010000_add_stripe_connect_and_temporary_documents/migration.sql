ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'DOCUMENTS_REQUIRED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'PENDING_DOCUMENTS';
ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW';
ALTER TYPE "ContractStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

DO $$ BEGIN
  CREATE TYPE "TemporaryDocumentType" AS ENUM ('IDENTITY', 'OWNERSHIP_PROOF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TemporaryDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
ADD COLUMN IF NOT EXISTS "monthlyPriceCents" INTEGER,
ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "contractId" TEXT;

ALTER TABLE "Contract"
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT,
ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);

ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
ADD COLUMN IF NOT EXISTS "ownerId" TEXT,
ADD COLUMN IF NOT EXISTS "amountCents" INTEGER,
ADD COLUMN IF NOT EXISTS "platformFeeCents" INTEGER,
ADD COLUMN IF NOT EXISTS "ownerAmountCents" INTEGER,
ADD COLUMN IF NOT EXISTS "stripeInvoiceId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "stripeInvoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

CREATE TABLE IF NOT EXISTS "TemporaryDocument" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "TemporaryDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "TemporaryDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemporaryDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TemporaryDocument_ownerId_idx" ON "TemporaryDocument"("ownerId");
CREATE INDEX IF NOT EXISTS "TemporaryDocument_bookingId_idx" ON "TemporaryDocument"("bookingId");
CREATE INDEX IF NOT EXISTS "TemporaryDocument_status_idx" ON "TemporaryDocument"("status");
CREATE INDEX IF NOT EXISTS "TemporaryDocument_expiresAt_idx" ON "TemporaryDocument"("expiresAt");
CREATE INDEX IF NOT EXISTS "TemporaryDocument_deletedAt_idx" ON "TemporaryDocument"("deletedAt");
