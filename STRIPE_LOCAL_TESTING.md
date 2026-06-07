# Stripe Local Testing Guide — GetYourCave

## 1. Running the App Locally

```bash
# Install dependencies (first time only)
npm install

# Generate Prisma client (first time or after schema changes)
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Seed an admin user (first time only)
node prisma/seed-admin.js --yes

# Start the development server
NODE_ENV=development npx tsx server.ts
```

App is available at: **http://localhost:3000**

> The server runs both Next.js and the Socket.IO messaging server on the same port.
> Do NOT use `npm run dev` directly — it requires `cross-env` which may not be in PATH.
> Use `NODE_ENV=development npx tsx server.ts` instead.

---

## 2. Option A — Stripe CLI (Recommended for Local Dev)

The Stripe CLI forwards webhook events from Stripe directly to your local server.
No public URL is needed. No ngrok required.

### Installation

**Windows (Scoop):**
```powershell
scoop install stripe
```

**Windows (direct download):**
Download from https://github.com/stripe/stripe-cli/releases and add to PATH.

### Setup

```bash
# Step 1: Authenticate with your Stripe account
stripe login
# Follow the browser prompt to authorize

# Step 2: Start webhook forwarding (while dev server is running)
stripe listen --forward-to http://localhost:3000/api/payments/webhook
```

The CLI will print something like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

### Step 3: Copy the signing secret into .env

Open `.env` and set:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then restart the dev server.

### Step 4: Trigger test events manually

In a separate terminal:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

---

## 3. Option B — ngrok (Windows Setup — Stripe Dashboard Webhooks)

Use ngrok when you want to register a webhook endpoint in the Stripe Dashboard,
or when testing from a real phone, sharing with a client, or when Stripe CLI is unavailable.

> **Windows note:** If PowerShell says `ngrok : The term 'ngrok' is not recognized`, ngrok is
> not installed or not in your PATH. Follow the install steps below.

---

### Install ngrok on Windows

#### Option A — winget (recommended, adds ngrok to PATH automatically)

```powershell
winget install -e --id Ngrok.Ngrok
```

After install, **close and reopen PowerShell**, then verify:

```powershell
ngrok version
```

#### Option B — Manual download (no installer required)

1. Go to https://ngrok.com/download and download the **Windows 64-bit** zip.
2. Extract `ngrok.exe` to a folder, e.g. `C:\ngrok\`.
3. Run it using the full path:

```powershell
C:\ngrok\ngrok.exe version
```

> To avoid typing the full path every time, add `C:\ngrok` to your System PATH:
> Start → "Edit the system environment variables" → Environment Variables →
> System variables → Path → Edit → New → `C:\ngrok` → OK.
> Then reopen PowerShell and `ngrok version` will work.

---

### One-time: Add your ngrok auth token

A free ngrok account is required. Sign up at https://ngrok.com, then:

```powershell
# If ngrok is in PATH:
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN

# If using manual path:
C:\ngrok\ngrok.exe config add-authtoken YOUR_NGROK_AUTHTOKEN
```

Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

---

### Step 1: Start the app

```powershell
NODE_ENV=development npx tsx server.ts
```

Keep this running. Open a **second PowerShell window** for the next step.

---

### Step 2: Start the ngrok tunnel

```powershell
# If ngrok is in PATH:
ngrok http 3000

# Or use the npm script (added to package.json):
npm run ngrok

# If using manual path:
C:\ngrok\ngrok.exe http 3000
```

ngrok will display output like:

```
Session Status    online
Forwarding        https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the `https://` forwarding URL** — you need it in the next steps.

---

### Step 3: Register the webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL** — paste your ngrok URL with the webhook path:
   ```
   https://abc123.ngrok-free.app/api/payments/webhook
   ```
4. **Select events to listen to** — add all of these:
   ```
   checkout.session.completed
   checkout.session.expired
   invoice.finalized
   invoice.payment_succeeded
   invoice.paid
   invoice.payment_failed
   invoice.payment_action_required
   payment_intent.payment_failed
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   charge.refunded
   refund.created
   ```
5. Click **"Add endpoint"**
6. On the endpoint detail page, click **"Reveal"** under **Signing secret**
7. Copy the `whsec_...` value — you need it in the next step

---

### Step 4: Update .env

Open `.env` and set these two values (do not commit this file):

