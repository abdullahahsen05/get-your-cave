import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth";
import { SMS_DEV_MODE } from "@/lib/sms";

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_ACTIVE_CHALLENGES = 3;

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
 * Dev mode: hashes SMS_DEV_OTP and stores it.
 * Production: stores null codeHash (Twilio Verify owns the OTP).
 * Rate-limits to MAX_ACTIVE_CHALLENGES per user.
 */
export async function createPhoneChallenge(params: {
  userId: string;
  phone: string;
}): Promise<{ record: PhoneVerificationRecord; error?: undefined } | { error: string }> {
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
    const otp = generateOtp();
    codeHash = await hashPassword(otp);
    console.log("[phone-verification:dev] OTP for", params.phone, "→", otp);
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
 * Validate a dev-mode OTP against the stored hash.
 * Increments attemptCount on every call.
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

  await prisma.phoneVerification.update({
    where: { id: params.challengeId },
    data: { consumedAt: new Date() },
  });

  return { valid: true };
}

/**
 * Consume a challenge record (production Twilio path).
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
