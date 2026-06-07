# Owner Document Verification Flow
**Updated: pending owner clicking Create Listing now shows overlay, not logout**

## /create-listing behavior by user state

| User state | Result |
|---|---|
| Not logged in | Redirect to `/login?next=/create-listing` |
| RENTER | Redirect to `/renter/dashboard` |
| ADMIN | Redirect to `/admin/dashboard` |
| OWNER — PENDING_VERIFICATION | **Stay logged in, show overlay** |
| OWNER — ACTIVE | Show create-listing form |

## Root cause of the "logout on Create Listing" bug

**Two compounding issues:**

1. **`NotificationsProvider` catch bug** (`components/providers/NotificationsProvider.tsx`): Any error after the session fetch (e.g. notification fetch fail) called `setUser(null)`, making `sessionStatus = "unauthenticated"` → redirect to `/login`. Fixed: `setUser(null)` now only runs if the session fetch itself failed (`sessionResolved = false`).

2. **No server-side guard** (`app/create-listing/page.tsx` is pure `"use client"`): Auth checks were entirely client-side and raced against `loadSession`. Fixed: Added `app/create-listing/layout.tsx` — a server component that checks auth before the page mounts. Pending owners see the overlay server-rendered (no flash, no race).

## Files changed

- `app/create-listing/layout.tsx` — **New**: server-side auth guard with pending overlay
- `components/providers/NotificationsProvider.tsx` — Fixed catch block

---

**Original content below:**

**Fixed in Phase 5 follow-up + multiple bug-fix sessions | Date: 2026-06-01**

---

## What Was Fixed (Summary)

| Bug | Root Cause | Fix |
|---|---|---|
| Pending owner clicking Create Listing was logged out / sent to login | `create-listing` used a standalone `fetch("/api/auth/session")` in a `useEffect`, which raced with `NotificationsProvider.loadSession()`. If that fetch failed or was slow, `user` was set to null, making `AppChrome` switch to public nav (Login/Signup). The overlay was never reliably shown. | Replaced with direct `useNotifications()` read — user state is already populated from the server-rendered layout, overlay shows immediately with no async race |
| Admin could not see user role clearly | Role shown as plain text only | Added styled role badge (OWNER/RENTER/ADMIN) |
| Admin "Verify user" bypassed document approval for owners | `activateUserForAdmin` had no document check | Added guard: owner must have ID + ownership proof approved |
| Admin "Verify user" error was not visible | `handleModerationAction` ignored API error body | Now reads and displays API error message |
| No Approve/Reject buttons in Pending Verifications | Static badge only in last column | Per-document Approve/Reject buttons (from earlier session) |

---

## How `/create-listing` Behaves by User State

| User state | Behavior |
|---|---|
| Not logged in | Skeleton → `window.location.assign("/login")` redirect |
| Logged in but wrong role (RENTER/ADMIN) | Skeleton → `window.location.assign(dashboard)` redirect |
| OWNER with `status !== ACTIVE` (PENDING_VERIFICATION, SUSPENDED) | **Blocking overlay** — "Verification under review" with CTAs to `/document` and `/owner/dashboard` |
| OWNER with `status === ACTIVE` | Form loads normally |

The check uses `useNotifications()` which is seeded from the server-rendered `initialUser` (from `app/layout.tsx` → `getCurrentUser()`). No extra API call is made. The overlay is visible immediately on first render.

---

## How the Full Verification Flow Works

### Step 1 — Owner signs up

1. Owner registers → `User.status = PENDING_VERIFICATION`
2. Owner is redirected to `/document`
3. If owner tries to go to `/create-listing` before verification:
   - Page reads user from `useNotifications()` — already populated from server layout
   - Sees `status !== "ACTIVE"` + `role = "OWNER"`
   - Shows **blocking overlay** immediately (no async race, no logout):
     - Title: "Verification under review"
     - Body: "Your documents have been submitted and are being reviewed..."
     - CTA: "View verification status" → `/document`
     - CTA: "Go to dashboard" → `/owner/dashboard`
   - Session cookie is untouched; owner remains logged in

### Step 2 — Owner uploads documents

1. Owner goes to `/document`
2. Owner uploads:
   - **ID Card** — required for all roles
   - **Proof of Ownership** — required for OWNER role only
3. Owner clicks **"Submit for review"**
4. Documents saved, each with `status = PENDING`
5. Owner receives in-app notification: "Verification submitted"

### Step 3 — Admin sees documents in moderation queue

1. Admin logs in → `/admin/dashboard`
2. **"Pending Verifications"** card shows users with submitted documents
3. Each row shows:
   - User name and email
   - **Role badge** — colored pill: orange/primary for OWNER, secondary for RENTER
   - **"View ID Card"** link — opens document in new tab
   - **"View Ownership Proof"** link (owners only)
   - **Approve** and **Reject** buttons per document

### Step 4 — Admin approves or rejects each document

**To approve a document:**
1. Click the orange **"Approve"** button next to "ID" or "Proof"
2. Button shows "Loading..." while processing
3. On success, queue refreshes

