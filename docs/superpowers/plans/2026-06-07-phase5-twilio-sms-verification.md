# Phase 5: Twilio SMS Phone Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add phone number verification via SMS OTP to user profiles, with a dev/test mode that skips real SMS sending and a production path through Twilio Verify.

**Architecture:** A `PhoneVerification` Prisma model stores OTP challenges (hashed in dev, audit-only in production). Two API routes handle send/verify. A self-contained `PhoneVerificationSection` component drops into the existing `ProfileSettingsWorkspace`. Twilio Verify is called only when `SMS_DEV_MODE` is not `"true"`.

**Tech Stack:** Twilio Verify API (`twilio` npm package), Prisma, Next.js App Router route handlers, bcryptjs (already installed), Zod, React useState.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/sms.ts` | Twilio/dev-mode send OTP |
| Create | `lib/phone-verification.ts` | Create/find/validate/consume PhoneVerification records |
| Create | `app/api/auth/phone/send-otp/route.ts` | POST — normalize phone, rate-limit, send OTP |
| Create | `app/api/auth/phone/verify-otp/route.ts` | POST — verify code, mark user.phoneVerified |
| Create | `components/profile/PhoneVerificationSection.tsx` | Self-contained UI section |
| Modify | `prisma/schema.prisma` | Add `phoneVerified`, `phoneVerifiedAt` to User; add `PhoneVerification` model |
| Modify | `lib/auth.ts` | Add `phoneVerified`, `phoneVerifiedAt` to `SafeUser` type and `safeUserSelect` |
| Modify | `components/profile/ProfileSettingsWorkspace.tsx` | Mount `PhoneVerificationSection` |
| Modify | `components/admin/AdminUsersWorkspace.tsx` | Show `phoneVerified` badge next to phone (lines 570, 614) |
| Modify | `locales/en/common.json` | Add `phoneVerification.*` keys |
| Modify | `locales/fr/common.json` | Add `phoneVerification.*` keys (French) |
| Modify | `.env` | Add Twilio + dev-mode env vars |
| Create | `FINAL_MVP_PHASE_5_TWILIO_SMS_VERIFICATION.md` | Phase docs |

---

## Task 1: Install Twilio and add env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env`

- [ ] **Step 1: Install Twilio**

```bash
npm install twilio
```

Expected: `twilio` appears in `package.json` dependencies.

- [ ] **Step 2: Add env vars to `.env`**

Append to `.env` (do NOT print existing secret values):

```env
# Twilio SMS Verification (Phase 5)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

# Dev mode — set true to skip real SMS (uses SMS_DEV_OTP instead)
SMS_DEV_MODE=true
SMS_DEV_OTP=123456
```

- [ ] **Step 3: Verify install**

```bash
node -e "require('twilio'); console.log('twilio ok')"
```

Expected output: `twilio ok`

---

## Task 2: Schema — add phoneVerified fields and PhoneVerification model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to User model**

In `prisma/schema.prisma`, in the `User` model after `emailVerifiedAt DateTime?`:

```prisma
  phoneVerified   Boolean   @default(false)
  phoneVerifiedAt DateTime?
```

Also add the relation field at the bottom of the User model relations block:

```prisma
  phoneVerifications PhoneVerification[]
```

- [ ] **Step 2: Add PhoneVerification model**

At the end of `prisma/schema.prisma`, before the final enums block:

```prisma
/**
 * =========================
 * PHONE VERIFICATION
 * =========================
 */

model PhoneVerification {
  id           String    @id @default(uuid())
  userId       String
  phone        String
  codeHash     String?
  expiresAt    DateTime
  attemptCount Int       @default(0)
  maxAttempts  Int       @default(5)
  consumedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([phone])
  @@index([expiresAt])
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add_phone_verification
```

Expected: Migration file created and applied. No errors.

- [ ] **Step 4: Validate and generate**

```bash
npx prisma validate && npx prisma generate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

---

## Task 3: Update SafeUser type and safeUserSelect

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 1: Add phoneVerified fields to SafeUser type**

In `lib/auth.ts`, in the `SafeUser` type definition, add after `twoFactorEnabled: boolean;`:

```typescript
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
```

- [ ] **Step 2: Add fields to safeUserSelect**

In `lib/auth.ts`, in `safeUserSelect`, add after `twoFactorEnabled: true,`:

```typescript
  phoneVerified: true,
  phoneVerifiedAt: true,
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing unrelated errors).

