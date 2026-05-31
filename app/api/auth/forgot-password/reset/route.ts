import { NextResponse } from "next/server";

import { comparePassword, hashPassword } from "@/lib/auth";
import { deleteActiveLoginChallenges } from "@/lib/login-challenges";
import { prisma } from "@/lib/prisma";
import {
  consumePasswordResetToken,
  deletePasswordResetTokenById,
  findPasswordResetTokenById,
} from "@/lib/password-reset-tokens";
import { forgotPasswordResetSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = forgotPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reset details." },
      { status: 400 },
    );
  }

  const token = await findPasswordResetTokenById(parsed.data.token);
  if (!token || token.usedAt || token.expiresAt <= new Date()) {
    if (token) {
      await deletePasswordResetTokenById(token.id);
    }

    return NextResponse.json(
      { error: "This reset link has expired or is no longer valid." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    await deletePasswordResetTokenById(token.id);

    return NextResponse.json(
      { error: "Unable to reset this password right now." },
      { status: 500 },
    );
  }

  const passwordMatchesExisting = user.passwordHash
    ? await comparePassword(parsed.data.password, user.passwordHash)
    : false;

  if (passwordMatchesExisting) {
    return NextResponse.json(
      { error: "Please choose a new password." },
      { status: 400 },
    );
  }

  const nextPasswordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: nextPasswordHash,
    },
  });

  await consumePasswordResetToken(token.id);
  await deleteActiveLoginChallenges(user.id);

  return NextResponse.json(
    {
      ok: true,
    },
    { status: 200 },
  );
}
