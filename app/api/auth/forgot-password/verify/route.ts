import { NextResponse } from "next/server";

import {
  deletePasswordResetTokenById,
  findPasswordResetTokenById,
} from "@/lib/password-reset-tokens";
import { forgotPasswordTokenSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = forgotPasswordTokenSchema.safeParse({
    token: searchParams.get("token"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reset link.", valid: false },
      { status: 400 },
    );
  }

  const token = await findPasswordResetTokenById(parsed.data.token);

  if (!token || token.usedAt || token.expiresAt <= new Date()) {
    if (token) {
      await deletePasswordResetTokenById(token.id);
    }

    return NextResponse.json(
      { error: "This reset link has expired or is no longer valid.", valid: false },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      valid: true,
      expiresAt: token.expiresAt.toISOString(),
    },
    { status: 200 },
  );
}