---

## Task 4: Create lib/sms.ts — send OTP via Twilio or dev mode

**Files:**
- Create: `lib/sms.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/sms.ts
export const SMS_DEV_MODE = process.env.SMS_DEV_MODE === "true";
export const SMS_DEV_OTP = process.env.SMS_DEV_OTP?.trim() || "123456";

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN?.trim() ?? "",
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID?.trim() ?? "",
  };
}

function isTwilioConfigured() {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();
  return Boolean(accountSid && authToken && verifyServiceSid);
}

/**
 * Send an OTP to the given phone number.
 * In dev mode: does nothing (caller stores SMS_DEV_OTP).
 * In production: sends via Twilio Verify.
 */
export async function sendOtp(phone: string): Promise<{ sent: boolean; error?: string }> {
  if (SMS_DEV_MODE) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[sms:dev] SMS_DEV_MODE=true — skipping real SMS for", phone);
    }
    return { sent: true };
  }

  if (!isTwilioConfigured()) {
    console.error("[sms] Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID.");
    return { sent: false, error: "SMS service is not configured." };
  }

  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: phone,
      channel: "sms",
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    console.error("[sms] Twilio sendOtp error:", message);
    return { sent: false, error: "Failed to send verification code. Please try again." };
  }
}

/**
 * Verify an OTP code via Twilio Verify.
 * Only called in production mode. In dev mode the caller handles verification locally.
 */
export async function verifyOtpWithTwilio(
  phone: string,
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  if (!isTwilioConfigured()) {
    return { valid: false, error: "SMS service is not configured." };
  }

  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    const check = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
      to: phone,
      code,
    });
    return { valid: check.status === "approved" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    console.error("[sms] Twilio verifyOtp error:", message);
    return { valid: false, error: "Verification failed. Please try again." };
  }
}

/**
 * Normalize a phone number to E.164 format (basic).
 * Strips spaces/dashes/parentheses. Adds + if missing.
 * Full validation is done server-side via Zod.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, "");
  if (!digits.startsWith("+")) {
    return `+${digits}`;
  }
  return digits;
}
```

---

## Task 5: Create lib/phone-verification.ts — OTP storage and validation

