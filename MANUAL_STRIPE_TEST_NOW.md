# Manual Stripe Test Guide
**Recommended setup: localhost for app + ngrok for webhooks only**

---

## Why localhost, not ngrok, for the browser

Auth cookies are domain-specific. Logging in at `http://localhost:3000` sets a cookie for
`localhost`. If Stripe then redirects to `https://ngrok-free.dev/payments/success`, the
browser does not send the `localhost` cookie to that domain — you appear logged out.

The simplest fix: keep the browser and app on `localhost`. Only ngrok is needed so Stripe
can reach the local webhook endpoint from the internet.

---

## Required running processes

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `NODE_ENV=development npx tsx server.ts` | App server |
| 2 | `ngrok http 3000` | Tunnel for Stripe webhooks |
| Browser | `http://localhost:3000` | App UI |
| ngrok inspector | `http://127.0.0.1:4040` | Watch webhook deliveries |

---

## Pre-flight checklist

```
[ ] .env has:
      NEXT_PUBLIC_APP_URL="http://localhost:3000"
      STRIPE_WEBHOOK_SECRET=whsec_...   ← from Stripe Dashboard endpoint below

[ ] Stripe Dashboard has an active webhook endpoint:
      URL:    https://muppet-backache-move.ngrok-free.dev/api/payments/webhook
      Status: Enabled
      The signing secret for this endpoint = the value in STRIPE_WEBHOOK_SECRET

[ ] Dev server is running:
      NODE_ENV=development npx tsx server.ts

[ ] ngrok is running and forwarding:
      https://muppet-backache-move.ngrok-free.dev -> http://localhost:3000

[ ] Admin user exists:
      node prisma/seed-admin.js --yes
      Login: admin@getyourcave.com / Password123!
```

---

## Step-by-step test flow

### Step 1 — Start everything

```
Terminal 1:  NODE_ENV=development npx tsx server.ts
Terminal 2:  ngrok http 3000
```

Confirm ngrok output shows:
```
Forwarding  https://muppet-backache-move.ngrok-free.dev -> http://localhost:3000
```

### Step 2 — Confirm Stripe webhook endpoint

1. Go to https://dashboard.stripe.com/webhooks (Test mode)
2. Confirm endpoint URL is: `https://muppet-backache-move.ngrok-free.dev/api/payments/webhook`
3. Status must be **Enabled**
4. If it doesn't exist, click **Add endpoint**:
   - URL: `https://muppet-backache-move.ngrok-free.dev/api/payments/webhook`
   - Events: see list below
   - After saving, click **Reveal signing secret** → copy `whsec_...`
   - Paste into `.env` as `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Restart the app server

**Webhook events to subscribe:**
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
```

### Step 3 — Create owner and verify documents

Open `http://localhost:3000` in your browser.

**As owner:**
1. Sign up at `/signup` → role: Owner, email: `owner@test.com`, password: `Password123!`
2. Redirected to `/document`
3. Upload any image/PDF as **ID card**
4. Upload any image/PDF as **proof of ownership**
5. Click **Submit for review**

**As admin (`admin@getyourcave.com` / `Password123!`):**
1. Go to `/admin/dashboard`
2. Scroll to **Pending Verifications**
3. Approve the ID card and ownership proof for `owner@test.com`
4. Owner status automatically becomes ACTIVE

### Step 4 — Owner creates and submits a listing

Back as owner:
1. Go to `/create-listing`
2. Step 1 — Title: `Test Cave`, Description: `Test`, Type: `Cellar`
3. Step 2 — Upload any image
4. Step 3 — Price: `100`
5. Step 4 — Address: `1 Rue de Rivoli`, City: `Paris`, click **Find on map**
6. Step 5 — Any amenities → click **Submit Listing**

As admin: go to `/admin/dashboard` → approve the listing.

### Step 5 — Renter books

Sign up as renter (`renter@test.com` / `Password123!`):
1. Go to `/storage` → find **Test Cave**
2. Open listing → set start date (next month), duration: `1` month
3. Click **Book now**

As owner: go to `/owner/dashboard` → approve the booking request.

### Step 6 — Verify invoice amount

As renter:
1. Go to `/invoices`
2. Open the invoice

