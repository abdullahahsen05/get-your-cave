import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  comparePassword,
  createSessionToken,
  getAuthCookieName,
  getAuthCookieOptions,
  getLoginChallengeCookieName,
  getLoginChallengeCookieOptions,
  safeUserSelect,
} from "@/lib/auth";
import {
  consumeLoginChallenge,
  deleteLoginChallengeById,
  findLoginChallengeById,
  incrementLoginChallengeAttempts,
} from "@/lib/login-challenges";
import { prisma } from "@/lib/prisma";
import { loginVerificationSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clearLoginChallengeCookie(response: NextResponse) {
  response.cookies.set({
    name: getLoginChallengeCookieName(),
    value: "",
    ...getLoginChallengeCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = loginVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid verification code.",
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const challengeId = cookieStore.get(getLoginChallengeCookieName())?.value;
  if (!challengeId) {
    return NextResponse.json(
      { error: "Your verification code has expired. Please sign in again.", expired: true },
      { status: 400 },
    );
  }

  const challenge = await findLoginChallengeById(challengeId);

  if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
    if (challengeId) {
      await deleteLoginChallengeById(challengeId);
    }

    const response = NextResponse.json(
      { error: "Your verification code has expired. Please sign in again.", expired: true },
      { status: 400 },
    );
    clearLoginChallengeCookie(response);
    return response;
  }

  const codeMatches = await comparePassword(parsed.data.code, challenge.codeHash);
  if (!codeMatches) {
    const nextAttemptCount = challenge.attemptCount + 1;
    const exceededAttempts = nextAttemptCount >= challenge.maxAttempts;

    if (exceededAttempts) {
      await deleteLoginChallengeById(challenge.id);

      const response = NextResponse.json(
        {
          error: "Too many incorrect attempts. Please sign in again.",
          expired: true,
        },
        { status: 400 },
      );
      clearLoginChallengeCookie(response);
      return response;
    }

    await incrementLoginChallengeAttempts(challenge.id, nextAttemptCount);

    return NextResponse.json(
      {
        error: "Incorrect verification code.",
        attemptsRemaining: Math.max(0, challenge.maxAttempts - nextAttemptCount),
      },
      { status: 400 },
    );
  }

  await consumeLoginChallenge(challenge.id);

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: safeUserSelect,
  });

  if (!user) {
    await deleteLoginChallengeById(challenge.id);
    const response = NextResponse.json(
      { error: "Unable to complete sign in right now." },
      { status: 500 },
    );
    clearLoginChallengeCookie(response);
    return response;
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
  });

  const response = NextResponse.json(
    {
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
  clearLoginChallengeCookie(response);

  return response;
}
