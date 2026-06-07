# GetYourCave — Final MVP Implementation Plan

> **Status:** Updated after Phase 0.5 schema audit. No application code changed. No migrations applied. No packages installed. No DB altered.
> **Last updated:** 2026-06-06 (Phase 0.5)
> **Scope:** Plan to align the codebase with the finalized MVP (simplified onboarding, BoldSign signing, in-app owner wallet, SMS OTP, document verification at contract finalization).

---

## Client Clarifications (final — incorporated from agreed MVP scope)

| # | Question | Answer |
|---|---|---|
| 1 | DB drift reconciliation | Addressed in Phase 0.5 — see `FINAL_MVP_PHASE_0_5_SCHEMA_RECONCILIATION.md`. Schema.prisma must be updated and a cleanup migration written before any new migrations. |
| 2 | SMS provider | **Confirmed: Twilio.** WhatsApp is NOT part of MVP. Twilio Verify recommended for OTP (cost-per-verify, FR numbers supported). |
| 3 | Signed-PDF / audit-trail storage | **Confirmed: local storage for MVP.** Generated PDFs, signed PDFs, audit trails, and uploaded verification docs all use the existing local file pattern (`docs/` directory). Can migrate to S3 post-MVP. |
| 4 | Listing approval required before public display? | **Confirmed: No admin approval required.** Listings are publicly visible immediately. Owners can create listings immediately. No identity or ownership verification before listing creation. `PENDING_APPROVAL` status remains in schema but is not enforced. |
| 5 | Tenant SMS verification required? | **Not stated in MVP.** Assumed to apply to all users who provide a phone number. **Confirm whether SMS verification is mandatory for tenants before signing/payment.** |
| 6 | Owner wallet negative balance on refund | **Not specified.** Safe default: allow balance to go negative (reflect reality), display warning in admin. **Client must confirm floor policy before Phase 3.** |
| 7 | Identity document retention after admin review | **Confirmed: no auto-deletion for now.** Documents are NOT deleted automatically. Admin can delete manually after review if required. No auto-expiry in Phase 2. |
| 8 | Exact contract template / legal text | Current DOCX template used for Phase 4 PDF generation. **Client must supply final FR/EN rental contract text before Phase 4.** |
| 9 | BoldSign signing delivery (embedded vs emailed) | MVP flow shows owner → tenant signing chain. **Default: BoldSign emails each signer directly** (simpler, no embed). Can add embedded view later. **Confirm before Phase 4.** |
| 10 | Stripe Connect removal scope | **Confirmed: explicitly removed from MVP.** DB fields dropped in Phase 0.5 cleanup migration. Owner wallet + manual withdrawals replace Connect. |
| 11 | Existing in-app JSON signatures on cutover | In-app signatures (`GeneratedContract.contractData.signatures`) remain as historical records. No migration of existing data to BoldSign. New contracts from Phase 4 onward use BoldSign only. |

---

## 0. Files Inspected

**Schema & migrations**
- `prisma/schema.prisma`
- `prisma/migrations/*` (init, invoice management, generated contracts, messaging, archive/restore, login challenges, notification prefs, password reset, **`20260531010000_add_stripe_connect_and_temporary_documents`**)

**Auth / session / routing**
- `lib/auth.ts`, `lib/auth-routing.ts`, `lib/login-challenges.ts`
- `app/api/auth/login/route.ts`, `app/api/auth/login/verify/route.ts`, `app/api/auth/session/route.ts`, `app/api/auth/signup/route.ts`

**Listings**
- `app/api/listings/route.ts`, `lib/listings.ts` (referenced), `lib/validations/listing.ts`
- `app/create-listing/page.tsx`, `app/create-listing/layout.tsx`

**Verification / documents**
- `lib/verification.ts`, `lib/verification-types.ts`
- `app/api/verification/submit/route.ts`, `app/api/verification-documents/**`, `app/api/uploads/verification-documents/route.ts`
- `app/api/admin/verifications/**`, `app/document/**`

