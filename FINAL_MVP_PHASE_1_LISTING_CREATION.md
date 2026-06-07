# GetYourCave — Phase 1: Public Listing Creation (No Verification Gate)

> **Status:** ✅ COMPLETE — Implemented and validated.
> **Date:** 2026-06-06
> **Scope:** Remove all verification/admin-approval gates from the listing creation flow so any authenticated owner can create a listing that becomes publicly visible immediately.

---

## 1. Old Behavior (before Phase 1)

| Gate | Location | Effect |
|---|---|---|
| Server redirect | `app/create-listing/layout.tsx:28` | Owners with `status !== "ACTIVE"` (i.e., `PENDING_VERIFICATION`) were redirected to `/document` instead of seeing the form |
| Client-side overlay | `app/create-listing/page.tsx:750-780` | Unverified owners who somehow reached the page saw a "Verification under review" overlay blocking the form |
| Nav link hijack | `components/layout/Topbar.tsx:64-71` (desktop) + `:122-127` (mobile) | "Create Listing" nav link silently redirected unverified owners to `/document` instead of `/create-listing` |
| API stores wrong status | `app/api/listings/route.ts` | Client sends `status=PENDING_APPROVAL`; API stored it as-is → `isPublished=false` → listing invisible publicly |
| API blocks APPROVED on PATCH | `app/api/listings/[id]/route.ts:100-111` | PATCH rejected if owner sent `status=APPROVED`, preventing re-publish |
| Public query gate | `lib/listings.ts:buildPublicWhere` | Listings required `status=APPROVED AND isPublished=true` to appear publicly (correct, unchanged) |
| Wrong locale copy | `locales/en|fr/common.json` | `pendingOverlayBody` said "You can create a listing once your documents are verified" |
| Broken locale keys | `components/owner/OwnerListingActions.tsx` | `t("submitForReview")` and `t("draft")` resolved to the raw key strings (missing root-level keys); button showed `"submitForReview"` as text |

---

## 2. New Behavior (after Phase 1)

| Scenario | Result |
|---|---|
| Unauthenticated user opens `/create-listing` | Redirected to `/login?next=/create-listing` (unchanged) |
| Non-owner opens `/create-listing` | Redirected to correct dashboard (unchanged) |
| Owner with any verification status opens `/create-listing` | Form opens immediately — no redirect, no overlay |
| Owner clicks "Create Listing" in nav | Goes directly to `/create-listing` regardless of verification status |
| Owner submits listing (final step) | API maps `PENDING_APPROVAL` → `APPROVED` + `isPublished=true` → listing is live immediately |
| Owner uses "Publish" button in listing actions | Same API mapping — listing goes live immediately |
| Public `/storage` page | Shows listing immediately after creation |
| Renter views listing | Can view immediately |
| Admin approval | Not required. Admin can still manage (approve/reject/archive) listings via admin panel, but it is not a prerequisite for public display. |

---

## 3. Files Changed

| File | Change |
|---|---|
| `app/create-listing/layout.tsx` | Removed `status !== "ACTIVE"` server redirect to `/document`. Only auth + role checks remain. |
| `app/create-listing/page.tsx` | Removed `"pending"` from `sessionStatus` type/logic; removed entire `if (sessionStatus === "pending")` overlay block (31 lines). |
| `app/api/listings/route.ts` | Added `ListingStatus` import; maps `PENDING_APPROVAL` → `APPROVED` + `isPublished: true` before `createOwnerListing`. |
| `app/api/listings/[id]/route.ts` | Removed the block that rejected owners setting `status=APPROVED`; maps `PENDING_APPROVAL` → `APPROVED` + `isPublished: true` before `updateOwnerListing`. |
| `components/layout/Topbar.tsx` | Removed `resolvedHref` logic that redirected to `/document` in both desktop (line 64-71) and mobile (line 122-127) nav menus. |
| `components/owner/OwnerListingActions.tsx` | Fixed `t("submitForReview")` → `t("common.publish")` ("Publish"); fixed `t("draft")` → `t("common.saveDraft")`; fixed `t("loading")` → `t("common.loading")`. |
| `locales/en/common.json` | Updated `verification.pendingOverlayBody` — removed the false claim "You can create a listing once your documents are verified." |
| `locales/fr/common.json` | Same update for FR locale. |

