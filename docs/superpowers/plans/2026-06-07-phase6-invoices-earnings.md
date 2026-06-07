# Phase 6: Tenant Invoice + Owner Earnings Statement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contract + payment references to tenant invoices, and create a dedicated owner earnings statement page showing per-invoice gross/commission/net breakdown alongside withdrawal history.

**Architecture:** No schema changes needed — all data exists in Payment, Invoice, GeneratedContract, and WithdrawalRequest models. Task 1 enriches the SafeInvoice type with contractNumber/stripeChargeId; Task 2 renders them in the detail UI. Task 3 adds a new `/owner/earnings` page backed by a focused query function and self-contained workspace component. Task 4 adds i18n keys. Task 5 validates.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, react-i18next, existing Tailwind design system.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `lib/invoices/generateInvoice.ts` | Add contractNumber + stripeChargeId/stripeInvoiceId to SafeInvoice type and DB query |
| Modify | `components/invoices/InvoiceDetailPage.tsx` | Render contract ref + payment/stripe ref |
| Create | `lib/invoices/earningsStatement.ts` | Query owner earnings (payments + invoices + contracts) |
| Create | `app/owner/earnings/page.tsx` | Owner earnings statement page (server component, auth guard) |
| Create | `components/owner/EarningsStatementWorkspace.tsx` | Client component — earnings table + withdrawal history |
| Create | `app/api/owner/earnings/route.ts` | GET — returns earnings records + withdrawal history for logged-in owner |
| Modify | `components/layout/navigation.ts` | Add Earnings link to OWNER visible nav |
| Modify | `locales/en/common.json` | Add `earnings.*` keys |
| Modify | `locales/fr/common.json` | Add `earnings.*` keys (French) |
| Create | `FINAL_MVP_PHASE_6_INVOICES_EARNINGS.md` | Phase documentation |

---

## Task 1: Enrich SafeInvoice with contractNumber + stripe references

**Files:**
- Modify: `lib/invoices/generateInvoice.ts`

**Context:**
`SafeInvoice` is defined and exported from `lib/invoices/generateInvoice.ts`. It is returned by `getInvoiceForViewer` and `getInvoicesForViewer`. The DB `Invoice` model already has `stripeInvoiceId`. The `Invoice` joins to `Payment` via `paymentId`, and `Payment` has `stripeChargeId`. The `Invoice` joins to `Booking` via `bookingId`, and `Booking` has a `generatedContract` relation with `contractNumber`.

The existing `contractRecordInclude` pattern in the codebase joins through booking → generatedContract. We follow the same pattern.

- [ ] **Step 1: Read the file to find the SafeInvoice type and the include/select used by getInvoiceForViewer**

```bash
grep -n "SafeInvoice\|contractNumber\|stripeChargeId\|stripeInvoiceId\|payment\s*{\|generatedContract" lib/invoices/generateInvoice.ts | head -60
```

Locate:
- The `SafeInvoice` type definition
- The Prisma `include` object used in invoice queries
- The `toSafeInvoice` mapper function

- [ ] **Step 2: Add fields to the SafeInvoice type**

In `lib/invoices/generateInvoice.ts`, find the `SafeInvoice` type and add after the existing fields (keep existing fields unchanged):

```typescript
  contractNumber: string | null;
  stripeChargeId: string | null;
  stripeInvoiceId: string | null;
```

- [ ] **Step 3: Update the Prisma include to fetch contract and payment refs**

Find the include/select object used in invoice queries. It already joins `payment`. Ensure the payment include selects `stripeChargeId`, and ensure booking include brings in `generatedContract` with `contractNumber`. Add to the booking include:

```typescript
generatedContract: {
  select: { contractNumber: true },
},
```

And to the payment include (if not already there):
```typescript
payment: {
  select: {
    stripeChargeId: true,
    // ... keep existing fields
  },
},
```

- [ ] **Step 4: Update toSafeInvoice to map the new fields**

In the `toSafeInvoice` mapper, add:

