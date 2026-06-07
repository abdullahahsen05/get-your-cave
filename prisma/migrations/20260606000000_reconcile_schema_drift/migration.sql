-- Phase 0.5: Reconcile schema drift from migration 20260531010000_add_stripe_connect_and_temporary_documents.
--
-- KEEP (already in DB, now added to schema.prisma):
--   User.stripeCustomerId
--   Booking.stripeCheckoutSessionId, Booking.stripeSubscriptionId
--   Contract.startDate, Contract.pdfUrl, Contract.signedAt
--   Payment.stripeInvoiceId, Payment.stripeSubscriptionId
--   Invoice.stripeInvoiceId
--   TemporaryDocument table + enums (TemporaryDocumentType, TemporaryDocumentStatus)
--   BookingStatus: DOCUMENTS_REQUIRED, ADMIN_REVIEW
--   ContractStatus: PENDING_DOCUMENTS, ADMIN_REVIEW, APPROVED
--
-- DROP (Stripe Connect fields removed from MVP + redundant *Cents/tenantId columns):

-- Remove Stripe Connect columns from User
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "stripeConnectAccountId",
  DROP COLUMN IF EXISTS "stripeOnboardingComplete",
  DROP COLUMN IF EXISTS "stripePayoutsEnabled";

-- Drop the unique index that was created alongside stripeConnectAccountId
DROP INDEX IF EXISTS "User_stripeConnectAccountId_key";

-- Remove redundant columns from Booking
ALTER TABLE "Booking"
  DROP COLUMN IF EXISTS "tenantId",
  DROP COLUMN IF EXISTS "monthlyPriceCents",
  DROP COLUMN IF EXISTS "contractId";

-- Remove redundant columns from Payment
ALTER TABLE "Payment"
  DROP COLUMN IF EXISTS "tenantId",
  DROP COLUMN IF EXISTS "ownerId",
  DROP COLUMN IF EXISTS "amountCents",
  DROP COLUMN IF EXISTS "platformFeeCents",
  DROP COLUMN IF EXISTS "ownerAmountCents";
