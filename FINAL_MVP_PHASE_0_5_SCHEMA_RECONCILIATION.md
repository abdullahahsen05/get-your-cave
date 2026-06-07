# GetYourCave — Phase 0.5: Schema Reconciliation

> **Status:** ✅ COMPLETE — Implementation applied and validated.
> **Date:** 2026-06-06
> **Result:** 10 migrations applied, DB and schema.prisma in sync, TypeScript clean, Next.js production build passing.

---

## 1. Migration Status Findings

```
npx prisma migrate status
→ "9 migrations found in prisma/migrations"
→ "Database schema is up to date!"
```

**What "up to date" means here:** All 9 migration SQL files have been executed against the local PostgreSQL database. Prisma's internal `_prisma_migrations` tracking table is clean — no pending or failed migrations.

**What "up to date" does NOT mean:** It does NOT mean `schema.prisma` matches the DB. `prisma migrate status` only checks whether migration SQL files have been applied — it does not diff `schema.prisma` against the live DB.

**Root cause of drift:** Migration 9 (`20260531010000_add_stripe_connect_and_temporary_documents`) was applied to the DB. Then the corresponding `schema.prisma` changes were **reverted** (the two most recent git commits). The migration SQL remains in `prisma/migrations/` (so Prisma considers it "applied") but `schema.prisma` no longer reflects what that SQL added.

**Result:** `schema.prisma` is a strict subset of the actual DB. Running `npx prisma db pull --print` reveals 26 items in the DB that `schema.prisma` does not know about.

---

## 2. Full Drift Inventory

Items sourced from `npx prisma db pull --print` output vs current `schema.prisma`.

### 2.1 Extra columns on existing tables

| Table | Column | DB type | In schema.prisma? | Decision |
|---|---|---|---|---|
| `User` | `stripeCustomerId` | `TEXT` | ❌ | **ADOPT** — useful for Stripe customer lookup |
| `User` | `stripeConnectAccountId` | `TEXT UNIQUE` | ❌ | **DROP** — Stripe Connect removed from MVP |
| `User` | `stripeOnboardingComplete` | `BOOLEAN DEFAULT false` | ❌ | **DROP** — Stripe Connect removed from MVP |
| `User` | `stripePayoutsEnabled` | `BOOLEAN DEFAULT false` | ❌ | **DROP** — Stripe Connect removed from MVP |
| `Booking` | `tenantId` | `TEXT` | ❌ | **DROP** — redundant (booking.renter relation serves this) |
| `Booking` | `monthlyPriceCents` | `INTEGER` | ❌ | **DROP** — redundant (Decimal `monthlyPrice` already exists) |
| `Booking` | `stripeCheckoutSessionId` | `TEXT` | ❌ | **ADOPT** — useful session reference at booking level |
| `Booking` | `stripeSubscriptionId` | `TEXT` | ❌ | **ADOPT** — needed for subscription lifecycle tracking |
| `Booking` | `contractId` | `TEXT` | ❌ | **DROP** — redundant (`generatedContract` and `contracts` relations exist) |
| `Contract` | `startDate` | `TIMESTAMP(3)` | ❌ | **ADOPT** — useful for BoldSign contract data (Phase 4) |
| `Contract` | `pdfUrl` | `TEXT` | ❌ | **ADOPT** — will store BoldSign-uploaded PDF URL (Phase 4) |
| `Contract` | `signedAt` | `TIMESTAMP(3)` | ❌ | **ADOPT** — BoldSign fully-signed timestamp (Phase 4) |
| `Payment` | `tenantId` | `TEXT` | ❌ | **DROP** — redundant (via booking.renter) |
| `Payment` | `ownerId` | `TEXT` | ❌ | **DROP** — redundant (via booking.owner) |
| `Payment` | `amountCents` | `INTEGER` | ❌ | **DROP** — redundant (Decimal `amount` already exists) |
| `Payment` | `platformFeeCents` | `INTEGER` | ❌ | **DROP** — redundant (Decimal `platformCommission` already exists) |
| `Payment` | `ownerAmountCents` | `INTEGER` | ❌ | **DROP** — redundant (Decimal `ownerAmount` already exists) |
| `Payment` | `stripeInvoiceId` | `TEXT UNIQUE` | ❌ | **ADOPT** — Stripe invoice correlation for subscription billing |
| `Payment` | `stripeSubscriptionId` | `TEXT` | ❌ | **ADOPT** — subscription lifecycle correlation |
| `Invoice` | `stripeInvoiceId` | `TEXT UNIQUE` | ❌ | **ADOPT** — Stripe invoice correlation |

