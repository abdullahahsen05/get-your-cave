import { NextResponse } from "next/server";
import path from "node:path";

import { getCurrentUser } from "@/lib/auth";
import {
  getContractForViewer,
  renderContractDocumentForBooking,
} from "@/lib/contracts/generateContract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildContentDispositionFileName(fileName: string) {
  const safeName = path.basename(fileName).trim() || "contract.docx";
  const normalized = safeName.toLowerCase().endsWith(".docx")
    ? safeName
    : `${safeName}.docx`;
  const encoded = encodeURIComponent(normalized);

  return `attachment; filename="${normalized}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to download contracts." },
      { status: 401 },
    );
  }

  const contract = await getContractForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found or access denied." },
      { status: 404 },
    );
  }

  const localized = await renderContractDocumentForBooking({
    bookingId: contract.bookingId,
    contractTypeOverride: contract.contractType,
    contractNumberOverride: contract.contractNumber,
  });

  if (!localized) {
    return NextResponse.json(
      { error: "Unable to generate contract export." },
      { status: 500 },
    );
  }

  return new NextResponse(new Uint8Array(localized.buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": buildContentDispositionFileName(contract.generatedFileName),
      "Cache-Control": "no-store",
    },
  });
}
