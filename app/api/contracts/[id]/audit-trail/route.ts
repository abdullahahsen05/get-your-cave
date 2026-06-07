import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { getCurrentUser } from "@/lib/auth";
import { getContractForViewer } from "@/lib/contracts/generateContract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const contract = await getContractForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found or access denied." }, { status: 404 });
  }

  if (contract.status !== "SIGNED") {
    return NextResponse.json(
      { error: "Audit trail is only available once the contract is fully signed." },
      { status: 403 },
    );
  }

  if (!contract.auditTrailPath) {
    return NextResponse.json(
      { error: "Audit trail is not available yet." },
      { status: 404 },
    );
  }

  const docsRoot = path.resolve(process.cwd(), "docs");
  const resolved = path.resolve(contract.auditTrailPath);
  const relative = path.relative(docsRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(resolved);
  } catch {
    return NextResponse.json({ error: "Audit trail file not found." }, { status: 404 });
  }

  const fileName = `audit-trail-${contract.contractNumber}.pdf`;
  const encoded = encodeURIComponent(fileName);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    },
  });
}