```typescript
contractNumber: record.booking.generatedContract?.contractNumber ?? null,
stripeChargeId: record.payment?.stripeChargeId ?? null,
stripeInvoiceId: record.stripeInvoiceId ?? null,
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

---

## Task 2: Render contract ref + payment refs in InvoiceDetailPage

**Files:**
- Modify: `components/invoices/InvoiceDetailPage.tsx`

**Context:**
`InvoiceDetailPage` receives a `SafeInvoice` prop and renders the invoice detail. It already has a "Booking info" section and a "Payment breakdown" section. We add contract ref and payment/stripe refs as additional info rows in the existing detail layout, using the same `<dt>/<dd>` or card row pattern already in use.

- [ ] **Step 1: Read InvoiceDetailPage.tsx to understand the row/card pattern**

```bash
grep -n "bookingNumber\|issuedAt\|renterName\|dt\|dd\|grid\|space-y" components/invoices/InvoiceDetailPage.tsx | head -40
```

Identify the exact JSX pattern used for displaying label/value pairs.

- [ ] **Step 2: Add contract reference row**

Find the booking info section (around the bookingNumber/property display). After the booking number row, add a contract reference row that only renders when `invoice.contractNumber` is set:

```tsx
{invoice.contractNumber ? (
  <div className="flex justify-between gap-4 py-2 border-b border-outline-variant/20">
    <dt className="text-body-sm text-on-surface-variant">{t("invoiceDetail.contractRef")}</dt>
    <dd className="text-body-sm font-medium text-on-surface text-right">{invoice.contractNumber}</dd>
  </div>
) : null}
```

Use the exact same wrapper/className pattern already used in the file for other rows.

- [ ] **Step 3: Add payment reference row**

In the payment breakdown section (where paidAt is shown), add after it:

```tsx
{invoice.stripeChargeId ? (
  <div className="flex justify-between gap-4 py-2 border-b border-outline-variant/20">
    <dt className="text-body-sm text-on-surface-variant">{t("invoiceDetail.paymentRef")}</dt>
    <dd className="text-body-sm font-medium text-on-surface text-right font-mono text-xs">{invoice.stripeChargeId}</dd>
  </div>
) : null}
{invoice.stripeInvoiceId ? (
  <div className="flex justify-between gap-4 py-2 border-b border-outline-variant/20">
    <dt className="text-body-sm text-on-surface-variant">{t("invoiceDetail.stripeInvoiceRef")}</dt>
    <dd className="text-body-sm font-medium text-on-surface text-right font-mono text-xs">{invoice.stripeInvoiceId}</dd>
  </div>
) : null}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 3: Create owner earnings statement query

**Files:**
- Create: `lib/invoices/earningsStatement.ts`

**Context:**
This is a pure data function. It queries payments for an owner's bookings, joining with Invoice (for invoiceNumber, paidAt), Booking (for bookingNumber, listing title, renter name), and GeneratedContract (for contractNumber). It also fetches withdrawal history from WithdrawalRequest. The owner can only see their own data; admin is handled separately.

- [ ] **Step 1: Create lib/invoices/earningsStatement.ts**

