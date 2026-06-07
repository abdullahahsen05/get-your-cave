# GetYourCave — Email Notification Audit
**Phase 4 | Date: 2026-06-01**

---

## How the Notification/Email Pipeline Works

Every call to `createNotificationForUser()` in `lib/notifications.ts`:

1. Creates an in-app `Notification` row in the database.
2. Queries `User.emailNotificationsEnabled` for the recipient.
3. If `emailNotificationsEnabled === true` **and** the user has an email address, fires `sendNotificationEmail()` from `lib/email.ts` (fire-and-forget with `.catch()` — email failures never throw).
4. Emits a real-time Socket.IO event (`notificationCreated`) to the user's personal socket room.

Direct email functions (`sendLoginVerificationCodeEmail`, `sendPasswordResetEmail`) in `lib/email.ts` bypass the notification pipeline and send transactional email only.

---

## Required Events — Full Coverage Table

| # | Event | Status | Email sent? | Responsible file(s) | Notes |
|---|---|---|---|---|---|
| 1 | New message | ✅ Covered | ✅ Yes (if enabled) | `lib/messages.ts` → `createMessageNotification` → `createNotificationForUser` + `sendMessageNotificationEmail` | Message email also sent via `sendMessageNotificationEmail` for richer template |
| 2 | Message read | ⛔ Intentionally not emailed | ❌ No | `lib/socket/server.ts` (real-time only) | See Section below |
| 3 | New booking request (owner notified) | ✅ Covered | ✅ Yes (if enabled) | `lib/bookings.ts:562` → `createNotificationForUser` | Title: "Booking request" |
| 4 | Booking accepted (renter notified) | ✅ Covered | ✅ Yes (if enabled) | `lib/bookings.ts:790` → `createNotificationForUser` | Title: "Request accepted" |
| 5 | Booking rejected (renter notified) | ✅ Covered | ✅ Yes (if enabled) | `lib/bookings.ts:799` → `createNotificationForUser` | Title: "Request rejected" |
| 6 | Booking cancelled (both notified) | ✅ Covered | ✅ Yes (if enabled) | `lib/bookings.ts:815+821` → `createNotificationForUser` ×2 | Owner and renter each get a notification |
| 7 | Payment received (renter) | ✅ Covered | ✅ Yes (if enabled) | `app/api/payments/webhook/route.ts:121` → `createNotificationForUser` | Fires on `invoice.paid` webhook |
| 8 | Payment failed (renter) | ✅ Covered | ✅ Yes (if enabled) | `app/api/payments/webhook/route.ts:641` + `:1362` → `createNotificationForUser` | Covers both recurring subscription failure and direct payment_intent failure |
| 9 | Owner payout completed | ✅ Covered | ✅ Yes (if enabled) | `app/api/payments/webhook/route.ts:128` → `createNotificationForUser` | Fires when first invoice is paid; title: "Owner payout completed" |
| 10 | Contract signed | ✅ Covered | ✅ Yes (if enabled) | `lib/contracts/generateContract.ts:748` → `createNotificationForUser` | Notifies the OTHER party; title: "Contract signed" or "Contract partially signed" |
| 11 | Document approved | ✅ Covered | ✅ Yes (if enabled) | `lib/admin.ts:1265` → `createNotificationForUser` | Called inside `approveVerificationDocumentForAdmin` |
| 12 | Document rejected | ✅ Covered | ✅ Yes (if enabled) | `lib/admin.ts:1343` → `createNotificationForUser` | Includes rejection reason in body if provided |
| 13 | Listing approved / published | ✅ Covered | ✅ Yes (if enabled) | `lib/admin.ts:1117` → `createNotificationForUser` | Title: "Listing published"; also fires from `lib/listings.ts:1106` when owner re-publishes |
| 14 | Listing rejected | ✅ Covered | ✅ Yes (if enabled) | `lib/admin.ts:1192` → `createNotificationForUser` | Includes rejection reason in body if provided |
| 15 | Listing expired (archived) | ✅ Covered | ✅ Yes (if enabled) | `lib/listings.ts:1093` → `createNotificationForUser` | Fires when owner manually archives listing; title: "Listing expired" |
| 16 | Login 2FA verification code | ✅ Covered | ✅ Always (direct) | `lib/email.ts:sendLoginVerificationCodeEmail` | Direct transactional email; not via notification pipeline |
| 17 | Password reset link | ✅ Covered | ✅ Always (direct) | `lib/email.ts:sendPasswordResetEmail` | Direct transactional email; not via notification pipeline |
| 18 | Verification submitted | ✅ Covered | ✅ Yes (if enabled) | `lib/verification.ts:267` → `createNotificationForUser` | User confirms their docs are under review |