**Summary: 20 extra columns — 10 DROP, 10 ADOPT**

### 2.2 Extra table

| Table | In schema.prisma? | Decision |
|---|---|---|
| `TemporaryDocument` | ❌ | **ADOPT** — phase 2 uses this for contract-finalization document uploads. Already has `ownerId`, `bookingId`, `type`, `fileUrl`, `status`, `expiresAt`, `deletedAt`. No FK constraints in the migration SQL (soft references only). |

**Summary: 1 extra table — ADOPT**

### 2.3 Extra enum values

| Enum | Extra value(s) in DB | In schema.prisma? | Decision |
|---|---|---|---|
| `BookingStatus` | `DOCUMENTS_REQUIRED` | ❌ | **ADOPT** — Phase 2 uses it (owner must upload docs before contract proceeds) |
| `BookingStatus` | `ADMIN_REVIEW` | ❌ | **ADOPT** — Phase 2 uses it (admin reviews uploaded docs) |
| `ContractStatus` | `PENDING_DOCUMENTS` | ❌ | **ADOPT** — Phase 2 uses it (contract waiting for owner doc upload) |
| `ContractStatus` | `ADMIN_REVIEW` | ❌ | **ADOPT** — Phase 2 uses it (admin reviewing docs before contract proceeds) |
| `ContractStatus` | `APPROVED` | ❌ | **ADOPT** — Phase 2 uses it (admin approved docs, contract can proceed) |

Note: `BookingStatus.CANCELLED` was also added by migration 9. It is already present in `schema.prisma` (added via a separate code path or the same migration). **No action needed for CANCELLED.**

**Summary: 5 extra enum values — all ADOPT**

### 2.4 Extra enums (new)

| Enum | Values | In schema.prisma? | Decision |
|---|---|---|---|
| `TemporaryDocumentStatus` | `PENDING`, `APPROVED`, `REJECTED` | ❌ | **ADOPT** — used by `TemporaryDocument.status` |
| `TemporaryDocumentType` | `IDENTITY`, `OWNERSHIP_PROOF` | ❌ | **ADOPT** — used by `TemporaryDocument.type`; will extend with more values in Phase 2 if needed |

**Summary: 2 extra enums — both ADOPT**

---

## 3. Impact of NOT Reconciling

If reconciliation is skipped and `prisma migrate dev` is run to add new MVP fields:

