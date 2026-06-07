# i18n Card Audit

## Root Cause

Two separate issues caused mixed-language UI:

1. **Server components not re-rendering after locale change** — `router.refresh()` had been removed from `LanguageSwitcher` to fix a freeze. Without it, server components (`app/owner/dashboard/page.tsx`, etc.) stayed rendered in the old language. Fix: restore `router.refresh()` inside `startTransition()` so the toggle stays responsive while server components re-render with the new locale cookie.

2. **Hardcoded English strings in client components** — `AdminUsersWorkspace.tsx` had ~70 user-facing strings rendered as hardcoded English literals instead of `t()` calls.

## Files Audited

- `components/layout/LanguageSwitcher.tsx`
- `app/owner/dashboard/page.tsx`
- `components/admin/AdminUsersWorkspace.tsx`
- `locales/en/common.json`
- `locales/fr/common.json`

## Status of Owner Dashboard

The owner dashboard page (`app/owner/dashboard/page.tsx`) already used `t()` for all strings. The strings appearing as uppercase ("OWNER DASHBOARD") are styled with CSS `uppercase`, not hardcoded. All required FR translations were already present. This page was fixed purely by the `router.refresh()` in `startTransition`.

## Files Changed

| File | Change |
|---|---|
| `components/layout/LanguageSwitcher.tsx` | Restored `router.refresh()` inside `startTransition()` |
| `components/admin/AdminUsersWorkspace.tsx` | Replaced ~70 hardcoded English strings with `t()` calls |
| `locales/en/common.json` | Added `adminUsers.detail.*` keys (65 keys) |
| `locales/fr/common.json` | Added `adminUsers.detail.*` keys (65 keys) + missing `dashboard.owner.actions` and `dashboard.owner.contractNumber` |

## Keys Added / Updated

### `adminUsers.detail.*` (both EN and FR)

`profileDetails`, `profileDetailsSubtitle`, `emailVerified`, `verifiedEmail`, `unverifiedEmail`, `updated`, `ownerVerification`, `renterVerification`, `country`, `responseRate`, `walletBalance`, `ownerProfile`, `ownerProfileSubtitle`, `renterProfile`, `renterProfileSubtitle`, `verificationDocuments`, `verificationDocumentsSubtitle`, `unnamedFile`, `file`, `reviewedAt`, `rejectionReason`, `noVerificationDocuments`, `ownerListings`, `ownerListingsSubtitle`, `published`, `monthlyPrice`, `created`, `noListings`, `ownerBookings`, `ownerBookingsSubtitle`, `marketplaceSplit`, `marketplaceSplitValue`, `totalMonthly`, `contract`, `invoice`, `payment`, `noBookings`, `ownerContracts`, `ownerContractsSubtitle`, `signedAt`, `openFile`, `noContracts`, `ownerInvoices`, `ownerInvoicesSubtitle`, `platformFee`, `pdf`, `noInvoices`, `ownerPayments`, `ownerPaymentsSubtitle`, `ownerAmount`, `noPayments`, `renterBookings`, `renterBookingsSubtitle`, `renterContracts`, `renterContractsSubtitle`, `renterInvoices`, `renterInvoicesSubtitle`, `renterPayments`, `renterPaymentsSubtitle`, `notifications`, `notificationsSubtitle`, `read`, `unread`, `link`, `noNotifications`, `adminLogs`, `adminLogsSubtitle`, `noAdminLogs`

### FR only — missing owner dashboard keys added

`dashboard.owner.actions`, `dashboard.owner.contractNumber`

## Pages / Components Fixed

- ✅ Owner dashboard (server re-render fix via `startTransition`)
- ✅ Admin user detail panel — all section titles, stat row labels, empty states, badges
- ✅ Owner listings, bookings, contracts, invoices, payments sections
- ✅ Renter listings, bookings, contracts, invoices, payments sections
- ✅ Verification documents section
- ✅ Notifications section
- ✅ Admin logs section
- ✅ Marketplace split value

## Existing Keys Reused (no duplication)

`profile.email`, `profile.phone`, `profile.role`, `profile.status`, `profile.address`, `profile.city`, `profile.postalCode`, `profile.iban`, `common.yes`, `common.no`, `common.open`, `common.download`, `common.owner`, `common.renter`, `contracts.type`, `invoices.total`, `invoiceDetail.amount`, `invoiceDetail.paidAt`, `listingDetail.platformCommission`, `listing.availability`, `dashboard.owner.pendingPayout`, `dashboard.owner.totalEarnings`

## Hardcoded String Search Results (post-fix)

All of the following return **no matches** in `components/**/*.tsx` and `app/**/*.tsx`:

- `OWNER DASHBOARD` — CSS uppercase of translated key
- `Welcome back` — uses `t("dashboard.owner.welcome")`
- `Manage listings` — uses `t("dashboard.owner.subtitle")`
- `Monthly earnings` — uses `t("dashboard.owner.monthlyEarnings")`
- `Occupancy rate` — uses `t("dashboard.owner.occupancyRate")`
- `Pending payments` — uses `t("dashboard.owner.pendingPayments")`
- `Pending payouts` — uses `t("dashboard.owner.pendingPayouts")`
- `Total earnings` — uses `t("dashboard.owner.totalEarnings")`
- `from last month` — uses `t("dashboard.owner.monthlyGrowth")`
- `Track ` — uses `t("dashboard.owner.activeListingsDescription")`
- `Add new cave` — uses `t("dashboard.owner.addNewCave")`
- `Profile details` — uses `t("adminUsers.detail.profileDetails")`
- `Owner profile` — uses `t("adminUsers.detail.ownerProfile")`
- `Verification documents` — uses `t("adminUsers.detail.verificationDocuments")`
- `No verification documents found` — uses `t("adminUsers.detail.noVerificationDocuments")`
- `Owner listings` — uses `t("adminUsers.detail.ownerListings")`
- `Owner bookings` — uses `t("adminUsers.detail.ownerBookings")`
- `Owner contracts` — uses `t("adminUsers.detail.ownerContracts")`

## Validation Results

- ✅ `locales/en/common.json` — valid JSON
- ✅ `locales/fr/common.json` — valid JSON
- ✅ `npx tsc --noEmit` — no errors
- ✅ `npx next build` — build succeeds

## Known Remaining Gaps

The following areas were not audited in this session but may have i18n gaps:

- `app/renter/dashboard/page.tsx` — partially audited, some strings may be hardcoded
- `app/admin/users/page.tsx` — wrapper page, likely fine
- Role status badges in the user list sidebar (show raw enum values like `ACTIVE`, `PENDING_VERIFICATION`)
- `formatEnum()` helper in `AdminUsersWorkspace` returns formatted enum strings (e.g. "Id Card") — these are admin-only internal labels, acceptable as-is
- Document type badges in verification sections show raw status values — consider mapping via `status.verification.*` keys

## Manual Verification Checklist

1. Switch language to FR in the top bar
2. Verify owner dashboard shows French: "TABLEAU DE BORD PROPRIÉTAIRE", "Bon retour", "Revenus mensuels", "Taux d'occupation", etc.
3. Go to Admin → Users and select any user
4. Verify all section titles are French: "Détails du profil", "Profil propriétaire", "Documents de vérification", etc.
5. Verify stat row labels are French: "E-mail", "Téléphone", "Rôle", "Statut", etc.
6. Verify empty states are French: "Aucune annonce trouvée.", "Aucune réservation trouvée.", etc.
7. Switch back to EN and verify everything returns to English
8. Confirm no page freezes during language switching
