# GetYourCave — Client Audit Execution Plan
**Phase 0 — Analysis Only | No code changed**
**Date: 2026-06-01**

---

## 1. Client Requirements Summary

| # | Requirement | Category |
|---|---|---|
| R1 | Website responsive in both EN and FR | i18n + Responsive |
| R2 | Every text goes through i18n / translations | i18n |
| R3 | Email notifications for all key events | Email |
| R4 | Website matches both audit documents | UX/Content |
| R5 | Full workflow tested end-to-end | QA |
| R6 | Every card and component tested | QA |
| R7 | Payment workflow fully tested | Payments |
| R8 | Fix: Stripe must charge `pricePerMonth`, not `pricePerMonth × duration` | **P0 Bug** |
| R9 | Document ngrok + Stripe CLI webhook testing | DevOps/Docs |

---

## 2. Full Audit Checklist

### Workflow Checklist
- [ ] User signup (owner + renter flows)
- [ ] User login (email/password + 2FA OTP in prod)
- [ ] Password reset (forgot password full flow)
- [ ] Owner creates and fills profile
- [ ] Owner uploads identity document and proof of ownership
- [ ] Admin reviews and approves verification documents
- [ ] Admin verifies user account
- [ ] Owner creates listing (all 5 steps: basic, photos, pricing, location, amenities)
- [ ] Owner submits listing for approval
- [ ] Admin approves/rejects listing
- [ ] Renter searches listings (search, filters, map)
- [ ] Renter views listing detail page
- [ ] Renter creates booking request
- [ ] Owner receives booking notification
- [ ] Owner approves booking → contract + invoice auto-generated
- [ ] Owner rejects booking → renter notified
- [ ] Renter views invoice
- [ ] Renter pays via Stripe (subscription checkout)
- [ ] Stripe webhook updates payment/invoice/booking status
- [ ] Invoice downloadable as PDF
- [ ] Contract downloadable as DOCX
- [ ] Owner signs contract
- [ ] Renter signs contract
- [ ] Both parties notified when contract fully signed
- [ ] Messaging between renter and owner works (real-time, attachments)
- [ ] Notifications appear in bell icon and update in real time
- [ ] Admin dashboard shows platform stats
- [ ] Admin manages users (suspend/reactivate)
- [ ] Admin views revenue analytics
- [ ] Language switcher (EN ↔ FR) works on all pages
- [ ] All pages responsive on mobile/tablet/desktop

### Email Notification Checklist
- [ ] New message received
- [ ] Booking request submitted (owner notified)
- [ ] Booking accepted (renter notified)
- [ ] Booking rejected (renter notified)
- [ ] Payment received (renter + owner notified)
- [ ] Payment failed (renter notified)
- [ ] Contract signed (both parties notified)
- [ ] Document approved (user notified)
- [ ] Document rejected (user notified)
- [ ] Listing published (owner notified)
- [ ] Owner payout credited (owner notified)
- [ ] Login 2FA code email

---

## 3. Current Codebase State

### What is working (confirmed in code)
- Custom JWT auth (HS256, httpOnly cookie, 7-day TTL)
- 2FA login via OTP email (production-only guard)
- Password reset via email + token
- Listing creation wizard (5-step form)
- Marketplace search with filters, map, geo
- Booking request creation and status management
- Stripe subscription-mode checkout + webhook handler
- Auto-generate contract (DOCX via Docxtemplater) on booking approval
- Auto-generate invoice on booking approval
- Socket.IO real-time messaging + notifications
- Notification bell with unread count
- Admin moderation queue (listings + documents)
- Admin user management
- i18n with EN and FR translation files
- Local file uploads (verification docs, avatars, message attachments)
- Owner dashboard (listings, bookings, revenue stats)
- Invoice list + detail + PDF generation
- Contract signing (OWNER + RENTER + ADMIN)
- Booking cancellation cascade (cancels open invoices/payments)

### What is incomplete or missing
- **No `/renter/dashboard` page** — routing sends renters there after login → 404
- Stripe Connect owner payouts: schema columns exist (`stripeConnectAccountId`) but no onboarding UI or payout route
- `proxy.ts` in project root is unused
- Revenue simulator on landing page uses hardcoded city multipliers (not DB-driven)
- No automated subscription cancellation check (relies on Stripe `cancel_at` → webhook)

