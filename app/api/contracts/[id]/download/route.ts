import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { getCurrentUser } from "@/lib/auth";
import {
  getContractDownloadFilePathForViewer,
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
  request: Request,
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

  const fileDetails = await getContractDownloadFilePathForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!fileDetails) {
    return NextResponse.json(
      { error: "Contract not found or access denied." },
      { status: 404 },
    );
  }

  try {
    await access(fileDetails.path);
  } catch {
    return NextResponse.json(
      { error: "Generated contract file is missing." },
      { status: 404 },
    );
  }

  const stream = createReadStream(fileDetails.path);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": buildContentDispositionFileName(fileDetails.fileName),
      "Cache-Control": "no-store",
    },
  });
}