**Bookings & contracts**
- `lib/bookings.ts`
- `lib/contracts/{generateContract,loadTemplate,placeholderMapper,contractTypes}.ts`
- `app/api/contracts/{generate,[id]/sign,[id]/download}/route.ts`

**Payments / invoices / wallet**
- `app/api/payments/{checkout,webhook,export}/route.ts`
- `lib/payments/{confirmStripeSession,finalizeStripeCheckoutSession,syncRefundStatus}.ts`
- `lib/marketplace-split.ts`, `lib/stripe.ts`
- `lib/invoices/{calculateInvoice,generateInvoice,renderInvoicePdf,invoiceNumber,formatCurrency,invoiceTypes}.ts`
- `app/api/invoices/**`, `lib/dashboard/{owner,renter,revenue}.ts`

**Notifications / email / i18n / env**
- `lib/notifications.ts`, `lib/email.ts`, `lib/notifications-i18n.ts`
- `lib/i18n.ts`, `lib/i18n.server.ts`, `locales/en`, `locales/fr`
- Global `process.env.*` usage grep

**Admin**
- `app/admin/dashboard/page.tsx`, `app/admin/users/page.tsx`, `lib/admin.ts`, `lib/admin-shared.ts`

---

## 1. Current Implementation Summary

### 1.1 What already exists (and works)

| Area | State |
|---|---|
| **Auth** | Custom HMAC-signed JWT in `gyc_auth_token` cookie. Role-based (`ADMIN`/`OWNER`/`RENTER`). Email-based 2FA via `LoginChallenge` (only enforced in production). |
| **Listings** | Owners create listings immediately. `POST /api/listings` **only checks `role === OWNER` + ownerProfile** — *no verification gate already present.* Draft vs `PENDING_APPROVAL` schema branching. Admin approve/reject exists. |
| **Bookings** | Full booking lifecycle with commission/owner-amount fields precomputed. Contract + invoice auto-generation hooks present in `lib/bookings.ts`. |
| **Contracts** | DOCX generated server-side via `docxtemplater` from booking data. Rich placeholder mapper. **In-app signature** stored as JSON in `GeneratedContract.contractData.signatures` (owner + renter → `SIGNED`). No external e-sign provider. |
| **Payments** | Stripe **subscription**-based recurring checkout (`mode: "subscription"`), capped via `cancel_at`. Webhook handles checkout/invoice/refund/subscription events with extensive fallback recovery. |
| **Marketplace split** | `calculateMarketplaceSplit` already implements **20% platform / 80% owner** (`MARKETPLACE_COMMISSION_RATE = 0.2`). |
| **Owner wallet** | `OwnerProfile.walletBalance`, `pendingPayout`, `totalEarnings` **already exist** and are credited/decremented in the webhook on payment/refund. **No withdrawal request model or UI yet.** |
| **Invoices** | Invoice + InvoiceItem models, PDF rendering, numbering, export. Tenant-side invoices generated on payment. |
| **Notifications** | In-app `Notification` model + realtime socket emit; **email auto-sent** through `createNotificationForUser` when `emailNotificationsEnabled`. |
| **Email** | Nodemailer/SMTP transporter. Templated emails for notifications, login code, password reset. Gracefully no-ops if SMTP env missing. |
| **i18n** | EN/FR via `react-i18next`, `locales/en` + `locales/fr`. |
| **Admin** | Dashboard, users, listings approve/reject, verifications approve/reject, revenue, activity log (`AdminLog`). |
| **Verification docs** | `VerificationDocument` model + admin review. Currently an **account-level** flow (owner must submit ID_CARD + PROOF_OF_OWNERSHIP), driven by `requiredDocumentTypesForRole`. |

### 1.2 What conflicts with the new MVP