```env
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

**Restart the dev server** after changing `.env`:

```powershell
# Stop the running server (Ctrl+C), then restart:
NODE_ENV=development npx tsx server.ts
```

---

### ⚠️ Important: Free ngrok URLs change every session

Every time you stop and restart ngrok, you get a **new random URL**.

When that happens you must:

1. Copy the new `https://...ngrok-free.app` URL from the ngrok terminal
2. Update `NEXT_PUBLIC_APP_URL` in `.env`
3. Go to Stripe Dashboard → Webhooks → **delete the old endpoint** → **add a new one** with the new URL
4. Reveal the new signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env`
5. Restart the dev server

> **Tip:** Paid ngrok plans offer static domains (same URL every session), which avoids these
> repeated updates. See https://ngrok.com/pricing.

---

### Troubleshooting

| Symptom | Fix |
|---|---|
| `ngrok : The term 'ngrok' is not recognized` | Install via `winget install -e --id Ngrok.Ngrok` or use full path `C:\ngrok\ngrok.exe http 3000` |
| `ERR_NGROK_4018` or "authentication failed" | Run `ngrok config add-authtoken YOUR_TOKEN` — free account required |
| `ERR_NGROK_302` or "tunnel not found" | ngrok session expired; restart `ngrok http 3000` and update `.env` + Stripe Dashboard |
| Stripe webhook returns **400 Bad Request** | `STRIPE_WEBHOOK_SECRET` in `.env` doesn't match the Stripe Dashboard signing secret for this endpoint |
| Stripe webhook returns **404 Not Found** | Wrong endpoint path. Must be exactly `/api/payments/webhook` |
| Stripe webhook returns **500 Internal Server Error** | App crashed — check the dev server terminal for error logs |
| Stripe Checkout success page loads but invoice still shows ISSUED | Webhook never reached the app — check ngrok is running and the URL in Stripe Dashboard matches current ngrok URL |
| Webhook signature error in server logs | Stripe Dashboard secret (`whsec_...`) and `.env` `STRIPE_WEBHOOK_SECRET` are out of sync — re-copy the secret |

---

## 4. Stripe Events to Listen For

Register or forward these events:

| Event | Purpose |
|---|---|
| `checkout.session.completed` | Subscription started; sets `cancel_at` based on duration |
| `checkout.session.expired` | Session timed out; marks payment CANCELLED |
| `invoice.finalized` | Recurring monthly invoice created; marks ISSUED |
| `invoice.payment_action_required` | Payment requires action (3DS etc.) |
| `invoice.payment_succeeded` | Monthly payment collected; marks PAID, credits owner |
| `invoice.paid` | Alias for payment succeeded |
| `invoice.payment_failed` | Payment failed; marks OVERDUE, notifies renter |
| `payment_intent.payment_failed` | Payment intent failed; marks FAILED |
| `customer.subscription.created` | Subscription created (logged only) |
| `customer.subscription.updated` | Subscription updated (logged only) |
| `customer.subscription.deleted` | Subscription ended; marks booking COMPLETED |
| `customer.subscription.paused` | Subscription paused (logged only) |
| `customer.subscription.resumed` | Subscription resumed (logged only) |
| `charge.refunded` | Charge refunded; marks payment REFUNDED, debits owner wallet |
| `refund.created` | Refund created; same as above |

**Stripe CLI one-liner to listen for all of them:**
```bash
stripe listen \
  --events checkout.session.completed,checkout.session.expired,invoice.finalized,invoice.payment_action_required,invoice.payment_succeeded,invoice.paid,invoice.payment_failed,payment_intent.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,customer.subscription.trial_will_end,charge.refunded,refund.created,refund.updated \
  --forward-to http://localhost:3000/api/payments/webhook
```

---

## 5. ngrok Session Checklist (quick reference)

Use this every time you start a new ngrok session or the URL changes.

```
[ ] 1. Start the app
        NODE_ENV=development npx tsx server.ts
        (or: npm run dev)

[ ] 2. In a second terminal, start ngrok
        ngrok http 3000
        (or: npm run ngrok)

[ ] 3. Copy the HTTPS forwarding URL shown in the ngrok terminal
        Example: https://muppet-backache-move.ngrok-free.dev

[ ] 4. Update .env (do NOT commit this file)
        NEXT_PUBLIC_APP_URL=https://YOUR-NGROK-URL.ngrok-free.dev
        STRIPE_WEBHOOK_SECRET=whsec_...  (from Stripe Dashboard — see below)

[ ] 5. In Stripe Dashboard → Developers → Webhooks:
        - Delete any old ngrok endpoint (old URL no longer works)
        - Click "Add endpoint"
        - Endpoint URL: https://YOUR-NGROK-URL.ngrok-free.dev/api/payments/webhook
        - Select all required events (see Section 4)
        - Click "Add endpoint"
        - Click "Reveal" under Signing secret → copy whsec_...

[ ] 6. Paste the whsec_... into .env as STRIPE_WEBHOOK_SECRET

[ ] 7. Stop the dev server (Ctrl+C) and restart it
        NODE_ENV=development npx tsx server.ts

[ ] 8. Complete a test payment using card 4242 4242 4242 4242

