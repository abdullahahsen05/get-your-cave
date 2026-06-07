# Owner Signup / Login Bug — Root Cause & Fix

## Root Cause

Three routing-layer bugs blocked newly signed-up owners from accessing the platform. **The database writes were correct throughout** — User and OwnerProfile were always persisted successfully.

New users are created with `status: PENDING_VERIFICATION` (the Prisma schema default). Phase 1 removed the admin verification gate from page-level guards (create-listing layout, dashboard), but three spots still treated `PENDING_VERIFICATION` as "blocked":

| # | File | Line | Bug |
|---|------|------|-----|
| 1 | `proxy.ts` | 71 | `hasRouteProfileAccess` returned `false` when `user.status !== "ACTIVE"` — middleware bounced every protected owner route (`/owner/*`, `/create-listing`) back to `/login` |
| 2 | `app/signup/page.tsx` | 197 | Post-signup OWNER was redirected to `/document` (verification page) instead of `/owner/dashboard` |
| 3 | `app/login/page.tsx` | 73 | Post-login OWNER with `status !== "ACTIVE"` was redirected to `/document` instead of `/owner/dashboard` |

Bug #1 was the critical one — even if the owner navigated directly to `/owner/dashboard`, the middleware intercepted and sent them back to `/login`, making it appear the session wasn't persisting.

## DB Checks Performed

```
node --env-file=.env scripts/diag-signup.mjs
```

Result confirmed:
- Latest OWNER (`i220802@nu.edu.pk`) had `status: PENDING_VERIFICATION` and `owner: YES`
- OwnerProfile row was created correctly and linked to the user
- The transaction never rolled back

## Files Changed

| File | Change |
|------|--------|
| `proxy.ts` | Removed `status !== "ACTIVE"` check from `hasRouteProfileAccess` |
| `app/signup/page.tsx` | OWNER now goes to `getDashboardPath(role)` → `/owner/dashboard` after signup |
| `app/login/page.tsx` | Removed `status !== "ACTIVE"` guard in `resolveDestination` |
| `app/owner/dashboard/page.tsx` | Changed no-ownerProfile fallback from `/document` to `/login` |

## Validation

- `npx prisma validate` — ✅ schema valid
- `npx tsc --noEmit` — ✅ no errors
- No migrations needed (no schema changes)

## Manual Test Steps

1. Go to `/signup`
2. Fill in name + email + password, select **Owner** as account type, submit
3. **Expected**: Redirected to `/owner/dashboard` immediately
4. In DB: `User` row exists with `status: PENDING_VERIFICATION`, `OwnerProfile` row exists linked to user
5. Log out, then log in again at `/login`
6. **Expected**: Redirected to `/owner/dashboard`
7. Click **Add New Cave** → opens `/create-listing` with no gate
8. Fill in listing details and publish
9. **Expected**: Listing appears on `/storage` publicly

## Phase 1 Behavior Confirmed Intact

- `/create-listing` layout only checks role = OWNER (no status check)
- Proxy middleware no longer blocks `PENDING_VERIFICATION` owners
- No verification overlay, no document upload gate, no admin approval needed
- Listing goes public immediately on creation