**Files:**
- Create: `lib/phone-verification.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/phone-verification.ts
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth";
import { SMS_DEV_MODE, SMS_DEV_OTP } from "@/lib/sms";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_ACTIVE_CHALLENGES = 3; // rate limit: max 3 pending per user

export type PhoneVerificationRecord = {
  id: string;
  userId: string;
  phone: string;
  codeHash: string | null;
  expiresAt: Date;
  attemptCount: number;
  maxAttempts: number;
  consumedAt: Date | null;
};

/**
 * Create a new phone verification challenge.
 * In dev mode: hashes SMS_DEV_OTP and stores it.
 * In production: stores null codeHash (Twilio Verify owns the OTP).
 * Rate-limits: max MAX_ACTIVE_CHALLENGES per user per phone.
 */
export async function createPhoneChallenge(params: {
  userId: string;
  phone: string;
}): Promise<{ record: PhoneVerificationRecord; error?: undefined } | { error: string }> {
  // Count active (unconsumed, unexpired) challenges for this user
  const activeCount = await prisma.phoneVerification.count({
    where: {
      userId: params.userId,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (activeCount >= MAX_ACTIVE_CHALLENGES) {
    return { error: "Too many verification attempts. Please wait before requesting a new code." };
  }

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  let codeHash: string | null = null;
  if (SMS_DEV_MODE) {
    codeHash = await hashPassword(SMS_DEV_OTP);
    if (process.env.NODE_ENV !== "production") {
      console.log("[phone-verification:dev] dev OTP for", params.phone, "is", SMS_DEV_OTP);
    }
  }

  const record = await prisma.phoneVerification.create({
    data: {
      userId: params.userId,
      phone: params.phone,
      codeHash,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
    },
  });

  return { record };
}

/**
 * Find the most recent active challenge for a user+phone pair.
 */
export async function findActiveChallenge(params: {
  userId: string;
  phone: string;
}): Promise<PhoneVerificationRecord | null> {
  const record = await prisma.phoneVerification.findFirst({
    where: {
      userId: params.userId,
      phone: params.phone,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return record ?? null;
}

/**
 * Validate a dev-mode OTP code against the stored hash.
 * Increments attemptCount on each call (whether success or failure).
 * Returns the outcome and whether the record was consumed.
 */
export async function validateDevChallenge(params: {
  challengeId: string;
  code: string;
}): Promise<{ valid: boolean; error?: string }> {
  const record = await prisma.phoneVerification.findUnique({
    where: { id: params.challengeId },
  });

  if (!record) {
    return { valid: false, error: "Verification code not found." };
  }

  if (record.consumedAt) {
    return { valid: false, error: "This code has already been used." };
  }

  if (record.expiresAt <= new Date()) {
    return { valid: false, error: "Verification code has expired." };
  }

  const newCount = record.attemptCount + 1;

  if (newCount > record.maxAttempts) {
    return { valid: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (!record.codeHash) {
    return { valid: false, error: "Invalid verification record." };
  }

  const matches = await comparePassword(params.code, record.codeHash);

  // Always persist the incremented attempt count
  await prisma.phoneVerification.update({
    where: { id: params.challengeId },
    data: { attemptCount: newCount },
  });

  if (!matches) {
    if (newCount >= record.maxAttempts) {
      return { valid: false, error: "Too many incorrect attempts. Please request a new code." };
    }
    return { valid: false, error: "Incorrect code. Please try again." };
  }

  // Consume the challenge
  await prisma.phoneVerification.update({
    where: { id: params.challengeId },
    data: { consumedAt: new Date() },
  });

  return { valid: true };
}

/**
 * Consume a challenge record (for production Twilio path).
 */
export async function consumeChallenge(challengeId: string): Promise<void> {
  await prisma.phoneVerification.update({
    where: { id: challengeId },
    data: { consumedAt: new Date() },
  });
}

/**
 * Mark a user's phone as verified.
 */
export async function markPhoneVerified(params: {
  userId: string;
  phone: string;
}): Promise<void> {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      phone: params.phone,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });
}
```

---

## Task 6: API route — POST /api/auth/phone/send-otp

**Files:**
- Create: `app/api/auth/phone/send-otp/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/auth/phone/send-otp/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { normalizePhone, sendOtp } from "@/lib/sms";
import { createPhoneChallenge } from "@/lib/phone-verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long.")
    .regex(/^\+?[0-9\s\-().]+$/, "Invalid phone number format."),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid phone number." },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);

  // Create challenge record (rate-limited)
  const challengeResult = await createPhoneChallenge({
    userId: currentUser.id,
    phone,
  });

  if ("error" in challengeResult) {
    return NextResponse.json({ error: challengeResult.error }, { status: 429 });
  }

  // Send OTP (dev: no-op, production: Twilio)
  const smsResult = await sendOtp(phone);
  if (!smsResult.sent) {
    return NextResponse.json(
      { error: smsResult.error ?? "Failed to send verification code." },
      { status: 502 },
    );
  }

  return NextResponse.json({ sent: true, phone });
}
```

---

## Task 7: API route — POST /api/auth/phone/verify-otp

