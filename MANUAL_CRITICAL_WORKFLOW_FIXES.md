# Manual Critical Workflow Fixes

## Issues Fixed

### Issue 3 — Document approval must NOT auto-activate user (CRITICAL)
**Root cause:** `recalculateUserVerificationState` in `lib/admin.ts` was setting `user.status = ACTIVE` whenever all required documents were approved. This bypassed the explicit "Verify User" step that `activateUserForAdmin` enforces (which checks documents before activating).

**Fix:** Removed `tx.user.update({ data: { status: accountStatus } })` from `recalculateUserVerificationState`. Document approval now only updates `ownerProfile.verificationStatus` and `renterProfile.verificationStatus`. The user account status can only change via `activateUserForAdmin`, which already enforces: "Owner's required documents must be approved first."

**Correct two-step flow:**
1. Admin reviews and approves each document → `verificationStatus = APPROVED` (user account stays `PENDING_VERIFICATION`)
2. Admin clicks "Verify User" on the pending users table → `activateUserForAdmin` checks all required docs are approved, then sets `user.status = ACTIVE`

### Issue 5 — Overlapping bookings were not blocked
**Root cause:** `createRenterBooking` in `lib/bookings.ts` had no check for existing `APPROVED` or `ACTIVE` bookings on the same listing for overlapping dates.

**Fix:** Added a `BookingConflictError` class and a conflict check before booking creation:
- Queries for any existing booking on the same listing with status `APPROVED` or `ACTIVE` where `startDate < newEnd AND endDate > newStart`
- If found, throws `BookingConflictError` with the conflicting dates
- The booking API route (`app/api/bookings/route.ts`) catches this and returns HTTP 409 with `{ error: "booking_conflict", conflictStartDate, conflictEndDate }`
- Frontend (`components/listings/ListingDetailPage.tsx`) shows: "This cave is already booked from {start} to {end}."

**Conflict rule:** Bookings with status `APPROVED` or `ACTIVE` block new overlapping bookings. `PENDING` bookings do NOT block (pending is not a hold).

### Issue 4 — Admin could not view listing contents before approval
**Root cause:** No API endpoint existed to fetch full listing details for admin, and the admin dashboard table only showed title/owner.

**Fix:**
1. Added `getAdminListingById` to `lib/admin.ts` — fetches full listing including description, storageType, size, amenities (via relation), and images
2. Created `app/api/admin/listings/[id]/route.ts` — GET endpoint protected by `requireAdminAccess`
3. Added a "View Details" toggle button to each pending listing row in `AdminDashboardWorkspace.tsx`
4. When clicked, fetches listing detail and shows an expandable panel with: photos (up to 4), address, price, storage type, size, owner info, description, amenities

### Issues 1 & 6 — Owner routing after doc submission / Login routing for pending owners
**Root cause analysis:** Both issues are already handled correctly in the codebase:
- `app/login/page.tsx` `resolveDestination()` already routes OWNER with `status !== "ACTIVE"` to `/document`
- `app/create-listing/page.tsx` already shows a "Verification under review" pending overlay with CTAs to `/document` and `/owner/dashboard`
- `app/document/page.tsx` only redirects to login if `currentUser` is null (session expired)

**The Fix 3 above (removing auto-activation) also resolves Issue 1:** Previously, if an admin happened to approve docs right after owner submission, the owner would be auto-activated (bypassing user approval). Now the owner correctly stays in `PENDING_VERIFICATION` until the admin explicitly verifies them.

**If owner still appears "logged out" after doc submission:** This is likely the pending overlay on `/create-listing` being misread as a logout screen. The overlay correctly shows "Verification under review" with two clear CTAs. No auth change happens during document submission.

---

## Files Changed

| File | Change |
|---|---|
| `lib/admin.ts` | Removed auto-activation from `recalculateUserVerificationState`; added `getAdminListingById` |
| `lib/bookings.ts` | Added `BookingConflictError` class and overlap check in `createRenterBooking` |
| `app/api/bookings/route.ts` | Import `BookingConflictError`, catch and return 409 with conflict dates |
| `app/api/admin/listings/[id]/route.ts` | **New file** — admin listing detail GET endpoint |
| `components/admin/AdminDashboardWorkspace.tsx` | Added listing review state, `openListingReview()`, detail panel with photos/info, "View Details" button on each pending row |
| `components/listings/ListingDetailPage.tsx` | Handle `409 booking_conflict` response, show localized conflict message |
| `locales/en/common.json` | Added `listingDetail.bookingConflict` key |
| `locales/fr/common.json` | Added `listingDetail.bookingConflict` key |

---

## Verification Model After Fix

