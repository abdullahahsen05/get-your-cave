import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { rejectWithdrawal } from "@/lib/withdrawals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  let adminNote: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.adminNote === "string" && body.adminNote.trim()) {
      adminNote = body.adminNote.trim().slice(0, 500);
    }
  } catch {
    // adminNote is optional
  }

  const result = await rejectWithdrawal(id, access.user.id, adminNote);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