1. **DB / schema drift (HIGH).** Migration `20260531010000_add_stripe_connect_and_temporary_documents` added to the database:
   - `User.stripeConnectAccountId / stripeOnboardingComplete / stripePayoutsEnabled / stripeCustomerId`
   - `BookingStatus` values `DOCUMENTS_REQUIRED`, `ADMIN_REVIEW`; `ContractStatus` values `PENDING_DOCUMENTS`, `ADMIN_REVIEW`, `APPROVED`
   - `TemporaryDocument` table + `TemporaryDocumentType`/`TemporaryDocumentStatus` enums
   - extra `*Cents` columns on Booking/Payment, `Contract.startDate/pdfUrl/signedAt`, etc.

   **But the current `schema.prisma` does NOT contain any of these.** The last two git commits revert Stripe-Connect-related build changes. So the Prisma model and the live DB are **out of sync** (orphaned columns/enums in DB). This must be reconciled before any new migration.

2. **Stripe Connect remnants (MEDIUM).** Connect onboarding fields/migration exist but the MVP **explicitly removes full Stripe Connect / automatic payouts** in favor of the in-app wallet + manual withdrawals.

3. **Contract signing approach (HIGH).** Current signing is **in-app DOCX + JSON signatures**. MVP requires **BoldSign** with sequential signing, webhook, signed-PDF retrieval, audit trail. The current `ContractStatus` enum lacks `SENT_FOR_SIGNATURE` granularity required (`OWNER_SIGNED`, `TENANT_SIGNED`, `SIGNATURE_FAILED`).

4. **Verification timing (MEDIUM).** Owner verification (ID + ownership proof) is modeled as **account-level required documents**. MVP wants docs requested **only at contract finalization**, not at listing creation, and minimized retention.

5. **No SMS/OTP (HIGH gap, not a conflict).** No Twilio/Vonage/phone-OTP code anywhere. Only email 2FA exists. `User.phone` exists but there is **no `phoneVerified` field**.

### 1.3 What can be reused

- Marketplace split (20/80) — **reuse as-is**.
- Owner wallet balance fields + webhook crediting — **reuse, extend with withdrawal model**.
- Notification + email pipeline — **reuse, add new event types**.
- Contract data/placeholder mapper + DOCX generation — **reuse to produce the PDF that gets uploaded to BoldSign**.
- Invoice models + PDF rendering — **reuse, extend owner earnings statement**.
- Admin dashboard scaffolding + `AdminLog` — **reuse, add withdrawal/document/contract management panels**.
- `LoginChallenge` pattern (hashed code, attempts, expiry) — **reuse as a template for SMS OTP storage**.

### 1.4 What should be removed / disabled

- Full **Stripe Connect onboarding** path (fields can remain dormant or be dropped after confirmation — see risks).
- Any UI that gates **listing creation** behind verification (none found in API; confirm in any client gating).
- Eventually, the **in-app JSON signature** path once BoldSign is live (keep during transition behind a flag).

---

## 2. Gap Analysis by Requirement

> Risk legend: 🟢 low · 🟡 medium · 🔴 high

### Req 1 — Property listings (create immediately, no verification)
- **Current:** Already satisfied at API level (`app/api/listings/route.ts` only checks role). Listing displays publicly via `isPublished`/`status`.
- **Required change:** Confirm no client-side verification gate on `app/create-listing`. Confirm whether listings need admin approval before public display (open question — §6).
- **Affected files:** `app/create-listing/page.tsx`, `lib/listings.ts`, admin approve route.
- **DB:** none. **API:** none (verify). **Frontend:** possibly remove any "verify first" banners.
- **Risk:** 🟢

### Req 2 — Rental contract auto-generated from DB
- **Current:** `lib/contracts/generateContract.ts` builds DOCX from booking via `buildContractPlaceholderData`. Server-side only.
- **Required change:** Need a **PDF** (BoldSign uploads PDF). Currently output is DOCX. Add DOCX→PDF (or render PDF directly).
- **Affected files:** `lib/contracts/generateContract.ts`, new `lib/contracts/renderContractPdf.ts`, `app/api/contracts/generate/route.ts`.
- **DB:** none (uses existing). **API:** generate endpoint returns/stores PDF. **Frontend:** contract page shows PDF preview.
- **Risk:** 🟡 (PDF generation toolchain choice).