**Files:**
- Create: `app/api/auth/phone/verify-otp/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/auth/phone/verify-otp/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { normalizePhone, SMS_DEV_MODE, verifyOtpWithTwilio } from "@/lib/sms";
import {
  findActiveChallenge,
  validateDevChallenge,
  consumeChallenge,
  markPhoneVerified,
} from "@/lib/phone-verification";
import { createNotificationForUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s\-().]+$/),
  code: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Code must be 4–8 digits."),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { code } = parsed.data;

  // Find the active challenge
  const challenge = await findActiveChallenge({ userId: currentUser.id, phone });
  if (!challenge) {
    return NextResponse.json(
      { error: "No active verification found for this number. Please request a new code." },
      { status: 404 },
    );
  }

  let valid = false;
  let verifyError: string | undefined;

  if (SMS_DEV_MODE) {
    const result = await validateDevChallenge({ challengeId: challenge.id, code });
    valid = result.valid;
    verifyError = result.error;
  } else {
    const result = await verifyOtpWithTwilio(phone, code);
    valid = result.valid;
    verifyError = result.error;

    if (valid) {
      await consumeChallenge(challenge.id);
    }
  }

  if (!valid) {
    return NextResponse.json({ error: verifyError ?? "Invalid code." }, { status: 400 });
  }

  // Mark phone as verified
  await markPhoneVerified({ userId: currentUser.id, phone });

  // In-app notification
  await createNotificationForUser({
    userId: currentUser.id,
    title: "Phone number verified",
    body: `Your phone number ${phone} has been verified successfully.`,
    linkUrl: "/profile",
  });

  return NextResponse.json({ verified: true, phone });
}
```

---

## Task 8: UI — PhoneVerificationSection component

**Files:**
- Create: `components/profile/PhoneVerificationSection.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/profile/PhoneVerificationSection.tsx
"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  currentPhone: string | null;
  phoneVerified: boolean;
  onVerified: (phone: string) => void;
};

type Step = "idle" | "sent" | "verified";

export default function PhoneVerificationSection({
  currentPhone,
  phoneVerified,
  onVerified,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(phoneVerified ? "verified" : "idle");
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentPhone, setSentPhone] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError(t("phoneVerification.errorPhoneRequired"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { sent?: boolean; phone?: string; error?: string };
      if (!res.ok || !data.sent) {
        setError(data.error ?? t("phoneVerification.errorSendFailed"));
        return;
      }
      setSentPhone(data.phone ?? phone);
      setStep("sent");
    } catch {
      setError(t("phoneVerification.errorSendFailed"));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      setError(t("phoneVerification.errorCodeRequired"));
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone: sentPhone ?? phone, code }),
      });
      const data = (await res.json()) as { verified?: boolean; phone?: string; error?: string };
      if (!res.ok || !data.verified) {
        setError(data.error ?? t("phoneVerification.errorVerifyFailed"));
        return;
      }
      setStep("verified");
      onVerified(data.phone ?? phone);
    } catch {
      setError(t("phoneVerification.errorVerifyFailed"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 space-y-4 shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-h3 text-h3 text-primary">{t("phoneVerification.title")}</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {t("phoneVerification.subtitle")}
          </p>
        </div>
        {step === "verified" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4b6547]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4b6547]">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            {t("phoneVerification.verified")}
          </span>
        )}
      </div>

      {step === "verified" ? (
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#4b6547]">smartphone</span>
          <p className="text-body-sm text-on-surface font-medium">{currentPhone ?? phone}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {step === "idle" && (
            <div className="space-y-2">
              <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase">
                {t("phoneVerification.phoneLabel")}
              </label>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                  placeholder={t("phoneVerification.phonePlaceholder")}
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null); }}
                />
                <button
                  className="rounded-full bg-secondary px-5 py-3 text-sm font-bold text-on-secondary hover:bg-[#d9590f] transition-colors disabled:opacity-50 whitespace-nowrap"
                  disabled={sending}
                  type="button"
                  onClick={() => void handleSendOtp()}
                >
                  {sending ? t("common.loading") : t("phoneVerification.sendCode")}
                </button>
              </div>
            </div>
          )}

          {step === "sent" && (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                {t("phoneVerification.codeSentTo", { phone: sentPhone ?? phone })}
              </p>
              <div className="space-y-2">
                <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {t("phoneVerification.codeLabel")}
                </label>
                <div className="flex gap-3">
                  <input
                    autoComplete="one-time-code"
                    className="w-40 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface tracking-[0.3em] placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="000000"
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }}
                  />
                  <button
                    className="rounded-full bg-[#4b6547] px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={verifying}
                    type="button"
                    onClick={() => void handleVerify()}
                  >
                    {verifying ? t("common.loading") : t("phoneVerification.verify")}
                  </button>
                  <button
                    className="rounded-full border border-outline-variant/60 px-4 py-3 text-sm font-medium text-primary hover:bg-surface-container-low transition-colors"
                    type="button"
                    onClick={() => { setStep("idle"); setCode(""); setError(null); }}
                  >
                    {t("phoneVerification.changeNumber")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-error font-medium">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Task 9: Mount PhoneVerificationSection in ProfileSettingsWorkspace

**Files:**
- Modify: `components/profile/ProfileSettingsWorkspace.tsx`

- [ ] **Step 1: Import the component**

At the top of `ProfileSettingsWorkspace.tsx`, add after the existing imports:

```typescript
import PhoneVerificationSection from "@/components/profile/PhoneVerificationSection";
```

- [ ] **Step 2: Add phoneVerified state**

After the existing `useState` declarations (e.g. after `twoFactorEnabled`), add:

```typescript
  const [isPhoneVerified, setIsPhoneVerified] = useState(user.phoneVerified);
  const [verifiedPhone, setVerifiedPhone] = useState(user.phone ?? "");
