# Phase 8 — Notifications & Final QA

## Summary

Phase 8 completes in-app/email notification coverage, fixes i18n gaps for notification titles, and corrects stale copy from the old listing-approval flow.

---

## Notification Coverage Matrix

| Event | In-App | Email | Where |
|-------|--------|-------|-------|
| **Messages** | | | |
| New message received | ✅ | ✅ | `lib/notifications.ts::createMessageNotification()` |
| **Listings** | | | |
| Listing created + published immediately | ✅ | ✅ | `lib/listings.ts::createOwnerListing()` → "Listing published" |
| Listing updated → published | ✅ | ✅ | `lib/listings.ts::updateOwnerListing()` → "Listing published" |
| Listing archived | ✅ | ✅ | `lib/listings.ts::toggleOwnerListingArchive()` → "Listing expired" |
| Listing unarchived | ✅ | ✅ | `lib/listings.ts::toggleOwnerListingArchive()` → "Listing published" |
| Listing rejected by admin | ✅ | ✅ | `lib/admin.ts::rejectListingForAdmin()` → "Listing rejected" |
| **Bookings** | | | |
| New booking request (owner) | ✅ | ✅ | `lib/bookings.ts` → "Booking request" |
| Booking accepted (renter) | ✅ | ✅ | `lib/bookings.ts` → "Request accepted" |
| Booking rejected (renter) | ✅ | ✅ | `lib/bookings.ts` → "Request rejected" |
| Booking cancelled (both parties) | ✅ | ✅ | `lib/bookings.ts` → "Booking cancelled" |
| **Documents (Booking / Temp)** | | | |
| Document upload requested by admin | ✅ | ✅ | `lib/temporary-documents.ts::requestDocumentsForBooking()` → "Documents required" |
| All documents approved → booking advances | ✅ | ✅ | `lib/temporary-documents.ts::approveTempDocument()` → "Documents approved" |
| Document rejected | ✅ | ✅ | `lib/temporary-documents.ts::rejectTempDocument()` → "Document rejected" |
| **Verification Documents** | | | |
| Verification document approved | ✅ | ✅ | `lib/admin.ts::approveVerificationDocumentForAdmin()` → "Document approved" |
| Verification document rejected | ✅ | ✅ | `lib/admin.ts::rejectVerificationDocumentForAdmin()` → "Document rejected" |
| **Contracts / BoldSign** | | | |
| Contract sent for signature | ✅ | ✅ | `app/api/contracts/[id]/send-for-signature/route.ts` → "Contract sent for signature" |
| Owner signed (owner + renter notified) | ✅ | ✅ | `app/api/contracts/boldsign-webhook/route.ts` → signer.Signed order=1 |
| Tenant signed (owner notified) | ✅ | ✅ | `app/api/contracts/boldsign-webhook/route.ts` → signer.Signed order=2 |
| Contract fully signed (both notified) | ✅ | ✅ | `app/api/contracts/boldsign-webhook/route.ts` → document.Completed |
| Contract signature failed (both notified) | ✅ | ✅ | `app/api/contracts/boldsign-webhook/route.ts` → document.Declined/Expired/Revoked |
| **Payments** | | | |
| Payment received (renter) | ✅ | ✅ | `app/api/payments/webhook/route.ts` → "Payment received" |
| Owner payout added to wallet | ✅ | ✅ | `app/api/payments/webhook/route.ts` → "Owner payout completed" |
| Payment failed (renter) | ✅ | ✅ | `app/api/payments/webhook/route.ts` → "Payment failed" |
| Payment refunded (renter) | ✅ | ✅ | `app/api/payments/webhook/route.ts` → "Payment refunded" |
| Refund deducted from owner wallet | ✅ | ✅ | `app/api/payments/webhook/route.ts` → "Refund processed" |
| **Withdrawals** | | | |
| Withdrawal requested (owner) | ✅ | ✅ | `lib/withdrawals.ts::createWithdrawalRequest()` → "Withdrawal requested" |
| Withdrawal processing (admin) | ✅ | ✅ | `lib/withdrawals.ts::markWithdrawalProcessing()` → "Withdrawal processing" |
| Withdrawal paid (admin) | ✅ | ✅ | `lib/withdrawals.ts::markWithdrawalPaid()` → "Withdrawal paid" |
| Withdrawal rejected (admin) | ✅ | ✅ | `lib/withdrawals.ts::rejectWithdrawal()` → "Withdrawal rejected" |
| Withdrawal cancelled (owner) | ✅ | ✅ | `lib/withdrawals.ts::cancelWithdrawalRequest()` → "Withdrawal cancelled" |
| **Account / Auth** | | | |
| Phone number verified | ✅ | ✅ | `app/api/auth/phone/verify-otp/route.ts` → "Phone number verified" (Phase 5) |
| Account activated by admin | ✅ | ✅ | `lib/admin.ts::activateUserForAdmin()` → "Account activated" (**added Phase 8**) |

---

## Email Coverage