### Req 3 — Digital signature via BoldSign (sequential owner→tenant)
- **Current:** No BoldSign. In-app JSON signatures only. `ContractStatus` enum missing required states.
- **Required change:** New BoldSign client lib; upload PDF; create signing request with **sequential signer order**; store document/request ID; webhook for status; retrieve signed PDF + audit trail; access-control to Owner/Tenant/Admin.
- **Affected files (new):** `lib/contracts/boldsign.ts`, `app/api/contracts/[id]/send-for-signature/route.ts`, `app/api/contracts/boldsign-webhook/route.ts`, `app/api/contracts/[id]/signed-pdf/route.ts`, `app/api/contracts/[id]/audit-trail/route.ts`.
- **DB:** add BoldSign fields + new statuses (see §4). **API:** new routes + webhook. **Frontend:** contract status timeline, "send for signature" action.
- **Risk:** 🔴 (external integration, webhook reliability, signing order, secure PDF storage).

### Req 4 — Payments (Stripe, 20% platform / 80% owner)
- **Current:** Implemented via subscription checkout + `calculateMarketplaceSplit` (20/80). Owner credited to wallet in webhook.
- **Required change:** Minimal. Confirm commission applies to rent. Ensure platform "keeps" 20% by **not** auto-paying owner (already true — wallet only).
- **Affected files:** `lib/marketplace-split.ts` (reuse), webhook (reuse).
- **DB:** none. **API:** none. **Frontend:** none.
- **Risk:** 🟢

### Req 5 — Owner wallet + manual withdrawals (replace Connect)
- **Current:** Wallet balances exist + credited. **No withdrawal model / request flow / admin processing.** IBAN field exists on `OwnerProfile`.
- **Required change:** Add `WithdrawalRequest` model; owner dashboard sections (total earnings, pending, history); request withdrawal + bank details; admin processing UI + state transitions; adjust `pendingPayout` on request/approval.
- **Affected files (new):** `lib/wallet.ts`, `app/api/owner/withdrawals/route.ts`, `app/api/admin/withdrawals/**`, owner + admin pages.
- **DB:** new `WithdrawalRequest` model + status enum (see §4). **API:** new routes. **Frontend:** owner wallet + admin payout panels.
- **Risk:** 🟡 (balance integrity, negative balance after refunds — §6).

### Req 6 — SMS verification (OTP → phoneVerified)
- **Current:** None. Email 2FA only. No `phoneVerified`. No SMS provider.
- **Required change:** Choose SMS provider (§6); add OTP send/verify endpoints; store hashed OTP (model like `LoginChallenge`); add `User.phoneVerified` (+ `phoneVerifiedAt`); UI for phone entry + code entry.
- **Affected files (new):** `lib/sms.ts`, `lib/phone-otp.ts`, `app/api/auth/phone/{send,verify}/route.ts`, profile/onboarding UI.
- **DB:** `User.phoneVerified`/`phoneVerifiedAt`; new `PhoneVerification` model (or reuse challenge pattern). **API:** new routes. **Frontend:** phone verify component.
- **Risk:** 🔴 (provider selection, cost control, abuse/rate-limiting).

### Req 7 — Email notifications for all events
- **Current:** Pipeline exists; emails auto-fire on notification create. Several events already wired (payment received, refund, contract signed, message).
- **Required change:** Add/confirm events: listing approved, contract sent, withdrawal updates, account activity. Add i18n copy.
- **Affected files:** `lib/notifications.ts` callers, admin approve route, withdrawal routes, `lib/notifications-i18n.ts`, locales.
- **DB:** none. **API:** add notify calls at event sites. **Frontend:** none.
- **Risk:** 🟢

