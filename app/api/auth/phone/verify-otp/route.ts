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

  await markPhoneVerified({ userId: currentUser.id, phone });

  await createNotificationForUser({
    userId: currentUser.id,
    title: "Phone number verified",
    body: `Your phone number ${phone} has been verified successfully.`,
    linkUrl: "/profile",
  });

  return NextResponse.json({ verified: true, phone });
}