---

## Message Read — Intentionally Not Emailed

**Decision: Do NOT send email on message read.**

Reasons:
- Sending an email every time a recipient reads a message would result in a high volume of low-value transactional emails (e.g., 10 "your message was read" emails per conversation).
- Standard industry practice (WhatsApp, Slack, Messenger) is to provide read receipts in-app/real-time only.
- The existing `SOCKET_EVENTS.messagesRead` event in `lib/socket/server.ts` already delivers real-time read receipts to both participants.
- Adding email for read events would likely trigger unsubscribes and spam complaints.

**Current implementation:** `markConversationRead` in `lib/messages.ts` emits `messagesRead` via Socket.IO. No email. ✅ Correct.

---

## Listing Expired — Scope Note

"Listing expired" as a **scheduled/automatic** event (e.g., listings auto-expire after 90 days) does NOT exist in the codebase. There is no cron job or background expiry task.

The current "Listing expired" notification fires when an **owner manually archives** their listing via `lib/listings.ts:1093`. This fires correctly via `createNotificationForUser`.

**Future scope:** If auto-expiry is added (e.g., cron job that archives old listings), the `createNotificationForUser` call should be placed in that new background job.

---

## Owner Payout — Scope Note

The "Owner payout completed" notification fires when Stripe confirms a payment (webhook `invoice.paid`), updating the owner's `walletBalance` and `pendingPayout` fields in the database. This represents the platform crediting the owner's internal wallet.

**Stripe Connect payouts** (actual bank transfers) are not yet implemented — the `OwnerProfile.stripeConnectAccountId` column exists but the onboarding flow is not built. When Stripe Connect payouts are implemented (Phase 6), a separate "Bank transfer initiated" notification should be added.

---

## Phase 0 Audit Correction

The Phase 0 audit listed these four events as **missing**:
- Document approved
- Document rejected
- Listing approved
- Listing rejected

These were already implemented in `lib/admin.ts` (inside `approveVerificationDocumentForAdmin`, `rejectVerificationDocumentForAdmin`, `approveListingForAdmin`, `rejectListingForAdmin`). The Phase 0 audit only read the thin route files which delegate to these lib functions, missing the underlying implementation.

**No new code was needed for these four events.**

---

## Email Template Notes

All notification emails use the shared `sendNotificationEmail()` template from `lib/email.ts`. This template:
- Sends from the configured SMTP account
- Shows the notification title as heading
- Shows the notification body as the summary
- Includes a CTA button linking to `notification.linkUrl`
- Is styled with GetYourCave brand colors (orange `#f26a1b`)

The login 2FA and password reset emails use dedicated, more detailed templates also in `lib/email.ts`.

**Notification body strings are English-hardcoded.** Server-side i18n is not implemented for notification bodies. This is documented as Phase 5/6 follow-up work.

---

## Manual Testing Steps

### Prerequisites
- Local dev server running: `NODE_ENV=development npx tsx server.ts`
- SMTP configured in `.env` (Gmail app password or similar)
- At least one admin user, one owner, one renter seeded
- `emailNotificationsEnabled = true` for test users (default is `true`)

