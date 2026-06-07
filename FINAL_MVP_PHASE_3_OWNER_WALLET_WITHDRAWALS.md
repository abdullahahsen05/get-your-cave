# GetYourCave — Phase 3: Owner Wallet + Withdrawal Requests

> **Status:** ✅ COMPLETE — Migration applied, TypeScript clean, Next.js build passing (96 routes).
> **Date:** 2026-06-07

---

## 1. Wallet Balance Definitions

| Field | Source | Meaning |
|---|---|---|
| `OwnerProfile.walletBalance` | Credited by Stripe webhook (80% of each payment), decremented on refund. **Decremented on withdrawal request creation, incremented back on rejection/cancellation.** | Current money available for new withdrawal requests. |
| `OwnerProfile.pendingPayout` | Credited by Stripe webhook alongside `walletBalance`. Decremented on refund. **NOT touched by withdrawal flow.** | Legacy field — mirrors walletBalance from webhook perspective. Not used for withdrawal gating. |
| `OwnerProfile.totalEarnings` | Incremented/decremented by webhook. | Cumulative earnings (all-time). Used for display only. |
| Pending withdrawals (computed) | Sum of `WithdrawalRequest.amount` where `status IN (REQUESTED, PROCESSING)` for this owner. | Money locked in in-flight withdrawal requests. |

**Balance arithmetic example:**
```
Payment received (€100 rent): walletBalance += 80, pendingPayout += 80, totalEarnings += 80
Owner requests withdrawal of €50: walletBalance -= 50 → walletBalance = 30
Withdrawal rejected: walletBalance += 50 → walletBalance = 80
Withdrawal paid: no change (already deducted on creation)
Refund (€100): walletBalance -= 80 → walletBalance = 0, pendingPayout -= 80, totalEarnings -= 80
```

---

## 2. Status Transitions

```
REQUESTED
  ↓ [owner cancel]      → CANCELLED  (+walletBalance)
  ↓ [admin processing]  → PROCESSING  (no balance change)
  ↓ [admin paid]        → PAID        (no balance change)
  ↓ [admin reject]      → REJECTED   (+walletBalance)

PROCESSING
  ↓ [admin paid]        → PAID        (no balance change)
  ↓ [admin reject]      → REJECTED   (+walletBalance)

PAID / REJECTED / CANCELLED → terminal, no further transitions
```

All transitions use Prisma `$transaction` to prevent race conditions. Balance is re-read inside the transaction on creation to prevent over-drawing.

---

## 3. API Routes Added

| Method | Route | Role | Description |
|---|---|---|---|
| `GET` | `/api/owner/wallet-summary` | OWNER | Returns walletBalance, pendingWithdrawals, totalEarnings, bank info |
| `GET` | `/api/owner/withdrawals` | OWNER | List own withdrawal requests (all statuses) |
| `POST` | `/api/owner/withdrawals` | OWNER | Create withdrawal request (validates balance in tx) |
| `PATCH` | `/api/owner/withdrawals/[id]/cancel` | OWNER | Cancel own REQUESTED withdrawal |
| `GET` | `/api/admin/withdrawals` | ADMIN | List all withdrawals with owner info, optional status filter |
| `PATCH` | `/api/admin/withdrawals/[id]/approve` | ADMIN | `action=PROCESSING` or `action=PAID` (with paymentReference) |
| `PATCH` | `/api/admin/withdrawals/[id]/reject` | ADMIN | Reject with optional adminNote, returns amount to walletBalance |

---

## 4. Migration Created

Migration: `20260606192947_add_withdrawal_requests`

**Added to schema:**
- `WithdrawalStatus` enum (`REQUESTED`, `PROCESSING`, `PAID`, `REJECTED`, `CANCELLED`)
- `WithdrawalRequest` model with fields: `id`, `ownerId`, `amount Decimal(10,2)`, `status`, `iban`, `bankName?`, `accountHolder?`, `adminNote?`, `paymentReference?`, `requestedAt`, `processedAt?`, `processedById?`, `createdAt`, `updatedAt`
- `OwnerProfile` bank fields: `bankName String?`, `accountHolder String?`, `bicSwift String?`
- `OwnerProfile.withdrawalRequests WithdrawalRequest[]` relation
- `User.processedWithdrawals WithdrawalRequest[]` relation (`"WithdrawalProcessor"`)

---

## 5. Files Changed (19 total)

