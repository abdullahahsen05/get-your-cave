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

  const challengeResult = await createPhoneChallenge({
    userId: currentUser.id,
    phone,
  });

  if ("error" in challengeResult) {
    return NextResponse.json({ error: challengeResult.error }, { status: 429 });
  }

  const smsResult = await sendOtp(phone);
  if (!smsResult.sent) {
    return NextResponse.json(
      { error: smsResult.error ?? "Failed to send verification code." },
      { status: 502 },
    );
  }

  return NextResponse.json({ sent: true, phone });
}