---

## 4. Missing/Incomplete Items

| Item | Severity | Notes |
|---|---|---|
| `/app/renter/dashboard/page.tsx` missing | **P0** | Renters hit 404 after login |
| `calculateInvoice` multiplies by durationMonths — invoice total ≠ Stripe monthly charge | **P0** | Core payment bug |
| No email on document approval/rejection | **P1** | Required by client |
| No email on listing published | **P1** | Required by client |
| No email on booking request submitted (only in-app notification) | **P1** | `createNotificationForUser` sends email, but body is generic |
| Stripe Connect payouts not implemented | **P2** | Owner wallet balance tracked locally only |
| `sizeSmall/Medium/Large` filters use `ft` values in EN translation | **P2** | `5x5 ft`, `10x10 ft`, `20x20 ft` |
| Hardcoded Unsplash images in landing page | **P2** | Not localized |
| `storage.region` translation key hardcoded as `"Paris Area"` | **P2** | Not contextual |
| Notification emails have English hardcoded content inside `lib/notifications.ts` | **P2** | Not translated |
| `common.none` entry contains garbled character `"â€""` in EN JSON | **P2** | Encoding issue |
| No `/renter/dashboard` page exists | **P0** | — |

---

## 5. Priority List

### P0 — Must fix before any real user testing

| ID | Issue | File(s) |
|---|---|---|
| P0-1 | **RENTER DASHBOARD MISSING**: Renters hit 404 after login | Need to create `app/renter/dashboard/page.tsx` |
| P0-2 | **STRIPE PRICE BUG**: `calculateInvoiceCharges` multiplies `monthlyPrice × durationMonths` → invoice total mismatch vs Stripe subscription monthly charge | `lib/invoices/calculateInvoice.ts` |

### P1 — Required by client audit

| ID | Issue | File(s) |
|---|---|---|
| P1-1 | Missing email: document approved/rejected | `app/api/admin/verifications/[id]/approve/route.ts`, `reject/route.ts` |
| P1-2 | Missing email: listing approved/rejected by admin | `app/api/admin/listings/[id]/approve/route.ts`, `reject/route.ts` |
| P1-3 | Missing email: booking request submitted (owner email beyond in-app) | `lib/bookings.ts:createRenterBooking` |
| P1-4 | `sizeSmall/Medium/Large` uses ft units in EN translation | `locales/en/common.json` → `storage.sizeSmall/sizeMedium/sizeLarge` |
| P1-5 | `common.none` encoding corruption `"â€""` | `locales/en/common.json:49` |
| P1-6 | Login email placeholder `"name@luxury.com"` — demo tone | `locales/en/common.json:320` |

### P2 — Polish and audit completeness

| ID | Issue | File(s) |
|---|---|---|
| P2-1 | Hardcoded notification strings in English (booking, payment, contract titles) | `lib/bookings.ts`, `lib/notifications.ts`, `app/api/payments/webhook/route.ts` |
| P2-2 | `storage.region` key shows `"Paris Area"` — could be more dynamic | `locales/en/common.json` |
| P2-3 | Landing page revenue simulator commission note says "8%" but actual rate is 20% | `locales/en/common.json:611` (`landing.simulator.result.note`) |
| P2-4 | Stripe Connect payouts implementation missing | New feature scope |
| P2-5 | `proxy.ts` unused file in root | Root directory |
| P2-6 | `app/api/renter/dashboard` route exists but `app/renter/dashboard/page.tsx` does not | File creation needed |

---

## 6. Exact Files by Major Area

### Stripe Payment Flow
| File | Role |
|---|---|
| `app/api/payments/checkout/route.ts` | Creates Stripe subscription checkout session |
| `app/api/payments/webhook/route.ts` | Handles all Stripe webhook events |
| `app/api/payments/export/route.ts` | CSV export of payments |
| `lib/stripe.ts` | Stripe client + metadata builders |
| `lib/marketplace-split.ts` | Commission calculation (20%/80%) |
| `lib/invoices/calculateInvoice.ts` | **BUG HERE** — multiplies total by durationMonths |
| `lib/invoices/generateInvoice.ts` | Creates/updates invoice record in DB |
| `lib/payments/finalizeStripeCheckoutSession.ts` | Handles non-subscription checkout finalisation |
| `lib/payments/confirmStripeSession.ts` | Confirms session state |
| `components/payments/StripeCheckoutButton.tsx` | Frontend checkout trigger |
| `app/payments/success/page.tsx` | Success redirect page |
| `app/payments/cancel/page.tsx` | Cancel redirect page |

