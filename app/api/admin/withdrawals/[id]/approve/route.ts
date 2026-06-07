import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { markWithdrawalProcessing, markWithdrawalPaid } from "@/lib/withdrawals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["PROCESSING", "PAID"]),
  paymentReference: z.string().trim().max(200).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "action must be PROCESSING or PAID." },
      { status: 400 },
    );
  }

  const adminId = access.user.id;

  if (parsed.data.action === "PROCESSING") {
    const result = await markWithdrawalProcessing(id, adminId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  const result = await markWithdrawalPaid(
    id,
    adminId,
    parsed.data.paymentReference ?? undefined,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
