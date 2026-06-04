# Manual Stripe Refund Test

> **IMPORTANT — Test with a NEW payment only**
>
> A fix in a recent session stores `stripeChargeId` on the local Payment record for
> the first time. **Old Payment rows created before that fix have `stripeChargeId = NULL`.**
>
> The refund sync falls back to `stripePaymentIntentId` for those old rows, but if that
> field is also missing (e.g. the payment was created via an older code path), the refund
> cannot be mapped and will be silently ignored.
>
> **Always use a brand-new booking → pay → refund cycle for testing.**
> Do not retest by refunding an old Stripe charge that was paid before the fix was deployed.

## Prerequisites

- App running at `http://localhost:3000`
- ngrok tunnel active: `ngrok http 3000`
- Stripe Dashboard webhook endpoint set to `https://<CURRENT-NGROK-URL>/api/payments/webhook`
- Webhook secret in `.env` matches that exact Stripe Dashboard endpoint (`STRIPE_WEBHOOK_SECRET=whsec_...`)
- Stripe webhook has these events enabled:
  - `checkout.session.completed`
  - `invoice.paid` / `invoice.payment_succeeded`
  - `charge.refunded`
  - `refund.created`
  - `refund.updated`

---

## Step 1 — Verify ngrok + Stripe webhook are in sync

1. Start ngrok: `ngrok http 3000`
2. Copy the new HTTPS URL (e.g. `https://abc123.ngrok-free.app`)
3. In Stripe Dashboard → Developers → Webhooks → your endpoint → **Edit**
4. Update the endpoint URL to `https://abc123.ngrok-free.app/api/payments/webhook`
5. Copy the **Signing secret** (`whsec_...`) for this endpoint
6. Update `.env`: `STRIPE_WEBHOOK_SECRET=whsec_<copied-secret>`
7. Restart the dev server so the new env value is loaded

---

## Step 2 — Complete a test subscription payment

1. Log in as a renter
2. Find an active booking with an unpaid invoice, or create a test booking
3. Open the invoice at `/invoices/[id]` → click **Pay Now**
4. Complete Stripe Checkout with test card `4242 4242 4242 4242`
5. After redirect to the success page, return to `/invoices/[id]`
6. Confirm the invoice status shows **Paid**
7. In the app terminal you should see:
   ```
   [stripe-webhook] event received { eventId: ..., eventType: 'checkout.session.completed' }
   [stripe-webhook] subscription checkout completed { sessionId: ..., subscriptionId: ... }
   [stripe-webhook] subscription invoice synced { eventType: 'invoice.paid', ... }
   ```

---

## Step 3 — Refund the payment from Stripe Dashboard

1. Open Stripe Dashboard → Payments (or Billing → Invoices for subscription payments)
2. Find the payment just made (search by customer email or amount)
3. Open the payment/charge
4. Click **Refund** → choose **Full refund** → Confirm
5. Stripe will send `charge.refunded` and/or `refund.created` events to your webhook endpoint

---

## Step 4 — Confirm webhook receipt in ngrok inspector

1. Open ngrok inspector: `http://127.0.0.1:4040` (or the ngrok web UI)
2. Look for `POST /api/payments/webhook` requests with status **200**
3. You should see one or more events: `charge.refunded`, `refund.created`
4. If you see **0 requests** or **4xx errors**, the webhook is not being delivered — re-check Step 1

---

## Step 5 — Confirm app terminal logs show refund mapping

In the terminal running `next dev`, look for these log lines (dev only):

```
[stripe-webhook] event received { eventId: 'evt_...', eventType: 'charge.refunded' }
[stripe-webhook] refund event details {
  eventType: 'charge.refunded',
  eventId: 'evt_...',
  refundId: null,
  chargeId: 'ch_...',
  paymentIntentId: 'pi_...',
  refundedAmount: 12000,
  currency: 'eur',
  hasMetadata: false,
  metadataPaymentId: null
}
[stripe-webhook] refund applied {
  paymentId: '...',
  bookingId: '...',
  invoiceId: '...',
  paymentIntentId: 'pi_...',
  chargeId: 'ch_...',
  refundApplied: true,
  ownerReverted: true
}
```

**If you see `refund ignored because payment was not found`:**
- The `paymentIntentId` or `chargeId` in the log does not match any local Payment record
- This can happen if the `invoice.paid` webhook was never delivered (e.g. a previous ngrok session)
- Fix: check if the Payment record has `stripePaymentIntentId` populated in the database

---

## Step 6 — Verify invoice status updated

1. Refresh `/invoices` in the browser
2. The invoice that was PAID should now show **Refunded** badge
3. Open `/invoices/[id]` — the status badge should show **Refunded**
4. The **Pay Now** button should be hidden
5. The invoice timeline should include a **Refunded** entry at the bottom

> **If `/invoices` still shows PAID but `/invoices/[id]` shows REFUNDED:**
> The webhook updated the DB, and the detail page fetched fresh data. The list page has
> a short cache — do a hard refresh or wait a moment.

> **If `/invoices/[id]` still shows PAID after the webhook arrived:**
> The invoice detail page has a Stripe fallback sync: on page load it checks Stripe
> directly if the invoice is PAID. If this also fails, check that `stripePaymentIntentId`
> is set on the Payment record in the database.

---

## Step 7 — Confirm in-app notification

1. Click the notification bell (top right)
2. Renter should see: **"Payment refunded"** — *"Your payment for invoice INV-... has been refunded."*
3. The notification links to `/invoices/[id]`

---

## Step 8 — Confirm refund email

1. Check the email inbox for the renter's account
2. Subject should be: **"Payment refunded"**
3. Body should mention the invoice number and confirm the refund
4. Email is only sent if `emailNotificationsEnabled = true` on the user's profile

---

## Step 9 — Confirm owner notification (if wallet was adjusted)

If the owner's wallet balance was credited when payment was made, the refund will also:
1. Decrement `walletBalance`, `pendingPayout`, `totalEarnings` on the owner's profile
2. Send the owner a notification: **"Refund processed"** — *"A payment for [listing title] was refunded and your balance was adjusted."*
3. Send the owner an email (if `emailNotificationsEnabled = true`)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No POST in ngrok inspector | ngrok URL mismatch in Stripe | Re-check Step 1 |
| Webhook POST → 400 `Invalid Stripe webhook` | Signing secret mismatch | Update `STRIPE_WEBHOOK_SECRET` and restart server |
| `refund ignored because payment was not found` | `stripePaymentIntentId` null on Payment | Check DB; `invoice.paid` webhook may have been missed |
| Invoice stuck on PAID after webhook | DB transaction error | Check terminal for `refund webhook failed` error |
| Notification not received | `emailNotificationsEnabled=false` or socket issue | Check user profile settings |

---

## Partial Refunds (Known Limitation)

The current implementation treats any refund event as a **full refund** and sets
`Invoice.status = REFUNDED` and `Payment.status = REFUNDED` regardless of the amount.

Partial refunds from Stripe Dashboard will update the local status to REFUNDED even
though only part of the amount was returned. A future improvement would be to check
`charge.amount_refunded < charge.amount` and set a `PARTIALLY_REFUNDED` status —
but this requires a schema addition.
