import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  comparePassword,
  getLoginChallengeCookieName,
  getLoginChallengeCookieOptions,
  hashPassword,
  shouldRequireLoginTwoFactor,
  safeUserSelect,
  createSessionToken,
  getAuthCookieName,
  getAuthCookieOptions,
} from "@/lib/auth";
import { sendLoginVerificationCodeEmail } from "@/lib/email";
import {
  createLoginChallenge,
  deleteActiveLoginChallenges,
  deleteLoginChallengeById,
} from "@/lib/login-challenges";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return email;
  }

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, localPart.length - visible.length))}@${domain}`;
}

function buildVerificationCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid login details.",
      },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...safeUserSelect,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const code = buildVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresInMinutes = 10;

  if (!shouldRequireLoginTwoFactor(user)) {
    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        requiresTwoFactor: false,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          ownerProfile: user.ownerProfile,
          renterProfile: user.renterProfile,
        },
      },
      { status: 200 },
    );

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());
    return response;
  }

  await deleteActiveLoginChallenges(user.id);

  const challenge = await createLoginChallenge({
    id: crypto.randomUUID(),
    userId: user.id,
    codeHash,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  });

  if (!challenge?.id) {
    return NextResponse.json(
      { error: "Unable to create verification challenge right now." },
      { status: 500 },
    );
  }

  const emailResult = await sendLoginVerificationCodeEmail({
    recipientEmail: user.email,
    recipientName: user.fullName,
    code,
    expiresInMinutes,
  });

  if (!emailResult.sent) {
    await deleteLoginChallengeById(challenge.id);

    return NextResponse.json(
      { error: "Unable to send verification code right now." },
      { status: 500 },
    );
  }

  const response = NextResponse.json(
    {
      requiresTwoFactor: true,
      maskedEmail: maskEmail(user.email),
      challengeExpiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
    },
    { status: 200 },
  );

  response.cookies.set({
    name: getLoginChallengeCookieName(),
    value: challenge.id,
    ...getLoginChallengeCookieOptions(),
  });

  return response;
}