```typescript
// lib/invoices/earningsStatement.ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EarningsRow = {
  paymentId: string;
  paidAt: string | null;
  bookingNumber: string;
  listingTitle: string;
  listingCity: string;
  renterName: string;
  renterEmail: string;
  grossAmount: string;
  platformCommission: string;
  ownerNet: string;
  currency: string;
  invoiceNumber: string | null;
  contractNumber: string | null;
  stripeChargeId: string | null;
};

export type WithdrawalRow = {
  id: string;
  amount: string;
  status: string;
  iban: string;
  bankName: string | null;
  accountHolder: string | null;
  paymentReference: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type EarningsStatement = {
  totalGross: string;
  totalCommission: string;
  totalNet: string;
  totalPaidOut: string;
  rows: EarningsRow[];
  withdrawals: WithdrawalRow[];
};

export async function getOwnerEarningsStatement(
  ownerProfileId: string,
): Promise<EarningsStatement> {
  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      booking: { ownerId: ownerProfileId },
    },
    orderBy: { paidAt: "desc" },
    select: {
      id: true,
      amount: true,
      platformCommission: true,
      ownerAmount: true,
      currency: true,
      paidAt: true,
      stripeChargeId: true,
      booking: {
        select: {
          bookingNumber: true,
          listing: { select: { title: true, city: true } },
          renter: {
            select: { user: { select: { fullName: true, email: true } } },
          },
          generatedContract: { select: { contractNumber: true } },
          invoices: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { invoiceNumber: true },
          },
        },
      },
    },
  });

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { ownerId: ownerProfileId },
    orderBy: { requestedAt: "desc" },
  });

  let totalGross = new Prisma.Decimal(0);
  let totalCommission = new Prisma.Decimal(0);
  let totalNet = new Prisma.Decimal(0);

  const rows: EarningsRow[] = payments.map((p) => {
    totalGross = totalGross.add(p.amount);
    totalCommission = totalCommission.add(p.platformCommission);
    totalNet = totalNet.add(p.ownerAmount);

    return {
      paymentId: p.id,
      paidAt: p.paidAt?.toISOString() ?? null,
      bookingNumber: p.booking.bookingNumber,
      listingTitle: p.booking.listing.title,
      listingCity: p.booking.listing.city,
      renterName: p.booking.renter.user.fullName,
      renterEmail: p.booking.renter.user.email,
      grossAmount: p.amount.toFixed(2),
      platformCommission: p.platformCommission.toFixed(2),
      ownerNet: p.ownerAmount.toFixed(2),
      currency: p.currency,
      invoiceNumber: p.booking.invoices[0]?.invoiceNumber ?? null,
      contractNumber: p.booking.generatedContract?.contractNumber ?? null,
      stripeChargeId: p.stripeChargeId ?? null,
    };
  });

  const totalPaidOut = withdrawals
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum.add(w.amount), new Prisma.Decimal(0));

  return {
    totalGross: totalGross.toFixed(2),
    totalCommission: totalCommission.toFixed(2),
    totalNet: totalNet.toFixed(2),
    totalPaidOut: totalPaidOut.toFixed(2),
    rows,
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount.toFixed(2),
      status: w.status,
      iban: w.iban,
      bankName: w.bankName,
      accountHolder: w.accountHolder,
      paymentReference: w.paymentReference,
      adminNote: w.adminNote,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt?.toISOString() ?? null,
    })),
  };
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 4: Create GET /api/owner/earnings route

**Files:**
- Create: `app/api/owner/earnings/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/owner/earnings/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnerEarningsStatement } from "@/lib/invoices/earningsStatement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const statement = await getOwnerEarningsStatement(currentUser.ownerProfile.id);
  return NextResponse.json(statement);
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 5: Create EarningsStatementWorkspace component

**Files:**
- Create: `components/owner/EarningsStatementWorkspace.tsx`

**Context:**
Self-fetching client component. Uses the same card/table/badge patterns already in `components/owner/` and `components/admin/`. Matches existing design system (rounded-[24px] cards, rounded-full badges, surface colors, secondary orange accent). Shows 4 summary cards, then an earnings table, then a withdrawal history table. Existing `formatCurrency` pattern: `new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(value))`.

- [ ] **Step 1: Create the component**

