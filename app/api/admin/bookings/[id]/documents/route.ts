import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const { id: bookingId } = await params;

  const docs = await prisma.temporaryDocument.findMany({
    where: { bookingId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      type: d.type,
      fileUrl: d.fileUrl,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