### Req 8 — Verification documents at contract finalization only
- **Current:** Account-level required-docs flow (`requiredDocumentTypesForRole` → owner needs ID + ownership proof). `VerificationDocument` permanent. Migration also created a `TemporaryDocument` table (orphaned).
- **Required change:** Move owner ID + ownership-proof upload to **contract finalization** step; admin reviews; contract proceeds only after approval; store **only legally necessary** docs and support deletion/retention policy.
- **Affected files:** `lib/verification.ts`, contract flow, admin verifications, new doc-at-finalization endpoints.
- **DB:** decide between reusing `VerificationDocument` (link to booking/contract) vs adopting the existing `TemporaryDocument` table. New booking/contract status for "documents required / admin review" (already in DB enum, not in schema). **API:** new upload + review endpoints scoped to contract. **Frontend:** finalization step UI.
- **Risk:** 🟡 (retention/legal, status modeling, schema reconciliation).

### Req 9 — Invoices (tenant invoice + owner earnings statement)
- **Current:** Tenant invoices generated; PDF render exists. Owner earnings statement **not** a dedicated artifact (wallet aggregates only).
- **Required change:** Tenant invoice already mostly covers fields (confirm property/contract reference). Add **Owner Invoice / Earnings Statement** (rent received, 20% commission, net due, withdrawal history, payment ref).
- **Affected files:** `lib/invoices/*`, new owner-statement generator, `app/api/invoices/**`, owner dashboard.
- **DB:** possibly link `Invoice` ↔ contract reference; otherwise reuse. **API:** owner statement endpoint. **Frontend:** owner earnings statement view/download.
- **Risk:** 🟡

### Req 10 — Admin management (listings, docs, contracts, signatures, withdrawals, invoices, payments, users)
- **Current:** Admin has dashboard, users, listings approve/reject, verifications, revenue, activity. **Missing:** withdrawal management, contract/signature management, richer invoice/payment views.
- **Required change:** Add admin panels for withdrawals, contracts/signatures (BoldSign status + signed PDF/audit access), document review at finalization, payment history.
- **Affected files:** `app/admin/**`, `app/api/admin/**`, `lib/admin.ts`.
- **DB:** uses new models. **API:** new admin routes. **Frontend:** new admin sections.
- **Risk:** 🟡

---

## 3. Proposed Phases (safe, incremental)

Each phase ends with the standard report (files changed, exact changes, commands, manual tests, risks). Phases are ordered to minimize risk and unblock dependencies.

- **Phase 0 (this doc):** Audit + plan. ✅
- **Phase 0.5 — Schema/DB reconciliation (PREREQUISITE):** ✅ Audit complete — see `FINAL_MVP_PHASE_0_5_SCHEMA_RECONCILIATION.md`. Implementation (update `schema.prisma` + write cleanup migration SQL) is the next executable step, pending approval. `prisma migrate status` reports "Database schema is up to date" from migration-tracking perspective but `schema.prisma` is **stale** — it does not reflect 26 orphaned DB items added by migration 9.
- **Phase 1 — Remove mandatory verification before listing:** Confirm/clear any client gate; ensure create-listing requires only auth + OWNER role; adjust copy. (Mostly verification + small UI.)
- **Phase 2 — Move document verification to contract finalization:** New finalization step; owner uploads ID + ownership proof there; admin review gates contract progression; retention policy. Reconcile `VerificationDocument` vs `TemporaryDocument`.
- **Phase 3 — Wallet + withdrawal requests:** `WithdrawalRequest` model; owner wallet UI (earnings/pending/history) + request + bank details; admin processing; notifications.
- **Phase 4 — BoldSign contract signing:** PDF generation; BoldSign client; send-for-signature (sequential owner→tenant); webhook; signed-PDF + audit-trail storage/access; new contract statuses; admin/contract UI.
- **Phase 5 — SMS OTP verification:** Provider integration; OTP send/verify; `phoneVerified`; UI; rate-limiting.
- **Phase 6 — Invoice / earnings statement updates:** Confirm tenant invoice fields (property/contract refs); add owner earnings statement.
- **Phase 7 — Admin management improvements:** Withdrawals, contracts/signatures, document review, payment history panels.
- **Phase 8 — Notifications + final QA:** Wire all remaining email events + i18n; end-to-end QA across EN/FR.

---

## 4. Database Changes Needed (proposed — NOT applied)