### Auth
| File | Role |
|---|---|
| `lib/auth.ts` | JWT creation, verification, getCurrentUser, bcrypt |
| `lib/login-challenges.ts` | OTP challenge logic |
| `lib/password-reset-tokens.ts` | Reset token helpers |
| `app/api/auth/login/route.ts` | Login step 1 |
| `app/api/auth/login/verify/route.ts` | OTP verification |
| `app/api/auth/signup/route.ts` | Registration |
| `app/api/auth/forgot-password/` | 3-step reset flow |
| `app/signup/page.tsx` | Signup UI |
| `app/forget_password_page/page.tsx` | Forgot password UI |

### i18n
| File | Role |
|---|---|
| `locales/en/common.json` | English translations |
| `locales/fr/common.json` | French translations |
| `lib/i18n.ts` | Client-side i18next setup |
| `lib/i18n.server.ts` | Server-side locale resolution |
| `components/providers/I18nProvider.tsx` | Wraps app with i18n context |
| `components/layout/LanguageSwitcher.tsx` | EN/FR toggle in nav |

### Email
| File | Role |
|---|---|
| `lib/email.ts` | All email sending functions (Nodemailer) |
| `lib/notifications.ts` | `createNotificationForUser` → sends email automatically |
| `lib/messages.ts` | Message notification email trigger |

### Listings & Marketplace
| File | Role |
|---|---|
| `app/storage/page.tsx` | Marketplace browse/search page |
| `app/storage/[id]/page.tsx` | Listing detail + booking form |
| `app/create-listing/page.tsx` | Owner listing creation wizard |
| `app/api/listings/route.ts` | Public listing list + create |
| `app/api/listings/[id]/route.ts` | Get/update listing |
| `app/api/admin/listings/` | Admin approve/reject |
| `components/listings/ListingDetailPage.tsx` | Detail page component |

### Bookings
| File | Role |
|---|---|
| `lib/bookings.ts` | All booking business logic |
| `app/api/bookings/route.ts` | Create booking |
| `app/api/bookings/[id]/route.ts` | Update booking status |
| `app/api/owner/bookings/route.ts` | Owner booking list |
| `app/api/renter/bookings/route.ts` | Renter booking list |
| `components/owner/OwnerBookingActions.tsx` | Owner approve/reject UI |
| `components/renter/RenterBookingActions.tsx` | Renter cancel UI |

### Contracts
| File | Role |
|---|---|
| `lib/contracts/generateContract.ts` | DOCX generation + signing logic |
| `lib/contracts/placeholderMapper.ts` | Template variable mapping |
| `lib/contracts/loadTemplate.ts` | Template file loading |
| `app/api/contracts/generate/route.ts` | Generate endpoint |
| `app/api/contracts/[id]/download/route.ts` | Download DOCX |
| `app/api/contracts/[id]/sign/route.ts` | Sign endpoint |
| `components/contracts/ContractsWorkspace.tsx` | Contracts UI |

### Admin
| File | Role |
|---|---|
| `app/admin/dashboard/page.tsx` | Admin dashboard page |
| `app/admin/users/page.tsx` | User management page |
| `app/api/admin/dashboard/route.ts` | Dashboard stats API |
| `app/api/admin/users/` | User management APIs |
| `app/api/admin/listings/` | Listing moderation APIs |
| `app/api/admin/verifications/` | Document moderation APIs |
| `components/admin/AdminDashboardWorkspace.tsx` | Dashboard UI |
| `components/admin/AdminUsersWorkspace.tsx` | Users UI |

### UI / Layout
| File | Role |
|---|---|
| `app/globals.css` | Design tokens, all global utility classes |
| `app/layout.tsx` | Root layout, font loading, providers |
| `components/layout/AppChrome.tsx` | Top-level shell, nav routing |
| `components/layout/Topbar.tsx` | Navigation bar |
| `components/layout/Footer.tsx` | Footer |
| `components/layout/navigation.ts` | Nav item definitions |
| `components/ui/` | Button, Card, Input, UserAvatar primitives |

