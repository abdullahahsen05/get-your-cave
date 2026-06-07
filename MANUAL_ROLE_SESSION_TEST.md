# Role & Session Manual Test Guide
**Documents the correct renter/owner login routing and session isolation**

---

## Root Cause of the Bug (Fixed)

`resolveDestination` in `app/login/page.tsx` (and the signup destination in `app/signup/page.tsx`)
previously sent **both OWNER and RENTER** to `/document` (the verification upload page)
whenever `user.status !== "ACTIVE"`.

This was wrong for RENTER because:
- Renters can book storage without being ACTIVE — the booking API has no ACTIVE status check
- Sending a PENDING_VERIFICATION renter to `/document` looked like "owner verification page"
- On repeated login (e.g. after owner-accepts-booking flow), renter would be blocked from dashboard

**Fix:** only OWNER is redirected to `/document` when not ACTIVE. RENTER always goes to
`/renter/dashboard` regardless of verification status.

---

## Login Routing Rules (after fix)

| Role | Status | Login destination |
|---|---|---|
| ADMIN | any | `/admin/dashboard` |
| OWNER | ACTIVE | `/owner/dashboard` |
| OWNER | PENDING_VERIFICATION / other | `/document` (must verify before listing) |
| RENTER | any status | `/renter/dashboard` |

---

## Quick Debug Tool

After any login/logout, visit:
```
http://localhost:3000/api/debug/auth-state
```

Expected shape (development only):
```json
{
  "hasCookie": true,
  "userResolved": true,
  "userId": "abc-123",
  "email": "renter@test.com",
  "role": "RENTER",
  "status": "PENDING_VERIFICATION",
  "hasOwnerProfile": false,
  "hasRenterProfile": true,
  "dashboardDestination": "/renter/dashboard",
  "host": "localhost:3000",
  "appUrl": "http://localhost:3000",
  "nodeEnv": "development"
}
```

This confirms: role in DB, whether profiles exist, and what dashboard the user should go to.

---

## Full Manual Test Steps

### Prerequisites

```
NODE_ENV=development npx tsx server.ts
node prisma/seed-admin.js --yes
```

---

### Step 1 — Create renter

1. Open `http://localhost:3000/signup`
2. Sign up as **Renter** — email: `renter@test.com`, password: `Password123!`
3. **Expected**: redirected to `http://localhost:3000/renter/dashboard` (not `/document`)
4. Visit `http://localhost:3000/api/debug/auth-state`
5. **Confirm**: `role = "RENTER"`, `status = "PENDING_VERIFICATION"`, `dashboardDestination = "/renter/dashboard"`

### Step 2 — Renter books a listing

(Need a published listing — see Step 3b or use an existing one)

1. Go to `http://localhost:3000/storage`
2. Click a published listing → set start date and duration → click **Book now**
3. Booking appears on `/renter/dashboard` as PENDING

### Step 3a — Set up owner (if not done)

1. Sign up as **Owner** — email: `owner@test.com`, password: `Password123!`
2. Upload ID card + proof of ownership on `/document`
3. Log in as admin (`admin@getyourcave.com` / `Password123!`) → `/admin/dashboard`
4. Approve both documents → owner becomes ACTIVE
5. Log out admin, log in as owner
6. Create a listing and submit it
7. Log in as admin again → approve the listing

### Step 3b — Owner accepts booking

1. Log out renter
2. Log in as owner (`owner@test.com` / `Password123!`)
3. Visit `http://localhost:3000/api/debug/auth-state`
4. **Confirm**: `role = "OWNER"`, `status = "ACTIVE"`
5. Go to `/owner/dashboard` → find the pending booking request from renter@test.com
6. Click **Approve**
7. Booking status changes to APPROVED; invoice is generated

### Step 4 — Logout owner

1. Click logout in the topbar
2. **Expected**: redirected to `http://localhost:3000/login`
3. Visit `http://localhost:3000/api/debug/auth-state`
4. **Confirm**: `hasCookie = false` OR `userResolved = false`

### Step 5 — Log back in as renter

1. Log in with `renter@test.com` / `Password123!`
2. **Expected**: redirected to `http://localhost:3000/renter/dashboard` (NOT `/document`)
3. Visit `http://localhost:3000/api/debug/auth-state`
4. **Confirm**: `role = "RENTER"`, `dashboardDestination = "/renter/dashboard"`

### Step 6 — Confirm renter sees correct dashboard

On `/renter/dashboard`:
- [ ] Booking appears with status APPROVED
- [ ] Invoice is shown with status ISSUED (payment due)
- [ ] "Pay Now" button is visible on the invoice
- [ ] Contract is accessible
- [ ] Messaging is accessible
- [ ] The nav shows renter navigation (no "Create Listing" link)

---

## What Should NOT Happen

| Symptom | Was happening before fix | After fix |
|---|---|---|
| Renter sent to `/document` after login | ✅ Yes — bug | ❌ No |
| Renter sees owner verification UI | ✅ Yes — consequence of above | ❌ No |
| Renter appears "logged out" after owner accepts booking | ✅ Yes — illusion from wrong routing | ❌ No |
| Booking approval changes renter role or status | ❌ Never — this was not the cause | ❌ Still correct |

---

## What Booking Approval Does (and Does NOT Do)

The owner accepting a booking ONLY:
- Sets `booking.status = APPROVED`
- Generates a contract (`Contract` record)
- Generates an invoice (`Invoice` record)  
- Creates a notification for the renter

It does NOT:
- Change `User.role` or `User.status`
- Change `RenterProfile.verificationStatus`
- Clear or modify the auth cookie
- Create or delete any user profiles