> First resolve drift (Phase 0.5). The DB already has orphaned `TemporaryDocument`, Connect columns, and extra enum values from the reverted migration. Reuse where sensible.

**Contract / BoldSign (extend `Contract` or `GeneratedContract`):**
- `boldsignDocumentId` (a.k.a. request ID) — String, unique
- `signedPdfUrl` — String? *(already on `Contract`)*
- `auditTrailUrl` — String?
- `signatureProvider` — enum/String (`BOLDSIGN`)
- New `ContractStatus` values to add: `SENT_FOR_SIGNATURE`, `OWNER_SIGNED`, `TENANT_SIGNED`, `SIGNED`, `SIGNATURE_FAILED` (current enum has `SENT_FOR_SIGNATURE`, `PARTIALLY_SIGNED`, `SIGNED` — needs `OWNER_SIGNED`/`TENANT_SIGNED`/`SIGNATURE_FAILED`).

**Owner wallet / withdrawals (new model):**
```
WithdrawalRequest {
  id, ownerId (OwnerProfile)
  amount Decimal(10,2)
  status: REQUESTED | APPROVED | PAID | REJECTED | CANCELLED   // new enum
  iban / bankName / accountHolder        // snapshot of bank details
  requestedAt, processedAt, processedById (admin)
  adminNote, paymentReference
  createdAt, updatedAt
}
```
- `OwnerProfile`: `walletBalance` / `pendingPayout` / `totalEarnings` already exist — reuse.
- Optional `WalletTransaction` ledger (credit/debit) for auditability (recommended; clarify with client).

**Phone OTP:**
- `User.phoneVerified` Boolean default false; `User.phoneVerifiedAt` DateTime?
- New `PhoneVerification { id, userId, phone, codeHash, expiresAt, attemptCount, maxAttempts, consumedAt }` (mirror `LoginChallenge`).

**Document retention / finalization:**
- Decide: reuse `VerificationDocument` with optional `bookingId`/`contractId` + retention fields (`expiresAt`, `deletedAt`), **or** adopt existing `TemporaryDocument` table (already in DB) into `schema.prisma`.
- Add `DocumentReviewStatus` handling for finalization gate; possibly `Contract.documentsApprovedAt`.

**Owner bank/IBAN:**
- `OwnerProfile.iban` exists. May add `bankName`, `accountHolder`, `bicSwift` for withdrawals.

**Booking/Contract status for finalization gate:**
- DB already has `BookingStatus` `DOCUMENTS_REQUIRED`/`ADMIN_REVIEW` and `ContractStatus` `PENDING_DOCUMENTS`/`ADMIN_REVIEW`/`APPROVED` (orphaned). Decide whether to formalize in schema.

---

## 5. Environment Variables Needed (names only)

**BoldSign**
- `BOLDSIGN_API_KEY`
- `BOLDSIGN_WEBHOOK_SECRET`
- `BOLDSIGN_API_BASE_URL` (optional)

**SMS provider (TBD — see §6)**
- e.g. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` / `TWILIO_FROM_NUMBER`
- (or Vonage/MessageBird equivalents)

**Stripe (existing)**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (+ optional `STRIPE_WEBHOOK_SECRETS`)

**SMTP / email (existing)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_FROM_EMAIL`

