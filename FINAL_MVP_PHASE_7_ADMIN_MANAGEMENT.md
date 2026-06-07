# Phase 7 — Admin Management Improvements

## Summary

Phase 7 completes the admin panel by adding dedicated contracts/signatures management and payments/invoices management pages, and by wiring up all admin areas in the navigation.

---

## Admin Areas: Implemented vs Linked

### Pages Added (New)
| Page | Route | Component |
|------|-------|-----------|
| Admin Contracts & Signatures | `/admin/contracts` | `AdminContractsWorkspace` |
| Admin Payments & Invoices | `/admin/payments` | `AdminPaymentsWorkspace` |

### Pages Already Existing (Linked in Nav)
| Page | Route | Status |
|------|-------|--------|
| Admin Dashboard | `/admin/dashboard` | Existing — nav was already linked |
| Admin Bookings | `/admin/bookings` | Existing — nav was already linked |
| Admin Withdrawals | `/admin/withdrawals` | Existing (Phase 3) — nav link confirmed |
| Admin Users | `/admin/users` | Existing — nav was already linked |
| Admin Booking Documents | `/admin/booking-documents` | Existing (Phase 2) — **added to nav** |

---

## API Routes Added

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/contracts` | List all GeneratedContracts with booking/owner/renter context, BoldSign status |
| GET | `/api/admin/payments` | List all Payments with invoice, booking/owner/renter context |

---

## Navigation Changes

**Before:**
- Dashboard, Bookings, `/contracts` (shared), Withdrawals, Users, Profile

**After (Admin nav):**
- Visible: Dashboard, Bookings, Contracts (`/admin/contracts`), Payments (`/admin/payments`), Withdrawals, Users
- Other: Booking Documents (`/admin/booking-documents`), Profile, Messages, Notifications, Documents, Find a Cave

---

## Admin Contracts Page (`/admin/contracts`)

**Shows per contract:**
- Contract number + generated date
- Booking number + listing title/city
- Owner name/email
- Renter/tenant name/email
- Contract status (color-coded: Generated, Sent, Owner Signed, Signed, Signature Failed, Cancelled)
- BoldSign document ID (truncated)
- Owner signed timestamp / Tenant signed timestamp

**Actions per contract:**
- Download generated PDF (`/api/contracts/:id/download`)
- Download signed PDF (`/api/contracts/:id/signed-pdf`) — only if signed PDF exists
- Download audit trail (`/api/contracts/:id/audit-trail`) — only if audit trail exists
- Sync BoldSign status (POST `/api/contracts/:id/sync-boldsign`) — only if BoldSign doc ID exists

**Filtering:** by status, by search (contract #, booking #, owner, renter name/email, BoldSign ID)

---

## Admin Payments Page (`/admin/payments`)

**Summary cards (filtered view):**
- Total paid (gross)
- Platform commission
- Owner net

**Shows per payment:**
- Booking number + date
- Listing title/city
- Owner name/email
- Renter name/email
- Gross amount
- Platform commission
- Owner net
- Payment status (color-coded: Pending, Paid, Failed, Refunded, Cancelled)
- Refunded timestamp if applicable
- Paid at date
- Stripe Payment Intent ID or Charge ID (truncated)
- Invoice number + status + PDF download link

**Filtering:** by status, by search (booking #, Stripe ref, owner, renter)

---

## Admin Users Page

Already complete from prior phases. Confirmed existing features:
- Role, status, phone number
- `phoneVerified` status with verified badge (Phase 5)
- Owner profile: wallet balance, pending payout, total earnings, IBAN
- Renter profile: address/city details
- Verification documents with file links
- Owner/renter bookings, contracts, invoices, payments

No changes needed.

---

## Admin Withdrawals Page

Already complete from Phase 3. Nav link was already in the admin visible navigation. Confirmed:
- Lists all withdrawal requests
- Status color-coded (Requested, Processing, Paid, Rejected)
- Mark as Processing / Mark as Paid (with payment reference) / Reject (with admin note)
- Shows owner IBAN, bank name, account holder

---

## Admin Booking Documents Page

Already complete from Phase 2. **Added to admin nav** in Other section.
- Lists pending temporary documents for bookings
- Approve/reject with reason
- Shows booking/property/owner context

---

## i18n Changes

### Added to `locales/en/common.json` and `locales/fr/common.json`:

- `nav.bookingDocuments` — nav link label for booking documents
- `admin.contracts.*` — all text for the contracts page (title, subtitle, column headers, action labels, filter labels)
- `admin.payments.*` — all text for the payments page (title, subtitle, column headers, summary card labels, filter labels)

---

## Access Control

All new admin pages and API routes:
- Redirect to `/login` if not authenticated
- Return 403 if authenticated but not `ADMIN` role
- Use `requireAdminAccess()` from `lib/admin.ts`

---

## Files Changed / Created

### New files:
- `app/api/admin/contracts/route.ts`
- `app/api/admin/payments/route.ts`
- `app/admin/contracts/page.tsx`
- `app/admin/payments/page.tsx`
- `components/admin/AdminContractsWorkspace.tsx`
- `components/admin/AdminPaymentsWorkspace.tsx`

### Modified files:
- `components/layout/navigation.ts` — admin nav updated (contracts → `/admin/contracts`, added payments, added booking-documents, imported CreditCard + ShieldCheck icons)
- `locales/en/common.json` — added `nav.bookingDocuments`, `admin.contracts.*`, `admin.payments.*`
- `locales/fr/common.json` — same additions in French

---

## Validation Results

- `npx prisma validate` — ✅ Schema valid
- `npx tsc --noEmit` — ✅ No type errors
- `npx next build` — ✅ Build succeeded, all routes confirmed:
  - `/admin/contracts`
  - `/admin/payments`
  - `/api/admin/contracts`
  - `/api/admin/payments`

---

## Manual Test Checklist

1. **Login as admin** → navigate to `/admin/dashboard`
2. **Check admin navigation**:
   - Visible: Dashboard, Bookings, Contracts, Payments, Withdrawals, Users
   - Other/menu: Booking Documents, Profile, Messages, Notifications
3. **Admin Contracts page** (`/admin/contracts`):
   - Confirm table loads with contract rows (may be empty if no contracts generated yet)
   - Confirm columns: Contract #, Booking, Owner, Renter, Status, BoldSign ID, Signed Dates, Actions
   - Test status filter dropdown
   - Test search input
   - If contracts exist with BoldSign ID: click "Sync" button and confirm status updates
   - If signed PDF exists: confirm "Signed PDF" link opens file
   - If audit trail exists: confirm "Audit Trail" link opens file
4. **Admin Payments page** (`/admin/payments`):
   - Confirm table loads with payment rows
   - Confirm summary cards appear if PAID payments exist
   - Confirm columns: Booking, Property, Owner, Renter, Gross, Commission, Owner Net, Status, Paid At, Stripe Ref, Invoice
   - Test status filter dropdown
   - Test search input
   - If invoice has PDF: confirm download link works
5. **Admin Withdrawals** (`/admin/withdrawals`):
   - Confirm page loads and lists withdrawal requests
   - Mark one REQUESTED → PROCESSING → PAID with a payment reference
   - Confirm admin note/rejection works
6. **Admin Booking Documents** (`/admin/booking-documents`):
   - Confirm page loads (accessible via nav Other menu)
   - Confirm pending documents appear
   - Approve or reject a document
7. **Admin Users** (`/admin/users`):
   - Confirm user list loads
   - Click a user → confirm phoneVerified badge visible in detail panel
   - Confirm owner wallet balance, IBAN visible for owner users

---

## Limitations / Not Implemented

- No send-for-signature action from the admin contracts page (existing `/api/contracts/:id/send-for-signature` route exists but was not wired into admin UI to avoid risk)
- No per-contract or per-payment detail page (detail is available via Admin Users → select user)
- Pagination is set to limit=100 (client-side only); server-side pagination not added to keep scope minimal
- No admin listing management page (`/admin/listings` exists as API but no dedicated full management page — pending listings are handled on the dashboard)

---

## Safe to Proceed to Phase 8

Yes — no schema changes, no Stripe logic changes, no BoldSign logic changes, no Twilio changes, no existing workflow regressions introduced.
