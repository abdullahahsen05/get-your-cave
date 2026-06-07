# GetYourCave — Final MVP Demo Checklist

End-to-end flow for manual demo testing. Run with the local dev server and ngrok tunnels for Stripe + BoldSign webhooks.

## Pre-Demo Setup

- [ ] `npm run dev` running on `localhost:3000`
- [ ] DB migrations applied (`npx prisma migrate deploy` or DB already in sync)
- [ ] Stripe CLI listening: `stripe listen --forward-to localhost:3000/api/payments/webhook`
- [ ] ngrok running for BoldSign webhook (if testing BoldSign): `ngrok http 3000`
- [ ] BoldSign webhook URL configured in BoldSign dashboard: `https://<ngrok-id>.ngrok.io/api/contracts/boldsign-webhook`
- [ ] `.env.local` has all required vars (see Phase 8 QA doc)
- [ ] Admin account exists (seed or create directly)

---

## Demo Flow

### 1. Owner Signup & Login
- [ ] Navigate to `/signup`, register as OWNER
- [ ] Verify email (if email verification required)
- [ ] Login → redirected to `/owner/dashboard`
- [ ] Profile shows role: OWNER

### 2. Owner Creates a Public Listing
- [ ] Navigate to `/create-listing`
- [ ] Fill in: title, city, address, price, storage type, images
- [ ] Click "Publish" (or equivalent)
- [ ] Listing goes live immediately — status: APPROVED, isPublished: true
- [ ] Owner receives in-app + email: "Listing published"
- [ ] Listing visible on `/storage` (public)

### 3. Renter Signup & Login
- [ ] Open a different browser/incognito window
- [ ] Navigate to `/signup`, register as RENTER
- [ ] Login → redirected to `/renter/dashboard`

### 4. Renter Views the Listing
- [ ] Navigate to `/storage`
- [ ] Find the listing created in step 2
- [ ] Click listing → view detail page (`/storage/[id]`)
- [ ] Confirm price, storage type, amenities, description displayed

### 5. Renter Creates a Booking
- [ ] On listing detail, click "Book" / "Request booking"
- [ ] Fill in start date, duration, optional note
- [ ] Submit booking request
- [ ] Owner receives: "Booking request" notification
- [ ] Renter sees booking in `/renter/dashboard` with status: PENDING

### 6. Owner Accepts the Booking
- [ ] Switch back to owner session
- [ ] Open `/owner/dashboard` → see pending booking
- [ ] Click "Accept"/"Approve"
- [ ] Renter receives: "Request accepted" notification
- [ ] Booking status → APPROVED

### 7. Admin Requests Booking Documents (if needed)
- [ ] Login as admin
- [ ] Navigate to `/admin/bookings`
- [ ] Find the booking → click "Request documents"
- [ ] Booking status → DOCUMENTS_REQUIRED
- [ ] Owner receives: "Documents required" notification

### 8. Owner Uploads Temporary Documents
- [ ] Switch to owner session
- [ ] Navigate to `/owner/dashboard` → see documents required banner
- [ ] Upload identity document (ID card or passport)
- [ ] Upload ownership proof document
- [ ] Both docs submitted → booking status → ADMIN_REVIEW

### 9. Admin Approves Documents
- [ ] Login as admin
- [ ] Navigate to `/admin/booking-documents`
- [ ] Find pending documents for the booking
- [ ] Approve identity document
- [ ] Approve ownership proof document
- [ ] All docs approved → booking status → APPROVED
- [ ] Owner receives: "Documents approved" notification

### 10. Contract PDF Generated
- [ ] Navigate to `/contracts` or booking detail
- [ ] Click "Generate Contract"
- [ ] Contract PDF created with booking/listing/party details
- [ ] Contract status: GENERATED

### 11. Contract Sent to BoldSign
- [ ] On contract page, click "Send for Signature"
- [ ] BoldSign email sent to owner (order=1) and renter (order=2)
- [ ] Both parties receive: "Contract sent for signature" notification
- [ ] Contract status: SENT_FOR_SIGNATURE

### 12. Owner Signs in BoldSign
- [ ] Owner opens BoldSign email → signs the contract
- [ ] BoldSign webhook fires → `signer.Signed` for order=1
- [ ] Contract status: OWNER_SIGNED
- [ ] Owner receives: "You signed the contract"
- [ ] Renter receives: "Owner signed the contract"