---

## 4. How Listings Go Public

The client form sends `status: "PENDING_APPROVAL"` as the publish signal (unchanged — client-side validation still uses `listingPublishSchema` for completeness checks). The API intercepts this and stores:

```
status    = APPROVED    (was: PENDING_APPROVAL)
isPublished = true      (was: false)
```

`lib/listings.ts → buildPublicWhere` already requires `status=APPROVED AND isPublished=true`. Since both are now set on creation, the listing appears in all public queries immediately. No change to `lib/listings.ts` was needed.

---

## 5. Admin Listing Management (preserved)

The following admin functionality is **unchanged and fully operational**:

- `GET /api/admin/listings` — list all listings with filters
- `POST /api/admin/listings/[id]/approve` — mark listing APPROVED (no-op if already approved)
- `POST /api/admin/listings/[id]/reject` — mark listing REJECTED + set `isPublished=false`
- `GET /api/admin/verifications` — verification document review
- Admin dashboard listing queue still works for moderation

The `PENDING_APPROVAL` status value still exists in the schema and can be used by admin workflows if needed in future phases.

---

## 6. Validation Results

| Command | Result |
|---|---|
| `npx prisma validate` | ✅ Schema valid |
| `npx tsc --noEmit` | ✅ Zero TypeScript errors |
| `npx next build` | ✅ Compiled successfully — 80 routes, all passing |
| `node -e JSON.parse(...)` on EN locale | ✅ Valid JSON |
| `node -e JSON.parse(...)` on FR locale | ✅ Valid JSON |

No schema migrations. No DB changes. No CSS/theme changes. No Stripe/payment files touched.

---

## 7. Manual Test Steps

1. **Create an owner account** with no documents uploaded (default `status = PENDING_VERIFICATION`).
2. **Click "Create Listing"** in the top nav → should go directly to `/create-listing` (not `/document`).
3. **Confirm the form renders** — no overlay, no "Verification under review" message.
4. **Fill in all 5 steps** (basic details, photos, pricing, location, amenities).
5. **Submit the listing** (final step "Publish" button) → should redirect to `/owner/dashboard`.
6. **Open `/storage`** (public listings page) → new listing should appear immediately.
7. **Click the listing** → detail page should load with full information.
8. **Log in as a renter** → confirm the listing is visible and bookable.
9. **Log in as admin** → confirm the listing appears in admin listings panel.
10. **Confirm admin approval was not required** at any step.

---

## 8. Remaining Risks / Notes

| Item | Risk | Notes |
|---|---|---|
| `PENDING_APPROVAL` enum value still in DB/schema | 🟢 Low | Intentionally kept — admin may use it in future moderation flows. No code path sets it anymore for new listings. |
| Owner can create unlimited public listings without verification | 🟡 Medium | Intentional per MVP. Document verification is only required at contract finalization (Phase 2). |
| `lib/listings.ts → buildPublicWhere` unchanged | 🟢 | Still requires `status=APPROVED AND isPublished=true` — correct behavior, no regression. |
| Admin reject flow still sets `isPublished=false` | 🟢 | Correct — admin can still take down listings after the fact. |
| `verification.pendingOverlayBody` key still exists | 🟢 | Key updated to remove the false claim. Still used on the `/document` page for general pending-review messaging. |

---

## 9. Next Phase

**Phase 2 — Move document verification to contract finalization.**

Owner uploads ID + ownership proof only when a booking is about to proceed to contract. Admin reviews docs before contract advances. The `TemporaryDocument` table (adopted in Phase 0.5) and `BookingStatus.DOCUMENTS_REQUIRED / ADMIN_REVIEW` enum values are already in the DB and schema, ready for Phase 2.