[ ] 9. Open ngrok inspector at http://127.0.0.1:4040
        - Verify the POST /api/payments/webhook requests appear
        - Status should show 200

[ ] 10. In Stripe Dashboard → Webhooks → your endpoint
         - Under "Recent deliveries", confirm status 200 OK
```

> **Why restart the app after updating `.env`?**
> `NEXT_PUBLIC_APP_URL` is read at request time by `lib/app-url.ts`, so the server must
> reload for the new ngrok URL to be used in Stripe's `success_url` and `cancel_url`.

---

## 7. Full Manual Test Scenario

### Prerequisites
- Dev server running on localhost:3000
- Stripe CLI forwarding webhooks OR ngrok tunnel active
- `STRIPE_WEBHOOK_SECRET` set in `.env`
- Admin user seeded: `node prisma/seed-admin.js --yes`

### Step-by-step

**1. Create an owner account**
- Go to http://localhost:3000/signup
- Register as **Owner**
- Log in

**2. Create and submit a listing**
- Go to `/create-listing`
- Fill all steps: title, photo, pricing (e.g. €100/month), location, amenities
- Submit for approval

**3. Admin approves the listing**
- Log in as admin (credentials from seed script)
- Go to `/admin/dashboard`
- Approve the pending listing

**4. Create a renter account**
- Open incognito / second browser
- Go to http://localhost:3000/signup
- Register as **Renter**
- Log in

**5. Find and book the listing**
- Go to `/storage`
- Open the listing
- Set duration to **6 months** (or any multi-month value)
- Click **Book now**

**6. Owner approves the booking**
- Log in as owner
- Go to `/owner/dashboard`
- Approve the booking request

**7. Verify invoice amount (the fixed bug)**
- Log in as renter
- Go to `/renter/dashboard` or `/invoices`
- ✅ **Expected:** Invoice shows **€100** (one month only), NOT €600
- ❌ **Bug behavior (before fix):** Invoice would have shown €600 (6 × €100)

**8. Pay via Stripe**
- Click **Pay Now** on the invoice
- Stripe checkout opens at **€100/month** recurring
- Use test card: `4242 4242 4242 4242`, any future date, any 3-digit CVC
- For SEPA test: `FR76 3000 6000 0112 3456 7890 189`

**9. Verify webhook processing**
- Watch the Stripe CLI terminal for events
- You should see:
  ```
  --> checkout.session.completed [evt_...]
  --> invoice.paid [evt_...]
  ```
- Back in the app, invoice status should update to **PAID**
- Owner wallet balance should increase by **€80** (80% of €100)
- Platform commission: **€20** (20%)

**10. Verify subscription cancel_at**
- In Stripe Dashboard, find the subscription
- `cancel_at` should be set to approximately `now + 6 months`
- This ensures the subscription automatically cancels after the contracted duration

**11. Verify monthly recurrence**
- Each month, Stripe fires `invoice.paid` again
- Each fires creates a new Payment + Invoice record in the app
- Each shows €100 (one month), not the total contract value

**12. Test subscription end**
- Trigger subscription deletion: `stripe trigger customer.subscription.deleted`
- Booking status should change to **COMPLETED**

---

## 8. The Invoice Bug — Expected Behavior After Fix

### What was wrong (before Phase 1 fix)

| Scenario | Old behavior | Correct behavior |
|---|---|---|
| Listing: €100/month, 6 months | Initial invoice = **€600** | Initial invoice = **€100** |
| Stripe checkout unit amount | €100/month (correct) | €100/month (unchanged) |
| After first webhook | Invoice overwritten to €100 | Invoice stays at €100 |
| Invoice flip-flop | Yes — €600 → €100 on payment | No — always €100 per period |

### Rule

> **Each payable invoice represents exactly one monthly billing period.**
> `durationMonths` controls the Stripe subscription `cancel_at` only.
> It must never be used to multiply the invoice payable total.

### Files changed in Phase 1

| File | Change |
|---|---|
| `lib/invoices/calculateInvoice.ts` | Renamed `durationMonths` → `billingPeriods`; added JSDoc explaining the design |
| `lib/invoices/generateInvoice.ts` | Changed to pass `billingPeriods: 1` (one month per invoice) |

### Showing total contract value in UI

The total expected rental cost (`pricePerMonth × durationMonths`) can still be displayed
as informational text in the booking form or listing detail — e.g. "Total over 6 months: €600".
This is display-only and must not be stored as the invoice `totalAmount`.

---

## 9. Test Cards Reference

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0002` | Card declined |

Use any future expiry date (e.g. `12/29`) and any 3-digit CVC.

**SEPA Direct Debit test IBAN:** `FR76 3000 6000 0112 3456 7890 189`