### 13. Renter Signs in BoldSign
- [ ] Renter opens BoldSign email → signs the contract
- [ ] BoldSign webhook fires → `document.Completed`
- [ ] Contract status: SIGNED
- [ ] Both parties receive: "Contract fully signed"
- [ ] Signed PDF + audit trail downloaded and stored locally

### 14. Renter Pays via Stripe
- [ ] Navigate to booking detail / invoices
- [ ] Click "Pay Now" → Stripe Checkout opens
- [ ] Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Complete payment
- [ ] Stripe webhook fires → `checkout.session.completed`
- [ ] Renter receives: "Payment received"
- [ ] Invoice status: PAID

### 15. Owner Earnings Updated
- [ ] Switch to owner session
- [ ] Navigate to `/owner/dashboard` or `/owner/wallet`
- [ ] Wallet balance increased by owner net amount (gross - platform commission)
- [ ] Owner receives: "Owner payout completed"
- [ ] Total earnings and pending payout updated
- [ ] Navigate to `/owner/earnings` → see earnings statement

### 16. Invoice Available
- [ ] Renter navigates to `/invoices`
- [ ] Invoice shows: invoice number, amount, paid status, PDF link
- [ ] Invoice detail shows: gross amount, platform fee, owner net
- [ ] Click PDF → invoice PDF opens

### 17. Owner Requests Withdrawal
- [ ] Navigate to `/owner/wallet`
- [ ] Click "Request Withdrawal"
- [ ] Enter IBAN, bank name, amount (≤ wallet balance)
- [ ] Submit
- [ ] Owner receives: "Withdrawal requested"
- [ ] Withdrawal status: REQUESTED

### 18. Admin Marks Withdrawal Paid
- [ ] Login as admin
- [ ] Navigate to `/admin/withdrawals`
- [ ] Find the withdrawal request
- [ ] Click "Processing" → status: PROCESSING; owner notified
- [ ] Enter payment reference, click "Mark Paid"
- [ ] Status: PAID; owner receives: "Withdrawal paid" with reference

### 19. Verify Notifications Throughout
- [ ] Click bell icon (top right) at each key step above
- [ ] Confirm new notifications appear in bell panel
- [ ] Mark as read
- [ ] Navigate to `/notifications` → see all notifications
- [ ] Confirm emails arrived for each step (check inbox)

### 20. Admin Dashboard Overview
- [ ] Navigate to `/admin/dashboard`
- [ ] Confirm stats: users, listings, revenue, refunds
- [ ] Confirm revenue chart populated
- [ ] Confirm pending listings/verifications show correctly
- [ ] Navigate to `/admin/contracts` → confirm contract shows with BoldSign ID + signed status
- [ ] Navigate to `/admin/payments` → confirm payment shows with Stripe ref, commission breakdown
- [ ] Navigate to `/admin/users` → confirm phoneVerified badge visible

---

## Edge Cases to Test

- [ ] Signature failure: admin clicks "Sync" on contract → status reflects BoldSign state
- [ ] Phone verification: profile page → add phone → request OTP → enter code → "Phone number verified"
- [ ] Refund: Stripe dashboard → refund a payment → webhook fires → "Payment refunded" to renter, "Refund processed" to owner
- [ ] Booking rejection: owner rejects → renter notified
- [ ] Document rejection: admin rejects doc → owner notified; booking reverts to DOCUMENTS_REQUIRED

---

## Known Issues / Limitations for Demo

1. **BoldSign in local dev**: requires ngrok + webhook configured in BoldSign dashboard. Without a real BoldSign API key, use the sync endpoint manually to simulate status changes.
2. **Twilio SMS**: in dev mode, OTP is logged to console (not sent via SMS). Set `SMS_DEV_MODE=false` + Twilio credentials for real SMS.
3. **PDF generation**: requires system fonts. If PDF generation fails locally, check Puppeteer/Chrome installation.
4. **Realtime bell**: Socket.IO realtime works in local custom server (`npm run dev` via `proxy.ts`). In production Vercel, bell updates via polling on page load.
5. **Email delivery**: confirm `SMTP_*` env vars configured. Test with a real email address.