Email is sent automatically by `createNotificationForUser()` in `lib/notifications.ts` when:
- The notification is created
- The recipient has `emailNotificationsEnabled = true` (default)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_FROM_EMAIL` are configured

All in-app notifications above trigger email automatically. No separate email logic needed.

Email types in `lib/email.ts`:
- `sendNotificationEmail()` — used for all notification-triggered emails
- `sendMessageNotificationEmail()` — used for new message notifications
- `sendLoginVerificationEmail()` — email OTP for login
- `sendPasswordResetEmail()` — password reset flow

---

## i18n Changes (Phase 8)

### `lib/notifications-i18n.ts`
Added to `TITLE_KEY_MAP`:
- `"Documents required"` → `notifications.documentsRequired`
- `"Documents approved"` → `notifications.documentsApproved`
- `"Listing expired"` → `notifications.listingExpired`
- `"Phone number verified"` → `notifications.phoneVerified`
- `"Account activated"` → `notifications.accountActivated`

Added body translators for all 5 new titles.

### `locales/en/common.json`
- Fixed `createListing.subtitle`: was "Craft a polished listing and submit it for approval." → now "Craft a polished listing — it goes live instantly."
- Added notification keys: `listingExpired`, `documentsRequired`, `documentsApproved`, `phoneVerified`, `accountActivated` and their body variants

### `locales/fr/common.json`
- Added same notification keys in French

---

## Files Changed in Phase 8

| File | Change |
|------|--------|
| `lib/admin.ts` | Added `createNotificationForUser` after `activateUserForAdmin()` transaction |
| `lib/notifications-i18n.ts` | Added 5 title mappings + 5 body translators |
| `locales/en/common.json` | Fixed stale copy, added 10 notification keys |
| `locales/fr/common.json` | Added 10 notification keys in French |
| `FINAL_MVP_PHASE_8_NOTIFICATIONS_QA.md` | This file |
| `FINAL_MVP_DEMO_CHECKLIST.md` | End-to-end demo checklist |

---

## Known Limitations

1. **Twilio real SMS** — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` must be configured and caller/account must be verified. Dev mode uses `SMS_DEV_MODE=true` and logs OTPs to console.
2. **BoldSign webhooks** — Require ngrok or a public URL in local dev. Set `BOLDSIGN_API_KEY` and `BOLDSIGN_WEBHOOK_SECRET`. Test with `POST /api/contracts/boldsign-webhook`.
3. **Stripe webhooks** — Require ngrok in local dev. Run `stripe listen --forward-to localhost:3000/api/payments/webhook`. Set `STRIPE_WEBHOOK_SECRET`.
4. **Local file storage** — PDFs and uploaded docs are stored in `public/uploads/` and `docs/`. In production, replace with S3/Cloudflare R2.
5. **Socket.IO realtime** — Realtime notification delivery requires a persistent server (not serverless). Works in local dev via `proxy.ts` custom server. In production serverless (Vercel), realtime notifications are degraded to polling.
6. **Email** — SMTP config required: `SMTP_HOST`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_FROM_EMAIL`.
7. **No in-app notification for individual temp doc approval** — Only triggered when all required docs are approved (correct behavior for MVP).

---

## Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_EMAIL=your@email.com
SMTP_PORT=465
SMTP_SECURE=true

# BoldSign
BOLDSIGN_API_KEY=...
BOLDSIGN_WEBHOOK_SECRET=...

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxx
SMS_DEV_MODE=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Manual Test Checklist — Notifications

Run after setting up env vars and local dev server (`npm run dev`).

- [ ] **Messages**: Send a message → recipient gets bell notification + email
- [ ] **Listing published**: Create a listing → owner gets "Listing published" notification
- [ ] **Booking request**: Renter creates booking → owner gets "Booking request" notification
- [ ] **Booking accepted**: Owner approves → renter gets "Request accepted" notification
- [ ] **Document upload requested**: Admin requests docs → owner gets "Documents required" notification
- [ ] **Documents approved**: Owner uploads all docs → admin approves → owner gets "Documents approved"
- [ ] **Document rejected**: Admin rejects → owner gets "Document rejected" + booking reverts to DOCUMENTS_REQUIRED
- [ ] **Contract sent**: Owner sends for BoldSign signature → both parties get "Contract sent for signature"
- [ ] **Contract signed**: Owner signs in BoldSign → renter gets "Owner signed the contract"
- [ ] **Contract fully signed**: Both sign → both get "Contract fully signed"
- [ ] **Signature failed**: Signer declines → both get "Contract signature failed"
- [ ] **Payment received**: Stripe checkout completes → renter gets "Payment received"
- [ ] **Owner payout**: Payment succeeds → owner gets "Owner payout completed"
- [ ] **Payment failed**: Stripe payment fails → renter gets "Payment failed"
- [ ] **Refund**: Refund processed → renter gets "Payment refunded", owner gets "Refund processed"
- [ ] **Withdrawal requested**: Owner submits withdrawal → owner gets "Withdrawal requested"
- [ ] **Withdrawal paid**: Admin marks paid → owner gets "Withdrawal paid"
- [ ] **Phone verified**: User verifies OTP → user gets "Phone number verified"
- [ ] **Account activated**: Admin activates user → user gets "Account activated"
- [ ] **Emails**: Each notification above also triggers email if user has email notifications enabled