```typescript
// components/owner/EarningsStatementWorkspace.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EarningsStatement } from "@/lib/invoices/earningsStatement";

function formatMoney(value: string, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const WITHDRAWAL_STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-secondary-container/30 text-on-secondary-container",
  PAID: "bg-[#4b6547]/10 text-[#4b6547]",
  REJECTED: "bg-error-container/30 text-on-error-container",
  CANCELLED: "bg-surface-container text-on-surface-variant",
};

export default function EarningsStatementWorkspace() {
  const { t } = useTranslation();
  const [data, setData] = useState<EarningsStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/earnings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: EarningsStatement) => setData(d))
      .catch(() => setError(t("errors.generic")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[20px] border border-error/30 bg-error/5 px-5 py-4 text-body-sm text-error">
        {error ?? t("errors.generic")}
      </div>
    );
  }

  const summaryCards = [
    { label: t("earnings.totalGross"), value: formatMoney(data.totalGross) },
    { label: t("earnings.totalCommission"), value: formatMoney(data.totalCommission) },
    { label: t("earnings.totalNet"), value: formatMoney(data.totalNet) },
    { label: t("earnings.totalPaidOut"), value: formatMoney(data.totalPaidOut) },
  ];

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[20px] border border-outline-variant/60 bg-surface p-5 shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{card.label}</p>
            <p className="mt-2 text-h3 font-h3 text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Earnings table */}
      <section className="space-y-3">
        <h2 className="text-h3 font-h3 text-primary">{t("earnings.earningsHistory")}</h2>
        {data.rows.length === 0 ? (
          <div className="rounded-[20px] border border-outline-variant/60 bg-surface px-5 py-8 text-center text-body-sm text-on-surface-variant">
            {t("earnings.noEarnings")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      t("earnings.date"),
                      t("earnings.property"),
                      t("earnings.renter"),
                      t("earnings.gross"),
                      t("earnings.commission"),
                      t("earnings.net"),
                      t("earnings.refs"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant border-b border-outline-variant/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.rows.map((row) => (
                    <tr key={row.paymentId} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">{formatDate(row.paidAt)}</td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm font-medium text-on-surface">{row.listingTitle}</p>
                        <p className="text-[11px] text-on-surface-variant">{row.listingCity} · {row.bookingNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface">{row.renterName}</p>
                        <p className="text-[11px] text-on-surface-variant">{row.renterEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-on-surface whitespace-nowrap">{formatMoney(row.grossAmount, row.currency)}</td>
                      <td className="px-5 py-4 text-body-sm text-error whitespace-nowrap">−{formatMoney(row.platformCommission, row.currency)}</td>
                      <td className="px-5 py-4 text-body-sm font-bold text-[#4b6547] whitespace-nowrap">{formatMoney(row.ownerNet, row.currency)}</td>
                      <td className="px-5 py-4 space-y-1">
                        {row.invoiceNumber && (
                          <p className="text-[11px] text-on-surface-variant">INV: {row.invoiceNumber}</p>
                        )}
                        {row.contractNumber && (
                          <p className="text-[11px] text-on-surface-variant">CTR: {row.contractNumber}</p>
                        )}
                        {row.stripeChargeId && (
                          <p className="text-[11px] text-on-surface-variant font-mono truncate max-w-[140px]">{row.stripeChargeId}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Withdrawal history */}
      <section className="space-y-3">
        <h2 className="text-h3 font-h3 text-primary">{t("earnings.withdrawalHistory")}</h2>
        {data.withdrawals.length === 0 ? (
          <div className="rounded-[20px] border border-outline-variant/60 bg-surface px-5 py-8 text-center text-body-sm text-on-surface-variant">
            {t("earnings.noWithdrawals")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      t("earnings.requestedDate"),
                      t("earnings.amount"),
                      t("earnings.bankDetails"),
                      t("earnings.status"),
                      t("earnings.processedDate"),
                      t("earnings.paymentRef"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant border-b border-outline-variant/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">{formatDate(w.requestedAt)}</td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-on-surface whitespace-nowrap">{formatMoney(w.amount)}</td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface font-mono text-xs">{w.iban}</p>
                        {w.bankName && <p className="text-[11px] text-on-surface-variant">{w.bankName}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${WITHDRAWAL_STATUS_STYLES[w.status] ?? "bg-surface-container text-on-surface"}`}>
                          {w.status.replace(/_/g, " ")}
                        </span>
                        {w.adminNote && (
                          <p className="text-[11px] text-on-surface-variant mt-1">{w.adminNote}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-on-surface whitespace-nowrap">{formatDate(w.processedAt)}</td>
                      <td className="px-5 py-4 text-body-sm text-on-surface-variant font-mono text-xs">{w.paymentReference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 6: Create /owner/earnings page

**Files:**
- Create: `app/owner/earnings/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// app/owner/earnings/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";
import EarningsStatementWorkspace from "@/components/owner/EarningsStatementWorkspace";

export const dynamic = "force-dynamic";

export default async function OwnerEarningsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/owner/earnings");
  }

  if (currentUser.role !== "OWNER") {
    redirect(getDashboardPath(currentUser.role));
  }

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 space-y-8">
        <header className="space-y-2">
          <p className="text-label-caps font-label-caps uppercase tracking-[0.22em] text-secondary">
            {t("earnings.pageLabel")}
          </p>
          <h1 className="text-h1 font-h1 text-primary">{t("earnings.pageTitle")}</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            {t("earnings.pageSubtitle")}
          </p>
        </header>
        <EarningsStatementWorkspace />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

---

## Task 7: Add Earnings link to owner navigation

**Files:**
- Modify: `components/layout/navigation.ts`

**Context:**
The OWNER nav `visible` array currently has: dashboard, createListing, contracts, wallet, profile. We replace `wallet` with `earnings` in visible (wallet is still reachable from earnings page / dashboard header button), or add earnings as an additional link. Given space, add it to `other` dropdown so we don't exceed 5 visible items.

- [ ] **Step 1: Read current OWNER navigation to find the other array**

Check the current OWNER nav in `components/layout/navigation.ts`.

- [ ] **Step 2: Add TrendingUp icon import and earnings nav item**

Add `TrendingUp` to the lucide-react import at the top.

Add to OWNER `other` array:
```typescript
{ href: "/owner/earnings", labelKey: "nav.earnings", icon: TrendingUp },
```

- [ ] **Step 3: Add nav.earnings key to both locale files**

In `locales/en/common.json` under `"nav"`, add:
```json
"earnings": "Earnings"
```

In `locales/fr/common.json` under `"nav"`, add:
```json
"earnings": "Revenus"
```

- [ ] **Step 4: TypeScript + JSON check**

```bash
npx tsc --noEmit && node -e "require('./locales/en/common.json');require('./locales/fr/common.json');console.log('JSON ok')"
```

Expected: no errors, `JSON ok`.

---

## Task 8: Add earnings i18n keys to EN + FR

**Files:**
- Modify: `locales/en/common.json`
- Modify: `locales/fr/common.json`

- [ ] **Step 1: Add earnings section to EN locale**

Add as a top-level sibling key (e.g. after the `"phoneVerification"` block):

```json
"earnings": {
  "pageLabel": "Earnings Statement",
  "pageTitle": "My Earnings",
  "pageSubtitle": "View your earnings history, platform commission, and withdrawal records.",
  "totalGross": "Total Gross",
  "totalCommission": "Platform Commission (20%)",
  "totalNet": "Total Net Earnings",
  "totalPaidOut": "Total Paid Out",
  "earningsHistory": "Earnings History",
  "noEarnings": "No earnings recorded yet.",
  "date": "Date",
  "property": "Property",
  "renter": "Renter",
  "gross": "Gross",
  "commission": "Commission",
  "net": "Net (80%)",
  "refs": "References",
  "withdrawalHistory": "Withdrawal History",
  "noWithdrawals": "No withdrawal requests yet.",
  "requestedDate": "Requested",
  "amount": "Amount",
  "bankDetails": "Bank Details",
  "status": "Status",
  "processedDate": "Processed",
  "paymentRef": "Payment Ref"
}
```

Also add to `invoiceDetail` section in EN (add after existing invoiceDetail keys):
```json
"contractRef": "Contract Reference",
"paymentRef": "Payment Reference",
"stripeInvoiceRef": "Stripe Invoice ID"
```

- [ ] **Step 2: Add earnings section to FR locale**

```json
"earnings": {
  "pageLabel": "Relevé de revenus",
  "pageTitle": "Mes revenus",
  "pageSubtitle": "Consultez l'historique de vos revenus, la commission de la plateforme et vos retraits.",
  "totalGross": "Total brut",
  "totalCommission": "Commission plateforme (20%)",
  "totalNet": "Revenus nets totaux",
  "totalPaidOut": "Total versé",
  "earningsHistory": "Historique des revenus",
  "noEarnings": "Aucun revenu enregistré.",
  "date": "Date",
  "property": "Propriété",
  "renter": "Locataire",
  "gross": "Brut",
  "commission": "Commission",
  "net": "Net (80%)",
  "refs": "Références",
  "withdrawalHistory": "Historique des retraits",
  "noWithdrawals": "Aucune demande de retrait.",
  "requestedDate": "Demandé le",
  "amount": "Montant",
  "bankDetails": "Coordonnées bancaires",
  "status": "Statut",
  "processedDate": "Traité le",
  "paymentRef": "Référence paiement"
}
```

Also add to `invoiceDetail` section in FR:
```json
"contractRef": "Référence contrat",
"paymentRef": "Référence paiement",
"stripeInvoiceRef": "ID facture Stripe"
```

- [ ] **Step 3: Validate JSON**

```bash
node -e "require('./locales/en/common.json');require('./locales/fr/common.json');console.log('JSON valid')"
```

Expected: `JSON valid`

---

## Task 9: Final validation + documentation

**Files:**
- Create: `FINAL_MVP_PHASE_6_INVOICES_EARNINGS.md`

- [ ] **Step 1: Run full validation suite**

```bash
npx prisma validate
npx tsc --noEmit
npx next build 2>&1 | tail -20
node -e "require('./locales/en/common.json');require('./locales/fr/common.json');console.log('JSON valid')"
```

All must pass. Fix any errors before proceeding.

- [ ] **Step 2: Create documentation**

```markdown
# Phase 6 — Tenant Invoice + Owner Earnings Statement

## What was added

### Tenant Invoice
- `contractNumber` now appears in invoice detail when a BoldSign contract exists for the booking
- `stripeChargeId` and `stripeInvoiceId` shown in invoice detail when set by Stripe webhook
- These fields are part of SafeInvoice and returned by all invoice API routes

### Owner Earnings Statement
- New page: `/owner/earnings`
- New API: `GET /api/owner/earnings` (owner auth required)
- Shows per-payment breakdown: date, property, renter, gross, 20% commission, 80% net
- Shows withdrawal history below the earnings table
- Summary cards: total gross, total commission, total net, total paid out

## Routes
- `GET /api/owner/earnings` — owner only
- `app/owner/earnings/page.tsx` — owner only, redirects others to their dashboard

## Auth / Access
- Owner sees only their own earnings and withdrawals
- Admin can access all invoices via existing `/invoices` and `/admin` routes
- No admin-specific earnings route added (admin can see per-invoice breakdown via InvoiceDetail)

## Files Changed
- `lib/invoices/generateInvoice.ts` — SafeInvoice type + query enriched
- `components/invoices/InvoiceDetailPage.tsx` — contract ref + payment refs displayed
- `lib/invoices/earningsStatement.ts` — NEW: earnings query
- `app/api/owner/earnings/route.ts` — NEW: GET route
- `components/owner/EarningsStatementWorkspace.tsx` — NEW: UI component
- `app/owner/earnings/page.tsx` — NEW: page
- `components/layout/navigation.ts` — earnings link in owner nav
- `locales/en/common.json` — earnings + invoiceDetail keys
- `locales/fr/common.json` — same in French

## No schema changes
All required data was already in Payment, Invoice, GeneratedContract, WithdrawalRequest models.

## Manual Test Steps
1. Complete a booking + payment (use Stripe test mode)
2. Login as renter → /invoices → open invoice detail
   - Confirm: property title, booking ref, rental amount, platform fee, total paid, payment date
   - If contract signed: confirm contract number appears
   - If payment has stripeChargeId: confirm payment reference appears
3. Login as owner → /owner/earnings
   - Confirm earnings table shows each paid booking
   - Confirm each row shows: date, property, renter, gross, −commission, net
   - Confirm summary cards total correctly
   - Confirm withdrawal history table shows all requests with status
4. Create a withdrawal → status REQUESTED appears in withdrawal table
5. Login as admin → /admin/withdrawals → mark paid
   - Back as owner → /owner/earnings → status updates to PAID, paymentRef if set
```