**App / auth (existing)**
- `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `DATABASE_URL`

**Storage for signed PDFs / audit trails (TBD — see §6)**
- e.g. `STORAGE_BUCKET` / S3-style keys, or local `docs/` path config.

> No existing values are printed in this document.

---

## 6. Risks & Clarifications Needed (before implementation)

1. **DB drift (BLOCKER):** Confirm how to reconcile the orphaned Stripe-Connect/`TemporaryDocument` migration vs the reverted `schema.prisma`. Keep, formalize, or drop those DB objects? (Affects every later migration.)
2. **SMS provider:** Which provider (Twilio Verify, Twilio raw SMS, Vonage, MessageBird)? Budget/region for FR numbers?
3. **Signed-PDF & audit-trail storage:** Local `docs/` (current contract pattern) or external object storage (S3/Supabase/etc.)? Legal retention requirements?
4. **Listing approval:** Do listings go live immediately, or require admin approval before public display? (Schema supports `PENDING_APPROVAL`; MVP text says "displayed publicly".)
5. **Tenant SMS verification:** Does the tenant also need SMS-verified phone before payment/signing, or owners only?
6. **Owner wallet & refunds:** May `walletBalance` go negative after a refund that exceeds pending balance? Define floor / clawback policy.
7. **Identity document retention:** Should ID/ownership docs be auto-deleted after admin review (and when)? Define legal-minimum retention.
8. **Contract template / legal text:** Provide the exact FR/EN rental contract template + clauses for the PDF used in BoldSign.
9. **BoldSign signing delivery:** Embedded signing links in-app, or BoldSign emails the signers directly? Affects UX + webhook handling.
10. **Stripe Connect removal scope:** Confirm full removal of Connect onboarding (fields/UI) is desired now vs leaving dormant.
11. **Existing in-app signatures:** Migrate/abandon current JSON-signature contracts during BoldSign cutover? Keep behind a flag during transition?

---

## 7. Highest-Risk Conflicts (updated after Phase 0.5 audit)

1. 🟡 **schema.prisma ↔ live DB drift** — fully audited. `prisma migrate status` reports "up to date" (all 9 migrations applied) but `schema.prisma` is missing 26 DB items from migration 9. Adopt/drop decisions documented in `FINAL_MVP_PHASE_0_5_SCHEMA_RECONCILIATION.md`. Must implement before any new migration.
2. 🔴 **BoldSign integration** replacing in-app signing (sequential order, webhook, signed-PDF + audit storage, new statuses).
3. 🔴 **SMS OTP from scratch** (no provider chosen, no `phoneVerified` field, abuse/cost concerns). Twilio Verify recommended; must confirm before Phase 5.
4. 🟡 **Document verification relocation** to contract finalization. `TemporaryDocument` table already in DB — will be adopted into schema and extended. Phase 2.
5. 🟡 **Withdrawal flow** and wallet-balance integrity (refund clawback, negative-balance floor policy — confirm before Phase 3).
6. 🟡 **Phase 4 open questions**: BoldSign delivery method (email vs embedded) and final contract template/legal text — both required before Phase 4 begins.

---

## 8. Recommended Next Phase (updated)

Phase 0.5 audit is complete. The implementation steps for Phase 0.5 are:

1. Update `schema.prisma` to formally include the 16 DB items we **keep** (adopt).
2. Create migration `20260606000000_reconcile_schema_drift` with DROP statements for the 10 items we **remove** (Stripe Connect fields + redundant `*Cents`/`tenantId` columns).
3. Run `prisma migrate dev` to verify the migration generates a clean no-op diff.
4. Then proceed to **Phase 1 — Remove mandatory verification before listing** (confirmed by audit: API already has no verification gate; only a UI/copy check is needed).

**Suggested Phase 0.5 implementation prompt (when approved):**
> "Phase 0.5 implementation: Update `schema.prisma` to adopt the 16 keep items and create migration `20260606000000_reconcile_schema_drift` to drop the 10 remove items — exactly as documented in `FINAL_MVP_PHASE_0_5_SCHEMA_RECONCILIATION.md`. Do not drop any data from keep items. After applying, run `prisma generate` and confirm `prisma migrate status` shows all migrations up to date. Report files changed, migration SQL, test steps, and risks."

**Suggested Phase 1 prompt (when approved):**
> "Phase 1: Ensure property owners can create listings immediately with no verification gate. Audit `app/create-listing/page.tsx`, its layout, and any client guard/redirect that checks owner verification status; remove or bypass that gate without changing theme/colors/components. Confirm `POST /api/listings` requires only an authenticated OWNER. Update any 'verify your identity first' copy in EN/FR locales. Do not touch the DB. Report files changed, exact changes, manual test steps (create a listing as an unverified owner), and risks."

> Before Phase 1, please answer clarification **#1 (DB drift)** and **#4 (listing approval)** at minimum.
