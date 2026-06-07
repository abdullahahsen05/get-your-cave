import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  createWithdrawalRequest,
  listWithdrawalsForOwner,
} from "@/lib/withdrawals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero.")
    .finite(),
  iban: z.string().trim().min(5, "Please provide a valid IBAN.").max(34),
  bankName: z.string().trim().max(100).optional().nullable(),
  accountHolder: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: currentUser ? 403 : 401 },
    );
  }

  const withdrawals = await listWithdrawalsForOwner(currentUser.ownerProfile.id);
  return NextResponse.json({ withdrawals });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: currentUser ? 403 : 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid withdrawal request." },
      { status: 400 },
    );
  }

  const result = await createWithdrawalRequest({
    ownerProfileId: currentUser.ownerProfile.id,
    ownerUserId: currentUser.id,
    amount: new Prisma.Decimal(parsed.data.amount),
    iban: parsed.data.iban,
    bankName: parsed.data.bankName ?? null,
    accountHolder: parsed.data.accountHolder ?? null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ withdrawal: result.withdrawal }, { status: 201 });
}