---

## 7. Deep Stripe Payment Flow Analysis

### Current Flow (Correct Parts)
```
Renter views invoice → clicks Pay Now
→ POST /api/payments/checkout { invoiceId, bookingId }
→ Stripe session created: mode="subscription", interval="month"
→ unit_amount = toStripeMinorUnits(booking.listing.pricePerMonth)  ← CORRECT: monthly price only
→ subscription_data.metadata = { bookingId, renterId, durationMonths }
→ Renter completes checkout on Stripe

→ Stripe fires: checkout.session.completed
→ Webhook: loads subscription, sets cancel_at = now + durationMonths
→ First invoice synced: creates Payment + Invoice records
→ Stripe fires: invoice.paid each month
→ Webhook: syncRecurringInvoiceFromStripe creates new Payment + Invoice
→ After durationMonths months, subscription auto-cancels
→ customer.subscription.deleted → booking marked COMPLETED
```

### Identified Bug — P0-2

**File:** `lib/invoices/calculateInvoice.ts`, lines 25–41

```typescript
// CURRENT (BUGGY for pre-payment invoice display):
const months = Math.max(1, Math.round(input.durationMonths ?? 1));
const totalRent = monthlyPrice.mul(months);       // ← multiplied by duration!
const subtotal  = totalRent + totalInsurance + securityDeposit;
const total     = subtotal + taxes;
```

**Effect:** When booking is APPROVED, `generateInvoiceForBooking` is called with `durationMonths`. For a €100/month, 6-month booking:
- Invoice is created with `totalAmount = €600` (or more with fees)
- The renter sees "Invoice: €600" and clicks Pay Now
- Stripe checkout charges €100/month recurring (correct by spec)
- The webhook receives Stripe invoice for €100 and overwrites the local invoice to €100
- **Result:** Invoice flip-flops between €600 (generated) and €100 (after webhook)

**Correct Expected Behavior:**
- The pre-payment invoice generated on approval should represent ONE month (€100)
- The Stripe subscription charges €100/month for `durationMonths` months (handled by `cancel_at`)
- Informational display of "Total over 6 months: €600" is UI-only, not stored as invoice total
- Each monthly Stripe payment creates/updates one invoice record for that month

**Fix Location (Phase 1):**
- `lib/invoices/calculateInvoice.ts` — remove `× months` from total, or add a `monthlyOnly` flag
- `lib/invoices/generateInvoice.ts` — pass `durationMonths: 1` (always 1 month per invoice)
- `components/listings/ListingDetailPage.tsx` or invoice detail — keep displaying estimated total as informational text only

### Stripe Subscription Lifecycle Events Handled

| Stripe Event | Handler | Status |
|---|---|---|
| `checkout.session.completed` | Sets `cancel_at`, syncs first invoice | ✅ |
| `checkout.session.expired` | Cancels pending payment | ✅ |
| `invoice.finalized` | Creates local invoice as ISSUED | ✅ |
| `invoice.payment_action_required` | Sets invoice ISSUED | ✅ |
| `invoice.payment_failed` | Sets OVERDUE + FAILED, notifies renter | ✅ |
| `invoice.payment_succeeded` | Sets PAID, credits owner wallet | ✅ |
| `invoice.paid` | Sets PAID, credits owner wallet | ✅ |
| `customer.subscription.created/updated/paused/resumed` | Logged only | ⚠️ No DB update |
| `customer.subscription.deleted` | Marks booking COMPLETED | ✅ |
| `charge.refunded` / `refund.created` | Marks payment REFUNDED, debits wallet | ✅ |
| `payment_intent.payment_failed` | Marks FAILED, notifies renter | ✅ |

---

## 8. Exact Duration Multiplication Location

