import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  deleteVerificationDocumentForUser,
  getVerificationDocumentForUser,
} from "@/lib/verification";
import { removeVerificationDocumentFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to delete verification documents." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existingDocument = await getVerificationDocumentForUser(id, currentUser.id);

  if (!existingDocument) {
    return NextResponse.json(
      { error: "Document not found." },
      { status: 404 },
    );
  }

  const result = await deleteVerificationDocumentForUser(id, currentUser.id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 },
    );
  }

  await removeVerificationDocumentFile(existingDocument.fileUrl);

  return NextResponse.json({ success: true });
}