1. Prisma diffs `schema.prisma` (missing 26 items) against the live DB (has them).
2. Prisma **auto-generates DROP statements** for all 26 orphaned items.
3. That migration would destroy data in `TemporaryDocument`, `Booking.stripeSubscriptionId`, `Payment.stripeInvoiceId`, etc.
4. It would also emit a warning about being unable to drop PostgreSQL enum values (Postgres does not allow `DROP VALUE` from enums — so the extra `BookingStatus`/`ContractStatus` values would be left behind, causing a permanent unsupported-value error in Prisma's enum handling if rows ever reference them).

**This is a data-loss and schema-corruption risk.**

---

## 4. Reconciliation Strategy

Two-step approach (safe, additive-first):

### Step 1 — Update `schema.prisma` to reflect all ADOPT decisions

Add to `schema.prisma` every item marked **ADOPT** above. This makes `schema.prisma` a superset of what we want going forward.

After this step, `schema.prisma` will exactly match the current DB for the KEEP items, and will only differ from the DB in the DROP items (which we deliberately exclude from schema).

### Step 2 — Create one cleanup migration to DROP the 10 unwanted columns

Migration name: `20260606000000_reconcile_schema_drift`

This migration explicitly drops only the items marked **DROP** — the Stripe Connect fields and redundant `*Cents`/`tenantId` columns. After it runs, the DB matches `schema.prisma` exactly.

After running `prisma migrate dev` post-step-1, Prisma will compute the diff as only the DROP items → the auto-generated SQL will match exactly what we want. Alternatively, create the migration SQL manually (shown in §5) to maintain full control.

---

## 5. Reconciliation Migration SQL (ready to use — NOT yet applied)

File to create: `prisma/migrations/20260606000000_reconcile_schema_drift/migration.sql`

```sql
-- Phase 0.5: Remove Stripe Connect columns and redundant *Cents / tenantId columns.
-- All TemporaryDocument, enum additions, and useful Stripe IDs are KEPT (already in DB).
-- This migration makes the DB match the updated schema.prisma.

-- Remove Stripe Connect fields from User
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
```

**Note on `User.stripeCustomerId`:** This field is **ADOPT** (kept) and is NOT dropped. It will be added to `schema.prisma`.

**Note on enum values:** PostgreSQL does not support `DROP VALUE` from an existing enum. The adopted enum values (`DOCUMENTS_REQUIRED`, `ADMIN_REVIEW`, `PENDING_DOCUMENTS`, `APPROVED`) stay in the DB and will be referenced in Phase 2. No migration SQL is needed for them — they only need to be added to `schema.prisma`.

---

## 6. Required `schema.prisma` Changes (ADOPT list)

The following must be added to `schema.prisma` before the cleanup migration is created. This is read-only documentation — actual file edit happens during Phase 0.5 implementation.

### 6.1 User model — add `stripeCustomerId`
```prisma
model User {
  // ... existing fields ...
  stripeCustomerId          String?   // Stripe customer ID for payment lookup
  // DROP: stripeConnectAccountId, stripeOnboardingComplete, stripePayoutsEnabled
}
```

### 6.2 Booking model — add `stripeCheckoutSessionId`, `stripeSubscriptionId`
```prisma
model Booking {
  // ... existing fields ...
  stripeCheckoutSessionId   String?   // Initial checkout session reference
  stripeSubscriptionId      String?   // Active subscription ID for recurring billing
  // DROP: tenantId, monthlyPriceCents, contractId
}
```

### 6.3 Contract model — add `startDate`, `pdfUrl`, `signedAt`
```prisma
model Contract {
  // ... existing fields ...
  startDate    DateTime?  // Rental start date (for BoldSign contract data)
  pdfUrl       String?    // BoldSign-uploaded PDF URL (pre-signature)
  signedAt     DateTime?  // BoldSign fully-signed timestamp
}
```

### 6.4 Payment model — add `stripeInvoiceId`, `stripeSubscriptionId`
```prisma
model Payment {
  // ... existing fields ...
  stripeInvoiceId      String?  @unique  // Stripe invoice ID for subscription billing
  stripeSubscriptionId String?           // Subscription correlation
  // DROP: tenantId, ownerId, amountCents, platformFeeCents, ownerAmountCents
}
```

### 6.5 Invoice model — add `stripeInvoiceId`
```prisma
model Invoice {
  // ... existing fields ...
  stripeInvoiceId  String?  @unique  // Stripe invoice correlation
}
```

### 6.6 New model: `TemporaryDocument`
```prisma
model TemporaryDocument {
  id        String                  @id @default(uuid())
  ownerId   String                  // References OwnerProfile.id (soft FK — no cascade)
  bookingId String?                 // References Booking.id (soft FK — no cascade)
  type      TemporaryDocumentType
  fileUrl   String
  status    TemporaryDocumentStatus @default(PENDING)
  expiresAt DateTime
  deletedAt DateTime?
  createdAt DateTime                @default(now())
  updatedAt DateTime                @updatedAt

  @@index([ownerId])
  @@index([bookingId])
  @@index([status])
  @@index([expiresAt])
  @@index([deletedAt])
}
```

> **Why no Prisma relations on TemporaryDocument?** The original migration created no FK constraints. Adding Prisma relations here would require FK constraints which don't exist. For Phase 0.5, keep as soft references. Phase 2 can optionally add FK constraints via a dedicated migration.

### 6.7 New enum values on existing enums
```prisma
enum BookingStatus {
  // ... existing values ...
  DOCUMENTS_REQUIRED    // Owner must upload ID + ownership proof before contract proceeds
  ADMIN_REVIEW          // Admin is reviewing uploaded documents
}

enum ContractStatus {
  // ... existing values ...
  PENDING_DOCUMENTS     // Contract generation complete; waiting for owner to upload docs
  ADMIN_REVIEW          // Docs uploaded; admin reviewing before contract can proceed
  APPROVED              // Admin approved docs; contract can be sent for signature
}
```

### 6.8 New enums
```prisma
enum TemporaryDocumentType {
  IDENTITY
  OWNERSHIP_PROOF
}

enum TemporaryDocumentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 7. Post-Reconciliation State

After Phase 0.5 implementation is applied:

| Item | DB | schema.prisma | Prisma Client |
|---|---|---|---|
| `User.stripeCustomerId` | ✅ | ✅ | ✅ queryable |
| `User.stripeConnectAccountId` | ❌ dropped | ❌ | ❌ |
| `User.stripeOnboardingComplete` | ❌ dropped | ❌ | ❌ |
| `User.stripePayoutsEnabled` | ❌ dropped | ❌ | ❌ |
| `Booking.stripeCheckoutSessionId` | ✅ | ✅ | ✅ queryable |
| `Booking.stripeSubscriptionId` | ✅ | ✅ | ✅ queryable |
| `Booking.tenantId` | ❌ dropped | ❌ | ❌ |
| `Booking.monthlyPriceCents` | ❌ dropped | ❌ | ❌ |
| `Booking.contractId` | ❌ dropped | ❌ | ❌ |
| `Contract.startDate` | ✅ | ✅ | ✅ queryable |
| `Contract.pdfUrl` | ✅ | ✅ | ✅ queryable |
| `Contract.signedAt` | ✅ | ✅ | ✅ queryable |
| `Payment.stripeInvoiceId` | ✅ | ✅ | ✅ queryable |
| `Payment.stripeSubscriptionId` | ✅ | ✅ | ✅ queryable |
| `Payment.tenantId/ownerId/*Cents` | ❌ dropped | ❌ | ❌ |
| `Invoice.stripeInvoiceId` | ✅ | ✅ | ✅ queryable |
| `TemporaryDocument` table | ✅ | ✅ | ✅ queryable |
| `TemporaryDocumentType` enum | ✅ | ✅ | ✅ |
| `TemporaryDocumentStatus` enum | ✅ | ✅ | ✅ |
| `BookingStatus.DOCUMENTS_REQUIRED` | ✅ | ✅ | ✅ |
| `BookingStatus.ADMIN_REVIEW` | ✅ | ✅ | ✅ |
| `ContractStatus.PENDING_DOCUMENTS` | ✅ | ✅ | ✅ |
| `ContractStatus.ADMIN_REVIEW` | ✅ | ✅ | ✅ |
| `ContractStatus.APPROVED` | ✅ | ✅ | ✅ |

`prisma migrate status` will show 10 migrations, all applied. `schema.prisma` and DB will be in full sync. `prisma migrate dev` will produce no diff until the next intentional schema change (Phase 1 or 2).

---

## 8. New Fields Needed by MVP Phases (not in DB yet — future migrations only)

These do NOT exist in the DB today. They will be added in subsequent phase migrations:

| Phase | Field / Model | Notes |
|---|---|---|
| Phase 3 | `WithdrawalRequest` model | New model: `id`, `ownerId`, `amount`, `status` (new enum), `iban`, `bankName`, `accountHolder`, `requestedAt`, `processedAt`, `adminNote`, `paymentReference` |
| Phase 3 | `OwnerProfile.bankName`, `OwnerProfile.accountHolder`, `OwnerProfile.bicSwift` | Supplement existing `OwnerProfile.iban` |
| Phase 4 | `GeneratedContract.boldsignDocumentId` | BoldSign document/request ID |
| Phase 4 | `GeneratedContract.auditTrailUrl` | BoldSign audit trail URL |
| Phase 4 | `GeneratedContract.signatureProvider` | `BOLDSIGN` \| `IN_APP` (for transition) |
| Phase 4 | `ContractStatus.OWNER_SIGNED`, `TENANT_SIGNED`, `SIGNATURE_FAILED` | Additional signing states |
| Phase 5 | `User.phoneVerified` Boolean | Phone OTP verified flag |
| Phase 5 | `User.phoneVerifiedAt` DateTime? | Timestamp of verification |
| Phase 5 | `PhoneVerification` model | OTP challenges (mirrors `LoginChallenge`) |

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Developer accidentally runs `prisma migrate dev` before Phase 0.5 implementation | 🔴 | Do Phase 0.5 implementation immediately as next step. Add a note to CLAUDE.md or team docs. |
| `TemporaryDocument` has no FK constraints in DB | 🟡 | Adopt as soft references now; Phase 2 adds FK constraints via a new migration if needed. |
| Enum values cannot be dropped in Postgres | 🟢 | All extra enum values are intentionally adopted; no DROP needed. |
| Data in orphaned columns (tenantId, *Cents) | 🟢 | All these columns are nullable and never populated by the current codebase (which never referenced them since schema.prisma excluded them). Safe to drop. |
| `Contract.pdfUrl` vs `Contract.generatedPdfUrl` naming collision | 🟡 | Both exist in schema after adoption (`pdfUrl` from migration 9, `generatedPdfUrl` already in schema). Phase 4 must clarify which field BoldSign uses. Recommendation: use `pdfUrl` for BoldSign upload, `generatedPdfUrl` for local DOCX path. Document this distinction clearly. |

---

## 10. Implementation Checklist (Phase 0.5 — COMPLETE)

- [x] Update `prisma/schema.prisma` — added all 16 ADOPT items
- [x] Create `prisma/migrations/20260606000000_reconcile_schema_drift/migration.sql`
- [x] `npx prisma validate` → **"The schema at prisma/schema.prisma is valid 🚀"**
- [x] `npx prisma migrate dev --name reconcile_schema_drift` → **"Applying migration 20260606000000_reconcile_schema_drift — Your database is now in sync with your schema."** No unexpected additional diff generated.
- [x] `npx prisma generate` → **"Generated Prisma Client (v7.8.0) in 510ms"**
- [x] `npx prisma migrate status` → **"10 migrations found in prisma/migrations — Database schema is up to date!"**
- [x] `npx tsc --noEmit` → **Zero errors (no output)**
- [x] `npx next build` → **"✓ Compiled successfully in 11.4s — 80 routes, all passing"**

## 11. Files Changed in Phase 0.5 Implementation

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added 16 ADOPT items: 1 User field, 2 Booking fields, 3 Contract fields, 2 Payment fields, 1 Invoice field, `TemporaryDocument` model, 2 new enums, 5 new enum values |
| `prisma/migrations/20260606000000_reconcile_schema_drift/migration.sql` | New file — drops 10 Stripe Connect / redundant columns |
| `FINAL_MVP_IMPLEMENTATION_PLAN.md` | Updated client clarifications (SMS=Twilio, local storage confirmed, listing approval=none, doc retention=no auto-delete) |
| `FINAL_MVP_PHASE_0_5_SCHEMA_RECONCILIATION.md` | Updated status + checklist to reflect completed implementation |

## 12. Remaining Risks (post-reconciliation)

| Risk | Severity | Status |
|---|---|---|
| `TemporaryDocument` has no FK constraints in DB (soft refs) | 🟡 | Accepted for MVP; Phase 2 can add FK constraints if needed |
| `Contract.pdfUrl` vs `Contract.generatedPdfUrl` co-exist | 🟡 | Documented: `pdfUrl` for BoldSign upload URL, `generatedPdfUrl` for local DOCX path. Phase 4 must use the right field. |
| Wallet-balance floor policy undefined | 🟡 | Awaiting client confirmation before Phase 3 |
| SMS provider Twilio — rate limiting / abuse protection | 🟡 | Must be designed in Phase 5 |
| BoldSign delivery method (email vs embedded) | 🟡 | Awaiting client confirmation before Phase 4 |
| Final contract legal text not provided | 🟡 | Must be supplied before Phase 4 |

## 13. Safe to Proceed to Phase 1

**Yes.** All schema and DB reconciliation is complete. `prisma migrate status` reports 10 migrations in sync. TypeScript and build are clean. No app code was changed. Phase 1 (remove mandatory verification before listing creation) can proceed immediately.