```

- [ ] **Step 3: Mount the section in the JSX**

Find the profile form JSX. Add `PhoneVerificationSection` in a logical spot — after the existing phone number input field but before notifications settings. The exact location will be after the phone input `<div>` block, as a sibling section:

```typescript
<PhoneVerificationSection
  currentPhone={verifiedPhone || user.phone}
  phoneVerified={isPhoneVerified}
  onVerified={(phone) => {
    setVerifiedPhone(phone);
    setIsPhoneVerified(true);
  }}
/>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

---

## Task 10: Add i18n keys — EN and FR

**Files:**
- Modify: `locales/en/common.json`
- Modify: `locales/fr/common.json`

- [ ] **Step 1: Add EN keys**

In `locales/en/common.json`, find the `"profile"` object and add a `"phoneVerification"` sibling object (at the same level as `"profile"`):

```json
"phoneVerification": {
  "title": "Phone Verification",
  "subtitle": "Verify your phone number for account security.",
  "phoneLabel": "Phone number",
  "phonePlaceholder": "+33 6 12 34 56 78",
  "sendCode": "Send Code",
  "codeLabel": "Verification code",
  "codeSentTo": "A 6-digit code was sent to {{phone}}.",
  "verify": "Verify",
  "changeNumber": "Change number",
  "verified": "Verified",
  "verifiedSuccess": "Phone number verified successfully.",
  "errorPhoneRequired": "Please enter a phone number.",
  "errorCodeRequired": "Please enter the verification code.",
  "errorSendFailed": "Failed to send verification code. Please try again.",
  "errorVerifyFailed": "Verification failed. Please check the code and try again."
}
```

- [ ] **Step 2: Add FR keys**

In `locales/fr/common.json`, add the same sibling object:

```json
"phoneVerification": {
  "title": "Vérification du téléphone",
  "subtitle": "Vérifiez votre numéro de téléphone pour la sécurité du compte.",
  "phoneLabel": "Numéro de téléphone",
  "phonePlaceholder": "+33 6 12 34 56 78",
  "sendCode": "Envoyer le code",
  "codeLabel": "Code de vérification",
  "codeSentTo": "Un code à 6 chiffres a été envoyé au {{phone}}.",
  "verify": "Vérifier",
  "changeNumber": "Changer de numéro",
  "verified": "Vérifié",
  "verifiedSuccess": "Numéro de téléphone vérifié avec succès.",
  "errorPhoneRequired": "Veuillez entrer un numéro de téléphone.",
  "errorCodeRequired": "Veuillez entrer le code de vérification.",
  "errorSendFailed": "Échec de l'envoi du code. Veuillez réessayer.",
  "errorVerifyFailed": "Vérification échouée. Vérifiez le code et réessayez."
}
```

- [ ] **Step 3: Validate JSON**

```bash
node -e "require('./locales/en/common.json'); require('./locales/fr/common.json'); console.log('JSON valid')"
```

Expected: `JSON valid`

---

## Task 11: Admin — add phoneVerified status badge

**Files:**
- Modify: `components/admin/AdminUsersWorkspace.tsx`

- [ ] **Step 1: Add phoneVerified to the user type in AdminUsersWorkspace**

