# Stripe Webhook Debug Guide

---

## Why webhooks are critical

This app uses Stripe **subscription** mode (recurring monthly). Stripe sends a webhook
to your server when the payment is confirmed. Without the webhook:

- Invoice stays ISSUED (not PAID)
- Booking stays APPROVED (not ACTIVE)
- Owner wallet is not credited
- Renter notifications are not sent

**The success page NOW also syncs local state as a fallback** (implemented 2026-06-01).
When the success page is visited and Stripe confirms `payment_status === "paid"`, it
marks the invoice PAID and booking ACTIVE even if the webhook hasn't arrived yet.

But the webhook should still work — it handles recurring monthly charges after the first.

---

## Required setup (every time ngrok URL changes)

### Step 1 — Start ngrok

```
ngrok http 3000
```

Note the new URL. Example:
```
Forwarding  https://fb00-2407-aa80-314-ca28-f898-64d-450e-e18b.ngrok-free.app -> http://localhost:3000
```

### Step 2 — Add/update Stripe Dashboard webhook endpoint

1. Go to https://dashboard.stripe.com/webhooks (make sure you are in **Test mode**)
2. Click **Add endpoint** (or update existing)
3. Set URL: `https://<your-current-ngrok-url>/api/payments/webhook`
   Example: `https://fb00-2407-aa80-314-ca28-f898-64d-450e-e18b.ngrok-free.app/api/payments/webhook`
4. Select events (all required):
   ```
   checkout.session.completed
   checkout.session.expired
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   customer.subscription.paused
   customer.subscription.resumed
   customer.subscription.trial_will_end
   invoice.finalized
   invoice.payment_action_required
   invoice.payment_failed
   invoice.payment_succeeded
   invoice.paid
   payment_intent.payment_failed
   charge.refunded
   refund.created
   refund.updated
   ```
5. Click **Add endpoint**
6. Click **Reveal signing secret** → copy `whsec_...`

### Step 3 — Update `.env`

```env
STRIPE_WEBHOOK_ENDPOINT_URL="https://<your-current-ngrok-url>/api/payments/webhook"
STRIPE_WEBHOOK_SECRET="whsec_<new-secret-from-step-2>"
```

Do NOT use the old endpoint's signing secret — each Stripe endpoint has its own secret.

### Step 4 — Restart app server

```
NODE_ENV=development npx tsx server.ts
```

**CRITICAL: Always restart after changing `.env`.** Next.js reads env vars at startup.

---

## Test flow

```
Browser:        http://localhost:3000  (NOT the ngrok URL)
ngrok:          running and forwarding to localhost:3000
Stripe webhook: https://<ngrok-url>/api/payments/webhook
```

1. Login as renter → go to invoice → click **Pay Now**
2. Check **server terminal** for:
   ```
   [checkout] creating session { bookingId, invoiceId, renterEmail, monthlyAmount, ... }
   [checkout] session created { sessionId: cs_test_..., mode: subscription, ... }
   ```
3. Fill in test card: `4242 4242 4242 4242` / `12/29` / `123`
4. Click **Subscribe**
5. Stripe redirects to `http://localhost:3000/payments/success?session_id=...`

### After payment

**ngrok inspector** (`http://127.0.0.1:4040`):
- Should show: `POST /api/payments/webhook  200 OK`

**Server terminal** should show:
```
[stripe-webhook] event received { eventType: "checkout.session.completed", ... }
[stripe-webhook] subscription checkout completed { sessionId, subscriptionId, bookingId, ... }
```

**App state** (visit `/api/debug/auth-state` for quick check):
- Invoice status → PAID
- Booking status → ACTIVE
- `/invoices` page → invoice shows PAID, no Pay Now button
- `/renter/dashboard` → booking shows ACTIVE
- `/owner/dashboard` → earnings updated

---

## Where to find the payment in Stripe Dashboard

**This app uses subscriptions, NOT one-time payments.**

| Where to look | What you see |
|---|---|
| Stripe → Test → **Checkout Sessions** | The checkout session (cs_test_...) |
| Stripe → Test → **Subscriptions** | Active subscription with `cancel_at` set |
| Stripe → Test → **Customers** | Customer with the renter's email |
| Stripe → Test → **Invoices** | First subscription invoice (status: paid) |
| Stripe → Test → **Payments** | ❌ NOT HERE — one-time charges only |

**If you see nothing**: make sure you are in **Test mode** (toggle top-right in Stripe Dashboard).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No POST to ngrok inspector | ngrok URL mismatch with Stripe Dashboard endpoint | Update endpoint URL, get new secret, update `.env`, restart |
| Webhook receives 400 | `STRIPE_WEBHOOK_SECRET` doesn't match the current endpoint | Re-copy secret from Stripe Dashboard endpoint page |
| Webhook receives 500 | App error processing event | Check server terminal for stack trace |
| Invoice stays ISSUED after payment | Webhook not received AND success page sync failed | Check both ngrok and server terminal for errors |
| "A Stripe checkout session is already in progress" | Previous PENDING payment with checkout session exists | Wait for session to expire (Stripe auto-expires after 24h), or contact admin |
| Success page shows "Payment processing" | Stripe `payment_status !== "paid"` (incomplete payment) | Complete the payment in Stripe Checkout, or retry |
| Success page shows "Payment successful" but invoice is ISSUED | Success page sync failed (DB error) | Check server terminal; webhook should catch up |
| Stripe Dashboard shows no transaction | User looking at wrong section or wrong mode | Check Subscriptions tab, ensure Test mode is on |
| "This invoice is already paid" error on Pay Now | Invoice is PAID — correct behavior | No action needed |

---

## Duplicate payment prevention

The app blocks creating a new checkout session if:
1. Invoice/payment is already PAID (status check)
2. A PENDING payment already has a Stripe checkout session ID (subscription already started)

The StripeCheckoutButton is disabled/hidden on the invoice page when invoice status is PAID,
CANCELLED, or REFUNDED (checked in `app/invoices/[id]/page.tsx`).

---

## Current ngrok URL

```
https://fb00-2407-aa80-314-ca28-f898-64d-450e-e18b.ngrok-free.app
```

Stripe Dashboard webhook endpoint:
```
https://fb00-2407-aa80-314-ca28-f898-64d-450e-e18b.ngrok-free.app/api/payments/webhook
```

Note: ngrok free-tier URLs change every time ngrok is restarted. Update the Stripe Dashboard
endpoint and `.env` every time the ngrok URL changes.
