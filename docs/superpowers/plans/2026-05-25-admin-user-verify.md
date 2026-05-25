# Admin User Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to activate pending users directly from the admin dashboard without requiring document uploads.

**Architecture:** Add a server-side `activateUserForAdmin()` function in `lib/admin.ts`, expose it via a new `PATCH /api/admin/users/[id]/verify` route, and add a "Pending Users" card to `AdminDashboardWorkspace.tsx` using the same table/card style as the existing moderation queues.

**Tech Stack:** Next.js 15 App Router, Prisma, PostgreSQL, React, TypeScript, Zod

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/admin.ts` | Add `activateUserForAdmin()` — sets User.status=ACTIVE, profile verificationStatus=APPROVED, writes AdminLog |
| Create | `app/api/admin/users/[id]/verify/route.ts` | PATCH endpoint: admin-only, validates user exists, calls activateUserForAdmin |
| Modify | `components/admin/AdminDashboardWorkspace.tsx` | Add pendingUsers state + fetch; new section card; extend busyAction + handleModerationAction to handle kind="user" |

---

### Task 1: Add `activateUserForAdmin()` to `lib/admin.ts`

**Files:**
- Modify: `lib/admin.ts` (append after `rejectVerificationDocumentForAdmin`)

- [ ] **Step 1: Open `lib/admin.ts` and append the new function at the bottom of the file, before the final `listVerificationDocumentsForUser` export.**

Add this function:

```typescript
export async function activateUserForAdmin(userId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        ownerProfile: { select: { id: true } },
        renterProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return { error: "User not found." } as const;
    }

    if (user.status === AccountStatus.ACTIVE) {
      return { error: "User is already active." } as const;
    }

    await tx.user.update({
      where: { id: userId },
      data: { status: AccountStatus.ACTIVE },
    });

    if (user.ownerProfile) {
      await tx.ownerProfile.update({
        where: { id: user.ownerProfile.id },
        data: { verificationStatus: VerificationStatus.APPROVED },
      });
    }

    if (user.renterProfile) {
      await tx.renterProfile.update({
        where: { id: user.renterProfile.id },
        data: { verificationStatus: VerificationStatus.APPROVED },
      });
    }

    await tx.adminLog.create({
      data: {
        adminId,
        targetUserId: userId,
        entityType: AdminEntityType.USER,
        entityId: userId,
        action: "USER_ACTIVATED",
        details: {
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          statusLabel: "Verified",
        },
      },
    });

    return {
      userId,
      status: AccountStatus.ACTIVE,
    } as const;
  });
}
```

Note: `AccountStatus`, `VerificationStatus`, `AdminEntityType` are already imported at the top of `lib/admin.ts` — no new imports needed.

- [ ] **Step 2: Verify TypeScript compiles cleanly.**

```powershell
npx tsc --noEmit
```

Expected: no errors referencing `lib/admin.ts`.

---

### Task 2: Create `PATCH /api/admin/users/[id]/verify`

**Files:**
- Create: `app/api/admin/users/[id]/verify/route.ts`

- [ ] **Step 1: Create the directory and file.**

```powershell
New-Item -ItemType Directory -Force "app\api\admin\users\[id]\verify"
```

- [ ] **Step 2: Write the route file.**

Full content of `app/api/admin/users/[id]/verify/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { activateUserForAdmin, requireAdminAccess } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const adminUser = access.user;
  const { id } = await context.params;

  const result = await activateUserForAdmin(id, adminUser.id);

  if ("error" in result) {
    const status = result.error === "User not found." ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly.**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 3: Update `AdminDashboardWorkspace.tsx` — state and data fetching

**Files:**
- Modify: `components/admin/AdminDashboardWorkspace.tsx`

The component already has:
- `pendingListings` state + fetch
- `pendingVerifications` state + fetch
- `busyAction` state with `kind: "listing" | "verification"`
- `handleModerationAction` dispatcher

We extend all of these to add `kind: "user"`.

- [ ] **Step 1: Add the `PendingUserRow` type near the top of the file (after the existing `PendingVerificationRow` type definition, around line 94).**

```typescript
type PendingUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};
```

- [ ] **Step 2: Extend the `busyAction` state type to include `kind: "user"`.**

Find this block (around line 219):
```typescript
  const [busyAction, setBusyAction] = useState<{
    kind: "listing" | "verification";
    id: string;
    action: "approve" | "reject";
  } | null>(null);
```

Replace with:
```typescript
  const [busyAction, setBusyAction] = useState<{
    kind: "listing" | "verification" | "user";
    id: string;
    action: "approve" | "reject";
  } | null>(null);
```

- [ ] **Step 3: Add `pendingUsers` state alongside the other pending states (around line 215).**

Find:
```typescript
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerificationRow[]>([]);
```

After that line, add:
```typescript
  const [pendingUsers, setPendingUsers] = useState<PendingUserRow[]>([]);
```

- [ ] **Step 4: Extend `loadModerationQueues` to also fetch pending users.**

Find the existing parallel fetch in `loadModerationQueues` (around line 308):
```typescript
        const [listingsResponse, verificationsResponse] = await Promise.all([
          fetch("/api/admin/listings?status=PENDING_APPROVAL&limit=5", {
            cache: "no-store",
          }),
          fetch("/api/admin/verifications?status=PENDING&limit=5", {
            cache: "no-store",
          }),
        ]);
```

Replace with:
```typescript
        const [listingsResponse, verificationsResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/listings?status=PENDING_APPROVAL&limit=5", {
            cache: "no-store",
          }),
          fetch("/api/admin/verifications?status=PENDING&limit=5", {
            cache: "no-store",
          }),
          fetch("/api/admin/users?status=PENDING_VERIFICATION&limit=5", {
            cache: "no-store",
          }),
        ]);
```

- [ ] **Step 5: Add the error check and data extraction for `usersResponse`.**

Find:
```typescript
        if (!verificationsResponse.ok) {
          throw new Error(t("errors.unableToLoadPendingVerificationDocuments"));
        }
```

After that block, add:
```typescript
        if (!usersResponse.ok) {
          throw new Error("Unable to load pending users.");
        }
```

Find:
```typescript
        const verificationsData = (await verificationsResponse.json()) as {
          rows?: PendingVerificationRow[];
        };
```

After that line, add:
```typescript
        const usersData = (await usersResponse.json()) as {
          rows?: PendingUserRow[];
        };
```

Find:
```typescript
          setPendingVerifications(verificationsData.rows ?? []);
```

After that line, add:
```typescript
          setPendingUsers(usersData.rows ?? []);
```

---

### Task 4: Wire `handleModerationAction` for user activation

**Files:**
- Modify: `components/admin/AdminDashboardWorkspace.tsx`

- [ ] **Step 1: Extend `handleModerationAction` to route `kind === "user"` to the new endpoint.**

Find the block where `endpoint` is assigned (around line 412):
```typescript
      const endpoint =
        kind === "listing"
          ? "/api/admin/listings"
          : `/api/admin/verifications/${id}/${action}`;
```

Replace with:
```typescript
      const endpoint =
        kind === "listing"
          ? "/api/admin/listings"
          : kind === "user"
            ? `/api/admin/users/${id}/verify`
            : `/api/admin/verifications/${id}/${action}`;
```

Find the block where `bodyPayload` is assigned (around line 417):
```typescript
      const bodyPayload =
        kind === "listing"
          ? {
              id,
              action,
              reason:
                isReject && rejectionReason !== null
                  ? rejectionReason.trim() || undefined
                  : undefined,
            }
          : isReject && rejectionReason !== null
            ? {
                rejectionReason: rejectionReason.trim() || undefined,
              }
            : undefined;
```

Replace with:
```typescript
      const bodyPayload =
        kind === "listing"
          ? {
              id,
              action,
              reason:
                isReject && rejectionReason !== null
                  ? rejectionReason.trim() || undefined
                  : undefined,
            }
          : kind === "user"
            ? undefined
            : isReject && rejectionReason !== null
              ? {
                  rejectionReason: rejectionReason.trim() || undefined,
                }
              : undefined;
```

Also update the rejection-prompt logic so user kind skips it — find (around line 395):
```typescript
    const isReject = action === "reject";
    const rejectionReason = isReject
      ? window.prompt(
        kind === "listing"
            ? t("errors.optionalRejectionReasonListing")
            : t("errors.optionalRejectionReasonVerification"),
        )
      : null;

    if (isReject && rejectionReason === null) {
      return;
    }
```

Replace with:
```typescript
    const isReject = action === "reject";
    const rejectionReason =
      isReject && kind !== "user"
        ? window.prompt(
            kind === "listing"
              ? t("errors.optionalRejectionReasonListing")
              : t("errors.optionalRejectionReasonVerification"),
          )
        : null;

    if (isReject && kind !== "user" && rejectionReason === null) {
      return;
    }
```

---

### Task 5: Add the "Pending Users" UI section

**Files:**
- Modify: `components/admin/AdminDashboardWorkspace.tsx`

- [ ] **Step 1: Add a new `<section>` below the existing two-column moderation grid.**

The existing two-col moderation section ends around:
```tsx
        </section>
```

(the closing tag of the `grid grid-cols-1 gap-6 lg:grid-cols-2` section that contains pendingListings and pendingVerifications cards)

Immediately after that closing `</section>` tag, insert:

```tsx
        {pendingUsers.length > 0 ? (
          <section className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                Pending Users
              </h3>
              <span className="rounded-full border border-[#EBEBE8] bg-white px-3 py-1 text-xs font-semibold text-[#404848]">
                {t("dashboard.admin.queuedCount", { count: pendingUsers.length })}
              </span>
            </div>

            {moderationError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {moderationError}
              </div>
            ) : null}

            {moderationLoading ? (
              <p className="text-sm font-medium text-stone-500">{t("dashboard.admin.loadingModeration")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-[#EBEBE8]">
                    <tr>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.user")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        Role
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.status")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848] text-right">
                        {t("dashboard.admin.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEBE8]">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-semibold leading-[1.5] text-[#0f3d3e]">
                            {user.fullName}
                          </p>
                          <p className="text-xs leading-[1.5] text-[#404848]">{user.email}</p>
                        </td>
                        <td className="py-4 pr-4 text-sm leading-[1.5] text-[#404848]">
                          {user.role}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
                            {t("status.account.PENDING_VERIFICATION")}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            className="rounded-full bg-[#0f3d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            disabled={
                              busyAction?.kind === "user" &&
                              busyAction.id === user.id
                            }
                            type="button"
                            onClick={() => {
                              void handleModerationAction("user", user.id, "approve");
                            }}
                          >
                            {busyAction?.kind === "user" && busyAction.id === user.id
                              ? t("common.loading")
                              : t("common.approve")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
```

- [ ] **Step 2: Run lint.**

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Run TypeScript check.**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 6: Build and sanity check

- [ ] **Step 1: Run full build.**

```powershell
npm run build
```

Expected: exits 0, no type errors, no missing module errors.

- [ ] **Step 2: Run DB sanity (if available).**

```powershell
npm run db:sanity
```

Expected: no critical errors.

- [ ] **Step 3: Commit.**

```powershell
git add lib/admin.ts app/api/admin/users/[id]/verify/route.ts components/admin/AdminDashboardWorkspace.tsx
git commit -m "feat: add admin user activation from dashboard

Adds PATCH /api/admin/users/[id]/verify that sets User.status=ACTIVE
and profile verificationStatus=APPROVED. Pending users now appear in
a dedicated section on the admin dashboard with an Approve button."
```

---

## Manual Test Steps

1. Reset DB to admin-only:
   ```powershell
   npm run db:seed-admin
   npm run dev
   ```
2. Go to `/signup`, create a new OWNER or RENTER account.
3. Log in as admin: `admin@getyourcave.com` / `Password123!`
4. Open `/admin/dashboard`.
5. Scroll to the **Pending Users** section — the new user should appear with role and amber "Pending Verification" badge.
6. Click **Approve**.
7. The section should disappear (user no longer pending) and dashboard stats should refresh.
8. Verify in pgAdmin:
   ```sql
   SELECT id, email, role, status FROM "User" ORDER BY "createdAt" DESC;
   SELECT id, "userId", "verificationStatus" FROM "OwnerProfile";
   SELECT id, "userId", "verificationStatus" FROM "RenterProfile";
   ```
9. Log in as the newly approved user — they should reach their role dashboard without being blocked.

## Summary of What Changes

| Field | Before | After |
|-------|--------|-------|
| `User.status` | `PENDING_VERIFICATION` | `ACTIVE` |
| `OwnerProfile.verificationStatus` | `NOT_SUBMITTED` | `APPROVED` |
| `RenterProfile.verificationStatus` | `NOT_SUBMITTED` | `APPROVED` |
| `AdminLog` | nothing | `USER_ACTIVATED` row created |