### 1. New Message
1. Log in as owner, open a conversation from `/messaging`
2. Send a message
3. Check renter's email inbox for "New message from [owner name]"

### 2. New Booking Request
1. Log in as renter, find an approved listing, click "Book now"
2. Submit a booking request
3. Check owner's email inbox for "Booking request" notification

### 3. Booking Accepted/Rejected
1. Log in as owner, go to `/owner/dashboard`
2. Approve or reject a pending booking
3. Check renter's email inbox for "Request accepted" or "Request rejected"

### 4. Payment Received & Owner Payout
1. Renter pays via Stripe checkout (use test card `4242 4242 4242 4242`)
2. Stripe CLI must be forwarding: `stripe listen --forward-to http://localhost:3000/api/payments/webhook`
3. After webhook fires: check renter inbox for "Payment received", owner inbox for "Owner payout completed"

### 5. Payment Failed
1. Use Stripe test card `4000 0000 0000 9995` (declines)
2. Renter's email should receive "Payment failed" notification

### 6. Contract Signed
1. Owner or renter signs a generated contract at `/contracts`
2. The OTHER party receives "Contract signed" or "Contract partially signed" email

### 7. Document Approved
1. Log in as admin, go to `/admin/dashboard`
2. Approve a pending verification document
3. Check the submitting user's inbox for "Document approved"

### 8. Document Rejected
1. Admin rejects a pending document (with optional reason)
2. Check user's inbox for "Document rejected" with rejection reason if provided

### 9. Listing Published
1. Admin approves a pending listing from `/admin/dashboard`
2. Owner receives "Listing published" email

### 10. Listing Rejected
1. Admin rejects a listing with optional reason
2. Owner receives "Listing rejected" email with reason

### 11. Listing Expired
1. Log in as owner, go to a listing, use the "Archive" action
2. Owner's inbox should receive "Listing expired" email

### 12. Login 2FA Code
1. In production environment (`NODE_ENV=production`), attempt to log in
2. Email with 6-digit verification code is sent to the user's email

### 13. Password Reset
1. Go to `/forget_password_page`, enter email, click "Send reset link"
2. User receives password reset email with secure link

---

## Files Responsible (Summary)

| File | Events Handled |
|---|---|
| `lib/notifications.ts` | Core notification + email dispatch (all events flow through here) |
| `lib/email.ts` | Email templates: notification, message notification, 2FA code, password reset |
| `lib/bookings.ts` | Booking request, approved, rejected, cancelled |
| `lib/admin.ts` | Listing published, listing rejected, document approved, document rejected |
| `lib/listings.ts` | Listing expired, listing re-published |
| `lib/contracts/generateContract.ts` | Contract signed / partially signed |
| `lib/messages.ts` | New message notification |
| `lib/verification.ts` | Verification submitted |
| `app/api/payments/webhook/route.ts` | Payment received, payment failed, owner payout completed |
| `app/api/auth/login/route.ts` | Triggers 2FA code email |
| `app/api/auth/forgot-password/route.ts` | Triggers password reset email |

---

## Follow-up Items (Future Phases)

| Item | Priority | Notes |
|---|---|---|
| Server-side i18n for notification bodies | P2 | All notification bodies are English-hardcoded strings; translating requires a server locale detection mechanism |
| Auto-expiry cron job + notification | P2 | Implement if listings need to auto-expire; add `createNotificationForUser` in that job |
| Stripe Connect payout notification | P2 | Add "Bank transfer sent" email when owner bank payouts are implemented |
| Notification body improvements | P3 | Document type labels use raw string replacement; `getVerificationDocumentTypeLabel` is imported but not used in notification bodies |
| Unsubscribe link in emails | P3 | Required for GDPR compliance in France; currently emails have no unsubscribe mechanism |

*Phase 4 complete. No application code was modified.*