| File | Type | Change |
|---|---|---|
| `prisma/schema.prisma` | Modified | Added `WithdrawalStatus` enum, `WithdrawalRequest` model, bank fields to `OwnerProfile`, relations |
| `prisma/migrations/20260606192947_.../migration.sql` | New | Auto-generated migration SQL |
| `lib/withdrawals.ts` | New | All business logic: create, cancel, list, approve, reject, wallet summary |
| `app/api/owner/wallet-summary/route.ts` | New | GET wallet summary |
| `app/api/owner/withdrawals/route.ts` | New | GET list + POST create |
| `app/api/owner/withdrawals/[id]/cancel/route.ts` | New | PATCH cancel |
| `app/api/admin/withdrawals/route.ts` | New | GET list all |
| `app/api/admin/withdrawals/[id]/approve/route.ts` | New | PATCH PROCESSING/PAID |
| `app/api/admin/withdrawals/[id]/reject/route.ts` | New | PATCH reject |
| `components/owner/WalletWithdrawalForm.tsx` | New | Client form: amount, IBAN, bank details, submit |
| `components/admin/AdminWithdrawalsWorkspace.tsx` | New | Client admin UI: list, mark processing/paid, reject with note |
| `app/owner/wallet/page.tsx` | New | Owner wallet page (client, fetches wallet-summary + withdrawals) |
| `app/admin/withdrawals/page.tsx` | New | Admin withdrawals page (server, fetches listWithdrawalsForAdmin) |
| `app/owner/dashboard/page.tsx` | Modified | Added "My wallet" link button in dashboard header |
| `lib/notifications-i18n.ts` | Modified | Added 5 withdrawal notification title→key mappings |
| `locales/en/common.json` | Modified | Added `notifications.*withdrawal*`, `wallet.*`, `withdrawal.*` keys |
| `locales/fr/common.json` | Modified | Same in French |

---

## 6. Transaction / Race-Condition Protections

- **Create:** `walletBalance` is re-read inside `prisma.$transaction` before comparing against requested amount. If another withdrawal was submitted concurrently, the balance check catches it.
- **Reject:** `walletBalance` increment runs inside a transaction alongside the status update — they're atomic.
- **Status guard:** All transitions check current status before acting (e.g., can't approve an already-PAID request).
- **Idempotency:** `markWithdrawalPaid` and `rejectWithdrawal` only accept `ACTIONABLE_STATUSES` (`REQUESTED`, `PROCESSING`). PAID/REJECTED/CANCELLED → error returned, no side effects.

---

## 7. Notifications / Emails Added

| Event | Title (EN) | Who |
|---|---|---|
| Withdrawal created | "Withdrawal requested" | Owner |
| Withdrawal → PROCESSING | "Withdrawal processing" | Owner |
| Withdrawal → PAID | "Withdrawal paid" | Owner |
| Withdrawal → REJECTED | "Withdrawal rejected" | Owner |
| Withdrawal → CANCELLED | "Withdrawal cancelled" | Owner |

All use existing `createNotificationForUser` → auto-sends email if `emailNotificationsEnabled = true`.

---

## 8. Manual Test Steps

1. Ensure an owner has wallet balance from a successful payment (run through the checkout flow).
2. Login as owner → open `/owner/wallet`.
3. Confirm wallet summary cards show correct balance, totalEarnings.
4. Submit a withdrawal request ≤ available balance with IBAN.
5. Confirm `walletBalance` decreases, request appears as REQUESTED.
6. Try requesting more than balance — confirm error message.
7. Login as admin → open `/admin/withdrawals`.
8. Find the request → click "Mark processing" → confirm status changes to PROCESSING.
9. Enter a payment reference → click "Mark paid" → confirm status changes to PAID.
10. Check owner `/owner/wallet` — request shows as PAID, balance stays reduced.
11. Check owner received notification (in-app + email if configured).
12. **Rejection path:** Create another request → admin rejects with reason → confirm amount returns to walletBalance, request shows REJECTED with admin note.
13. **Cancel path:** Create a request → owner cancels → confirm amount returned, status CANCELLED.
14. Confirm Phase 1 listing creation still works (create listing without verification).
15. Confirm Phase 2 booking docs still work (booking document upload flow).

---

## 9. Risks / Assumptions

| Risk | Severity | Note |
|---|---|---|
| `walletBalance` can go negative after a refund if a withdrawal was already approved | 🟡 | Refund webhook decrements `walletBalance` regardless of pending withdrawals. Admin should check balance before processing. Display negative balance with warning in future phase. |
| `pendingPayout` field is not used for withdrawal gating | 🟢 | Intentional. `pendingPayout` mirrors `walletBalance` in the webhook and is not changed by the withdrawal flow. Only `walletBalance` is used as the withdrawal gate. This preserves existing webhook behavior. |
| No pagination on owner withdrawal history | 🟢 | Acceptable for MVP. Add if owner generates >50 requests. |
| Admin can mark REQUESTED directly to PAID without PROCESSING | 🟢 | Intentional — admin has two buttons: "Mark processing" and "Mark paid". Both paths are valid. |
| Bank details (IBAN, bankName, accountHolder) stored in both WithdrawalRequest and OwnerProfile | 🟢 | OwnerProfile stores latest for pre-filling; WithdrawalRequest stores the snapshot at request time (immutable record). |

---

## 10. Safe to Proceed to Phase 4?

**Yes.** All Phase 3 code is isolated to the wallet/withdrawal flow. Phase 4 (BoldSign contract signing) has no dependency on Phase 3.

**Before Phase 4:** Client must confirm:
- BoldSign API key / webhook secret (env vars needed)
- Signing delivery: email-based (BoldSign emails each signer) vs embedded
- Final FR/EN contract template/legal text