Find the type definition for the user row (around line 14 where `phone: string | null` is defined) and add:

```typescript
  phoneVerified: boolean;
```

- [ ] **Step 2: Add badge next to phone in detail panel (lines ~570 and ~614)**

Find the two `<StatRow label={t("profile.phone")} ...` lines and replace each with:

```typescript
<div className="flex items-center gap-2">
  <StatRow label={t("profile.phone")} value={detailUser?.phone ?? selectedUser?.phone ?? "—"} />
  {(detailUser?.phoneVerified ?? selectedUser?.phoneVerified) ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#4b6547]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#4b6547]">
      <span className="material-symbols-outlined text-[12px]">verified</span>
      {t("phoneVerification.verified")}
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
      {t("common.unverified")}
    </span>
  )}
</div>
```

- [ ] **Step 3: Add `common.unverified` i18n key if missing**

Check `locales/en/common.json` for `"unverified"` under `"common"`. If missing, add:
- EN: `"unverified": "Unverified"`
- FR: `"unverified": "Non vérifié"`

- [ ] **Step 4: Make sure the admin API returns phoneVerified**

Check `lib/admin.ts` `getAdminUsers` function — confirm it selects `phoneVerified` from the User. If not, add `phoneVerified: true` to the select.

---

## Task 12: Final validation

- [ ] **Step 1: Prisma validate**

```bash
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 2: TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
npx next build 2>&1 | tail -20
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Manual test — dev mode**

```
1. Ensure SMS_DEV_MODE=true and SMS_DEV_OTP=123456 in .env
2. Restart dev server (npm run dev)
3. Login as any user
4. Navigate to /profile
5. Find "Phone Verification" section
6. Enter phone: +33612345678
7. Click "Send Code"
   Expected: "Code sent" — no real SMS
   Check server log: "[phone-verification:dev] dev OTP for +33612345678 is 123456"
8. Enter code: 999999
   Click Verify
   Expected: error "Incorrect code"
9. Enter code: 123456
   Click Verify
   Expected: success, badge shows "Verified"
10. Check DB:
    SELECT "phoneVerified", "phoneVerifiedAt", "phone" FROM "User" WHERE id = '<user_id>';
    Expected: phoneVerified=true, phoneVerifiedAt set, phone='+33612345678'
11. Try entering code 123456 again
    Expected: error "This code has already been used"
12. Try entering an expired/old challenge
    Expected: "No active verification found"
```

- [ ] **Step 5: Commit**

```bash
git add -p  # stage all Phase 5 files
git commit -m "feat: Phase 5 — Twilio SMS phone verification with dev mode"
```

---

## Task 13: Create phase documentation

**Files:**
- Create: `FINAL_MVP_PHASE_5_TWILIO_SMS_VERIFICATION.md`

- [ ] **Step 1: Create the doc**

```markdown
# Phase 5 — Twilio SMS Phone Verification

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Prod only | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Prod only | Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID` | Prod only | Twilio Verify Service SID |
| `SMS_DEV_MODE` | Yes | `"true"` = skip SMS, use SMS_DEV_OTP |
| `SMS_DEV_OTP` | Dev only | OTP to accept in dev mode (default: 123456) |

## Dev Mode Setup
Set `SMS_DEV_MODE=true` and `SMS_DEV_OTP=123456`.
No Twilio credentials needed. OTP is logged server-side only.
Never commit real Twilio credentials.

## Production Twilio Setup
1. Create a Twilio account at twilio.com
2. Create a Verify Service in the Twilio console
3. Set `SMS_DEV_MODE=false`
4. Set the three Twilio env vars

## API Routes
- `POST /api/auth/phone/send-otp` — body: `{ phone: string }` — auth required
- `POST /api/auth/phone/verify-otp` — body: `{ phone: string, code: string }` — auth required

## Rate Limiting
- Max 3 active challenges per user at a time
- Max 5 verify attempts per challenge
- OTP expires after 10 minutes

## Abuse Notes
- Codes are bcrypt-hashed before storage in dev mode
- Twilio Verify handles security in production
- Re-use of consumed codes is rejected
- Challenge attempts are tracked and blocked after maxAttempts
```