```
lib/invoices/calculateInvoice.ts
  └─ calculateInvoiceCharges()
       Line 25:  const months = Math.max(1, Math.round(input.durationMonths ?? 1));
       Line 34:  const totalRent = monthlyPrice.mul(months);       ← THE BUG
       Line 35:  const totalInsurance = insuranceFee.mul(months);  ← cascades
       Line 36:  const totalPlatform = platformFee.mul(months);    ← cascades
       Line 37:  const totalTaxes = taxes.mul(months);             ← cascades
       Line 39:  const subtotal = totalRent + totalInsurance + securityDeposit;
       Line 40:  const total = subtotal + totalTaxes;              ← WRONG TOTAL

Called from:
  lib/invoices/generateInvoice.ts:477-483
    calculateInvoiceCharges({
      monthlyPrice: booking.monthlyPrice,
      insuranceFee: booking.insuranceFee,
      securityDeposit: booking.securityDeposit,
      platformCommission: booking.platformCommission,
      durationMonths: booking.durationMonths ?? 1,   ← passes actual months
    });

Also called from (for display purposes only — may be OK to keep):
  Any frontend component that calls calculateInvoiceCharges with durationMonths
  to show "estimated total" text — this is UI-only and acceptable
```

---

## 9. Correct Expected Stripe Behavior

```
Listing price: €100/month
Duration: 6 months

CORRECT:
- Stripe subscription: €100/month, cancel_at = now + 6 months
- 6 Stripe invoices fired: €100 each
- 6 local Invoice records created: totalAmount = €100 each
- Total charged to renter: €600 over 6 months
- Owner earns: €80/month (after 20% commission)
- Platform earns: €20/month

WRONG (current behavior):
- Booking APPROVED → generateInvoice called → invoice.totalAmount = €600
- Renter sees "Invoice €600 — Pay Now"
- Stripe checkout created for €100/month recurring
- First Stripe invoice paid (€100) → webhook overwrites invoice to €100
- Invoice now shows €100 — confusing discrepancy

FIX: Invoice generated on booking approval should be for €100 (1 month only)
     "Total for 6 months: €600" is informational UI text only
```

---

## 10. Email Notification Coverage Audit

### Currently Sending Email (via `createNotificationForUser` which calls `sendNotificationEmail`)

| Event | In-app notif | Email sent | Notes |
|---|---|---|---|
| New message | ✅ | ✅ | Via `createMessageNotification` in `lib/messages.ts` |
| Booking request (owner) | ✅ | ✅ | `lib/bookings.ts:562` |
| Booking approved (renter) | ✅ | ✅ | `lib/bookings.ts:790` |
| Booking rejected (renter) | ✅ | ✅ | `lib/bookings.ts:798` |
| Booking cancelled (both) | ✅ | ✅ | `lib/bookings.ts:814` |
| Payment received (renter) | ✅ | ✅ | `app/api/payments/webhook/route.ts:121` |
| Owner payout credited | ✅ | ✅ | `app/api/payments/webhook/route.ts:128` |
| Payment failed (renter) | ✅ | ✅ | `app/api/payments/webhook/route.ts:641` |
| Contract signed | ✅ | ✅ | `lib/contracts/generateContract.ts:742` |
| Login 2FA code | — | ✅ | `lib/email.ts:sendLoginVerificationCodeEmail` |
| Password reset | — | ✅ | `lib/email.ts:sendPasswordResetEmail` |

### Missing Emails (P1)

| Event | Currently | Required | Fix Location |
|---|---|---|---|
| Document approved | ❌ No email | ✅ Required | `app/api/admin/verifications/[id]/approve/route.ts` |
| Document rejected | ❌ No email | ✅ Required | `app/api/admin/verifications/[id]/reject/route.ts` |
| Listing approved by admin | ❌ No email | ✅ Required | `app/api/admin/listings/[id]/approve/route.ts` |
| Listing rejected by admin | ❌ No email | ✅ Required | `app/api/admin/listings/[id]/reject/route.ts` |

**Note:** The `createNotificationForUser` function already sends emails if the user has `emailNotificationsEnabled = true`. The fix for missing emails is simply to call `createNotificationForUser` in the admin approve/reject handlers.

