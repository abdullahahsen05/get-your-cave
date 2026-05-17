import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { rejectVerificationDocumentForAdmin, requireAdminAccess } from "@/lib/admin";
import { adminVerificationModerationSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const adminUser = access.user;
  const { id } = await context.params;
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = adminVerificationModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification rejection payload." },
      { status: 400 },
    );
  }

  const rejectionReason = parsed.data.rejectionReason ?? parsed.data.reason;
  const result = await rejectVerificationDocumentForAdmin(
    id,
    adminUser.id,
    rejectionReason,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
