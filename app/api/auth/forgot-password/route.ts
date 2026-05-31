import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  createPasswordResetToken,
  deleteActivePasswordResetTokens,
  deletePasswordResetTokenById,
} from "@/lib/password-reset-tokens";
import { forgotPasswordRequestSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = forgotPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const token = crypto.randomUUID();
  const expiresInMinutes = 30;

  await deleteActivePasswordResetTokens(user.id);

  const resetToken = await createPasswordResetToken({
    id: token,
    userId: user.id,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "Unable to create a reset link right now." },
      { status: 500 },
    );
  }

  const resetUrl = new URL("/forget_password_page", getAppUrl(request));
  resetUrl.searchParams.set("token", token);

  const emailResult = await sendPasswordResetEmail({
    recipientEmail: user.email,
    recipientName: user.fullName,
    resetUrl: resetUrl.toString(),
    expiresInMinutes,
  });

  if (!emailResult.sent) {
    await deletePasswordResetTokenById(token);

    return NextResponse.json(
      { error: "Unable to send a reset email right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