### Email Quality Notes
- All emails use inline HTML in `lib/email.ts` — consistent brand style (orange #f26a1b, warm tones)
- All notification bodies are English-hardcoded strings — not translated
- No unsubscribe mechanism (legal risk in France/EU — GDPR consideration for Phase 6)

---

## 11. i18n / Hardcoded Text Audit

### Translation System Quality
- EN and FR files are comprehensive and well-structured
- Landing page (`app/page.tsx`) fully uses `t()` — good
- Major dashboard components use `t()` — good
- FR file appears complete for all keys present in EN

### Known Hardcoded / Bad Keys

| Location | Issue | Priority |
|---|---|---|
| `locales/en/common.json:49` | `"none": "â€""` — corrupted em-dash | P1 |
| `locales/en/common.json:320` | `emailPlaceholder: "name@luxury.com"` — demo luxury tone | P1 |
| `locales/en/common.json:658-660` | `sizeSmall: "Small (5x5 ft)"`, `sizeMedium: "Medium (10x10 ft)"`, `sizeLarge: "Large (20x20 ft)"` — imperial units | P1 |
| `locales/en/common.json:611` | `simulator.result.note: "After GetYourCave's 8% commission"` — wrong rate (actual is 20%) | P1 |
| `lib/bookings.ts:563-565` | Notification body: `"You received a new booking request for ${listing.title}."` — English hardcoded | P2 |
| `lib/bookings.ts:790-795` | `"Request accepted"`, `"Request rejected"` — hardcoded EN | P2 |
| `app/api/payments/webhook/route.ts:121` | `"Payment received"` notification — hardcoded EN | P2 |
| `lib/notifications.ts:146` | `"New message from ${senderName}"` — hardcoded EN | P2 |

### US/Demo Content to Remove

| Text | Location | Replacement |
|---|---|---|
| `"5x5 ft"`, `"10x10 ft"`, `"20x20 ft"` | `locales/en/common.json` storage filters | `"Small (up to 5 m²)"`, `"Medium (5–15 m²)"`, `"Large (15+ m²)"` |
| `"name@luxury.com"` | Login email placeholder | `"prenom.nom@example.com"` |
| `"After GetYourCave's 8% commission"` | Revenue simulator note | Update to actual 20% or remove |

### Already Correct (French/EU wording confirmed)
- Landing page hero, featured cards, categories → all French city/European content
- `storage.sqFt` key already mapped to `"m²"` in EN
- `listing.sqFt` key already mapped to `"m²"`
- Prices use `€` throughout translation files
- `locales/fr/common.json` uses `"m²"` and `"€"` correctly

---

## 12. Responsive / Mobile Risk Audit

### Architecture
- Tailwind v4 utility-based layout — inherently responsive if classes are correct
- Max-width containers: `max-w-[1180px]` on landing, `.page-shell` (1440px), `.section-shell` (1200px)
- Landing page uses `grid-cols-1 ... lg:grid-cols-2` patterns — responsive by design
- Hero grid: `grid-cols-1 lg:grid-cols-[1.05fr_.95fr]` — responsive

### Known Responsive Risks

| Area | Risk | Priority |
|---|---|---|
| Messaging workspace (`MessagingWorkspace.tsx`) | Conversation list + message panel side-by-side may not collapse on mobile | P1 |
| Owner dashboard booking table | Wide tables with many columns may overflow on mobile | P1 |
| Admin dashboard moderation queue | Multi-column table may not wrap on small screens | P1 |
| Invoice detail page (`InvoiceDetailPage.tsx`) | Payment breakdown table may overflow | P2 |
| Contract workspace | DOCX preview (if rendered inline) may overflow | P2 |
| Create listing wizard (multi-step) | Map picker and form may be cramped on mobile | P2 |
| Language switcher | Must remain accessible on mobile nav | P1 |

### `.rounded-lg` Override Risk
`globals.css` redefines `.rounded-lg` to `border-radius: 2rem` (not Tailwind's `0.5rem`). Any newly added code using standard Tailwind mental model for `.rounded-lg` will get a much larger radius. **No new `rounded-lg` usage should be introduced without knowing this.**

---

## 13. ngrok + Stripe CLI Local Testing Instructions

### Option A: Stripe CLI (Recommended for local dev)

```bash
# 1. Install Stripe CLI
# Windows: https://github.com/stripe/stripe-cli/releases
# Or via scoop:
scoop install stripe

# 2. Login to Stripe
stripe login

# 3. Forward webhooks to local server (while dev server runs on :3000)
stripe listen --forward-to http://localhost:3000/api/payments/webhook

# The CLI will output:
# > Ready! Your webhook signing secret is whsec_xxxx...

# 4. Copy that secret to .env
# STRIPE_WEBHOOK_SECRET=whsec_xxxx...

# 5. In a separate terminal, start the dev server
cd "C:/Users/Victus/Downloads/getyourcave 2/getyourcave"
NODE_ENV=development npx tsx server.ts

# 6. Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Option B: ngrok (for testing with external services / Stripe Dashboard)

```bash
# 1. Install ngrok: https://ngrok.com/download
# Or: winget install ngrok

# 2. Authenticate (one time)
ngrok config add-authtoken YOUR_AUTHTOKEN

# 3. Start tunnel to local port 3000
ngrok http 3000

# ngrok will output a URL like: https://abc123.ngrok-free.app

# 4. Update .env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
STRIPE_WEBHOOK_ENDPOINT_URL=https://abc123.ngrok-free.app/api/payments/webhook

# 5. Register the webhook endpoint in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# Click "Add endpoint"
# URL: https://abc123.ngrok-free.app/api/payments/webhook
# Events to listen for (from current .env):
#   checkout.session.completed
#   checkout.session.expired
#   customer.subscription.created
#   customer.subscription.updated
#   customer.subscription.deleted
#   customer.subscription.paused
#   customer.subscription.resumed
#   customer.subscription.trial_will_end
#   invoice.finalized
#   invoice.payment_action_required
#   invoice.payment_failed
#   invoice.payment_succeeded
#   invoice.paid

# 6. Copy the webhook signing secret from Stripe Dashboard to .env
STRIPE_WEBHOOK_SECRET=whsec_xxxx...

# 7. Restart the dev server
```

### Current .env Webhook Configuration
The `.env` already has an ngrok URL configured:
```
NEXT_PUBLIC_APP_URL=https://muppet-backache-move.ngrok-free.dev
STRIPE_WEBHOOK_ENDPOINT_URL=...
STRIPE_WEBHOOK_ENDPOINT_ID=we_1TcsT8Du6IDEhc6l2yERWIfZ
STRIPE_WEBHOOK_SECRET=whsec_djCeTOAUC3tCXZ1adsNvAam0PgsZbnge
```
**Warning:** ngrok free-tier URLs change every session. The current stored URL is stale. Before testing payments, restart ngrok and update `NEXT_PUBLIC_APP_URL` and the Stripe webhook endpoint URL.

### Testing the Full Payment Flow Locally

```bash
# Step 1: Create test renter + owner accounts via /signup
# Step 2: Admin seeds if needed: node prisma/seed-admin.js --yes
# Step 3: Owner creates listing, admin approves it
# Step 4: Renter creates booking request
# Step 5: Owner approves booking (generates invoice automatically)
# Step 6: Renter opens invoice → clicks Pay Now
# Step 7: Use Stripe test card: 4242 4242 4242 4242, any future date, any CVC
# Step 8: For SEPA: FR76 3000 6000 0112 3456 7890 189
# Step 9: Stripe CLI or ngrok receives webhook → watch terminal for logs
# Step 10: Check invoice status changes to PAID
# Step 11: Check owner wallet balance updated in DB
```

---

## 14. Recommended First Coding Phase

### Phase 1 — Stripe Payment Bug Fix + Renter Dashboard

**Why first:** The payment bug causes invoice total to show incorrect amounts before payment, and the missing renter dashboard causes a 404 for all renters after login. Both block any end-to-end testing.

**Scope:**
1. Fix `lib/invoices/calculateInvoice.ts` — invoice amount should be per-month only, not total
2. Fix `lib/invoices/generateInvoice.ts` — pass `durationMonths: 1` for the initial approval invoice
3. Create `app/renter/dashboard/page.tsx` — renter dashboard page (exists at API level as `app/api/renter/dashboard/route.ts`)
4. Create `STRIPE_LOCAL_TESTING.md` with the ngrok/CLI instructions above

**What NOT to touch in Phase 1:**
- No UI changes beyond what the renter dashboard page requires
- No i18n changes
- No email changes
- No CSS/design changes

**Estimated files changed:** 3–4 files

---

## Summary

| Metric | Value |
|---|---|
| Total routes (API) | 52 |
| Total pages | 18 |
| Translation keys (EN) | ~600+ |
| Missing pages | 1 (`/renter/dashboard`) |
| P0 bugs | 2 |
| P1 issues | 6 |
| P2 issues | 6 |
| Email events covered | 11 of 15 required |
| Email events missing | 4 (document approved/rejected, listing approved/rejected) |
| Stripe events handled | 11 of 13 configured |

---

*Phase 0 complete. No app code was modified. Proceed to Phase 1 on approval.*