```
Owner uploads docs
  → document.status = PENDING
  → user.status = PENDING_VERIFICATION  (unchanged)

Admin approves each document
  → document.status = APPROVED
  → ownerProfile.verificationStatus = APPROVED  (if all docs approved)
  → user.status = PENDING_VERIFICATION  (UNCHANGED — no auto-activation)

Admin clicks "Verify User" on pending users table
  → activateUserForAdmin() checks:
      - All required docs (ID_CARD, PROOF_OF_OWNERSHIP) are APPROVED
      - If missing: returns error "Owner's required documents must be approved first."
      - If all approved: sets user.status = ACTIVE
  → Owner can now create listings
```

---

## Booking Conflict Rule

```
Blocked statuses: APPROVED, ACTIVE
Not blocked: PENDING (not a hold; owner hasn't accepted yet)

Overlap condition:
  existing.startDate < newBooking.endDate
  AND existing.endDate > newBooking.startDate

HTTP response on conflict:
  Status: 409
  Body: { error: "booking_conflict", conflictStartDate: ISO, conflictEndDate: ISO | null }
```

---

## Manual Test Steps

### 1. Owner submits docs and stays logged in
1. Sign up as OWNER
2. Go to `/document`
3. Upload ID card + proof of ownership
4. Click "Submit for Review"
5. ✅ Page stays on `/document` showing submitted docs
6. Navigate to `/owner/dashboard` → ✅ still logged in, dashboard loads
7. Navigate to `/create-listing` → ✅ sees "Verification under review" overlay (not a login screen)

### 2. Pending owner clicks create listing and sees overlay
1. Log in as OWNER with `PENDING_VERIFICATION` status
2. Navigate to `/create-listing`
3. ✅ Overlay shows: "Verification under review", "View verification status" button, "Go to dashboard" button
4. Both buttons navigate correctly

### 3. Admin approves/rejects docs individually
1. Log in as ADMIN
2. Go to `/admin/dashboard`
3. In "Pending Verifications" section, see grouped users with their documents
4. Click "View ID card" → ✅ file opens in new tab
5. Click "Approve" on ID card → ✅ card disappears from queue
6. Click "Approve" on proof of ownership → ✅ card disappears from queue
7. ✅ User still shows in "Pending Users" section (not auto-activated)

### 4. Admin cannot verify owner before docs approved
1. In "Pending Users" section, click "Approve" on an owner whose docs are NOT yet approved
2. ✅ Error message: "Owner's required documents must be approved first. Use the Pending Verifications section to approve the owner's ID card and proof of ownership."
3. Owner remains in PENDING state

### 5. Docs approved does not skip user verification
1. Admin approves all required docs for an owner
2. ✅ `ownerProfile.verificationStatus = APPROVED`
3. ✅ `user.status` remains `PENDING_VERIFICATION`
4. Owner still cannot create listings (pending overlay shown)
5. Admin clicks "Verify User" → ✅ user becomes ACTIVE
6. Owner can now create listings

### 6. Admin views listing contents before approval
1. In "Pending listings" section, click "View Details" on any listing
2. ✅ Detail panel expands below the row showing: photos, address, price, storage type, size, owner info, description, amenities
3. Click "Approve" or "Reject" → panel closes and row disappears
4. Click "View Details" again on same listing → panel toggles off

### 7. Duplicate/overlapping booking is blocked
1. Create an owner + listing (approved)
2. Log in as renter, book the listing for a date range → booking created (PENDING initially)
3. Owner approves the booking → status = APPROVED
4. Log in as different/same renter, try to book the same listing for overlapping dates
5. ✅ Frontend shows: "This cave is already booked from {startDate} to {endDate}."
6. ✅ Confirmed by POST to `/api/bookings` returning 409

### 8. Unverified owner login routes to /document
1. Log in with valid OWNER credentials (status = PENDING_VERIFICATION)
2. ✅ Redirected to `/document` (not stuck on `/login`)
3. Session cookie is set, user is authenticated
4. Navigate to `/owner/dashboard` → ✅ loads correctly

---

## Remaining Risks

- **Renter auto-activation**: Renters also no longer auto-activate when their ID card is approved. Admin must explicitly click "Verify User" for renters too. If single-step renter activation is desired, add role check back to `recalculateUserVerificationState` for RENTER only.
- **Pending booking hold**: PENDING bookings do not block future bookings. If the product requires a "hold on submit" behavior, change the conflict check to also include `BookingStatus.PENDING`.
- **Admin listing detail**: The detail panel shows raw `storageType` enum (e.g., `BASEMENT`). Consider adding a display label map if UI polish is needed.
