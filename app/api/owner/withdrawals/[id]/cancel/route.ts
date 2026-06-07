import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { cancelWithdrawalRequest } from "@/lib/withdrawals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: currentUser ? 403 : 401 },
    );
  }

  const result = await cancelWithdrawalRequest({
    withdrawalId: id,
    ownerProfileId: currentUser.ownerProfile.id,
    ownerUserId: currentUser.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
