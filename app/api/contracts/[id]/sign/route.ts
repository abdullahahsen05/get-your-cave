import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { signGeneratedContractForViewer } from "@/lib/contracts/generateContract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to sign contracts." },
      { status: 401 },
    );
  }

  let body: unknown = null;
  try {
    body = await request.json().catch(() => null);
  } catch {
    body = null;
  }

  const signatureText =
    typeof body === "object" && body !== null && "signatureText" in body
      ? String((body as { signatureText?: unknown }).signatureText ?? "").trim()
      : "";

  const result = await signGeneratedContractForViewer({
    contractId: id,
    viewer: {
      role: currentUser.role,
      ownerProfileId: currentUser.ownerProfile?.id ?? null,
      renterProfileId: currentUser.renterProfile?.id ?? null,
      userId: currentUser.id,
      fullName: signatureText || currentUser.fullName,
    },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