**To reject a document:**
1. Click the grey **"Reject"** button next to the document
2. Browser prompt asks for an optional rejection reason
3. Press Cancel to abort, or enter reason and press OK
4. Document marked REJECTED; owner receives notification + email

### Step 5 — User auto-activation after all documents approved

When admin approves a document, `approveVerificationDocumentForAdmin` calls
`recalculateUserVerificationState` which:

1. Checks all required documents for the user's role
2. If **all required documents are APPROVED** → `User.status = ACTIVE`
3. Updates `ownerProfile.verificationStatus = APPROVED`
4. Sends "Document approved" notification to user

**No manual user activation is needed.** Document approval is the canonical path.

### Step 6 — "Verify User" button (Pending Users section)

The **Pending Users** section has a separate "Verify" button per user.

**For OWNER role:**
- Button is **blocked** if the owner's ID card and proof of ownership are not both approved
- Admin sees a clear error: "Owner's required documents must be approved first. Use the Pending Verifications section to approve the owner's ID card and proof of ownership."
- This prevents accidental bypass of the document approval flow

**For RENTER role:**
- Verify button works normally (renter only needs ID card approved)
- If renter's ID card is already approved, this button is a manual fallback

### Step 7 — Owner can now create listings

Once owner's `User.status = ACTIVE`:
1. Owner logs in → redirected to `/owner/dashboard`
2. Owner navigates to `/create-listing`
3. Session check passes — form loads normally
4. Owner can submit listings

---

## Role Badges in Admin Dashboard

Both the **Pending Verifications** table and the **Pending Users** table show a styled role badge:

| Role | Badge style |
|---|---|
| OWNER | Orange/primary pill |
| RENTER | Secondary/teal pill |
| ADMIN | Neutral grey pill |

---

## What Changes Per Role

| Document | OWNER required | RENTER required |
|---|---|---|
| ID Card | ✅ Yes | ✅ Yes |
| Proof of Ownership | ✅ Yes | ❌ No |

A RENTER only needs ID card approved to become ACTIVE.
An OWNER needs BOTH ID card AND proof of ownership approved.

---

## Manual Test Steps

```
1. Start dev server:
   NODE_ENV=development npx tsx server.ts

2. Seed admin:
   node prisma/seed-admin.js --yes

--- BUG 1: Pending owner / create-listing overlay ---

3. Sign up as OWNER (owner@test.com / Password123!)
   - Redirected to /document
   - DO NOT upload documents yet
   - Navigate to /create-listing directly

4. EXPECTED: "Verification under review" overlay appears
   - No logout, no redirect to /login
   - Two CTAs: "View verification status" and "Go to dashboard"
   - Click "View verification status" → goes to /document
   - Session cookie intact; owner still logged in

--- BUG 3: Verify user bypass ---

5. Upload ID card and ownership proof from /document
   - Click "Submit for review"

6. Log in as admin → /admin/dashboard
   - Go to "Pending Users" section
   - Find the OWNER user → click "Verify"
   - EXPECTED: Error appears: "Owner's required documents must be approved first..."
   - Owner is NOT activated

--- Normal approval flow ---

7. Scroll to "Pending Verifications"
   - Confirm OWNER badge is shown next to the owner's name
   - Click "Approve" next to ID card → queue refreshes
   - Click "Approve" next to ownership proof → both docs approved
   - recalculateUserVerificationState fires → User.status = ACTIVE

8. Now go back to "Pending Users"
   - Owner should no longer appear (status = ACTIVE)
   - OR try clicking "Verify" → "User is already active" message

9. Log back in as owner
   - Should land on /owner/dashboard
   - Navigate to /create-listing → form loads normally (no overlay)
   - Can submit a listing

--- BUG 2: Role badges ---

10. Return to /admin/dashboard as admin
    - Check both "Pending Verifications" and "Pending Users" tables
    - Each row should show a colored role badge (not plain text)
    - OWNER = orange badge, RENTER = teal badge

--- Rejection flow ---

11. Create another OWNER account, upload documents
    - Admin clicks Reject → enters reason → document rejected
    - Owner receives "Document rejected" notification with reason
    - Owner returns to /document, re-uploads, resubmits
```

---

## API Calls

| Action | Endpoint | Method | Handler |
|---|---|---|---|
| Approve document | `/api/admin/verifications/[id]/approve` | PATCH | `approveVerificationDocumentForAdmin` |
| Reject document | `/api/admin/verifications/[id]/reject` | PATCH | `rejectVerificationDocumentForAdmin` |
| Activate user (manual) | `/api/admin/users/[id]/verify` | PATCH | `activateUserForAdmin` (owner-guarded) |

---

## Files Changed in This Session

| File | Change |
|---|---|
| `app/create-listing/page.tsx` | Added session fetch + pending-owner blocking overlay |
| `components/admin/AdminDashboardWorkspace.tsx` | Added `RoleBadge` component; replaced plain-text role in both tables; fixed `handleModerationAction` to read API error message |
| `lib/admin.ts` | Added owner document approval guard in `activateUserForAdmin` |
| `locales/en/common.json` | Added `verification.pendingOverlay*` keys |
| `locales/fr/common.json` | Added `verification.pendingOverlay*` keys (French) |