**Expected:** `€100.00` (one month only — Phase 1 fix)  
**Wrong:** `€600.00` (would mean invoice multiplies by duration — bug from before Phase 1)

### Step 7 — Pay via Stripe

As renter on the invoice page:
1. Click **Pay Now** → redirects to Stripe Checkout
2. Confirm Stripe shows: **€100.00 / month**
3. Use test card:

   | Field | Value |
   |---|---|
   | Card number | `4242 4242 4242 4242` |
   | Expiry | `12 / 29` |
   | CVC | `123` |
   | Name | `Test Renter` |

4. Click **Subscribe**
5. Stripe redirects to: `http://localhost:3000/payments/success?session_id=...`

### Step 8 — Verify webhook delivery

Open `http://127.0.0.1:4040` (ngrok inspector):

```
POST /api/payments/webhook    200 OK    checkout.session.completed
POST /api/payments/webhook    200 OK    invoice.paid
```

Also check Stripe Dashboard → Webhooks → endpoint → **Recent deliveries**.

### Step 9 — Verify app state after payment

| Item | Expected |
|---|---|
| Invoice status | PAID |
| Booking status | ACTIVE |
| Owner wallet | €80.00 (80% of €100) |
| Renter notification | "Payment received" |
| Owner notification | "Owner payout completed" |

---

## Where to find the Stripe payment

This app uses **subscriptions**, not one-time charges.

- Stripe Dashboard → **Test mode** → **Subscriptions** → see active subscription
- Stripe Dashboard → **Test mode** → **Customers** → find customer → Invoices tab
- Stripe Dashboard → **Test mode** → **Invoices** → first invoice status: `paid`
- **NOT** under Stripe Dashboard → Payments (that tab shows one-time payment intents only)

---

## After changing NEXT_PUBLIC_APP_URL

Whenever you change `NEXT_PUBLIC_APP_URL` in `.env`:

1. **Restart the app server** — Next.js reads env vars at startup
2. **Do NOT reuse an already-opened Stripe Checkout page** — Stripe bakes the redirect URL into the session at creation time; old sessions redirect to the old URL
3. Go back to the invoice page and click **Pay Now** again to create a fresh session

---

## Optional: full ngrok browser flow

If you need to test the entire flow through the ngrok URL (e.g. to test the Stripe redirect on a mobile device), you can:

1. Set `NEXT_PUBLIC_APP_URL=https://muppet-backache-move.ngrok-free.dev`
2. Restart server
3. Open `https://muppet-backache-move.ngrok-free.dev/login` in browser
4. Complete the **entire** flow through the ngrok URL — never mix with localhost
5. After testing, switch back to `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Why this matters: auth cookies are domain-specific. If you mix localhost and ngrok URLs in
the same browser session, you will appear logged out on whichever domain you did NOT log in on.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Stripe redirects to ngrok URL (ERR_NGROK_3200) | Old Stripe session has old URL baked in | Restart server, create new Checkout session |
| `payments/success` shows 404 | `NEXT_PUBLIC_APP_URL` wrong or server not restarted | Update `.env`, restart |
| Webhook shows 400 | `STRIPE_WEBHOOK_SECRET` does not match the Dashboard endpoint | Re-copy signing secret from Stripe Dashboard |
| Webhook shows 500 | App error during processing | Check server terminal for stack trace |
| Invoice shows €600 instead of €100 | Phase 1 fix not running | Check `lib/invoices/generateInvoice.ts` |
| Login page stays on login after clicking Sign In | Stale browser state / router cache | Use a new tab or hard-refresh; code fix already applied |
| Appear logged out after Stripe redirect | Mixed localhost/ngrok session | Use localhost only, or ngrok only — never mix |
| Payment successful but no transaction in Stripe Payments | Subscription flow — transaction is under Subscriptions/Invoices | See "Where to find the Stripe payment" section above |

---

## Current .env keys (no secret values shown)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_ENDPOINT_URL=https://muppet-backache-move.ngrok-free.dev/api/payments/webhook
STRIPE_WEBHOOK_SECRET=whsec_...   ← from Stripe Dashboard endpoint
STRIPE_SECRET_KEY=sk_test_...     ← test mode key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   ← test mode key
```
