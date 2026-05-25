import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteVerificationDocumentForUser,
  getVerificationDocumentForUser,
} from "@/lib/verification";
import {
  getVerificationDocumentPathFromPublicUrl,
  removeVerificationDocumentFile,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";

function buildDownloadFileName(fileName: string | null | undefined) {
  if (!fileName) {
    return "verification-document";
  }

  return fileName.replace(/"/g, "'");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view verification documents." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const document = await getVerificationDocumentForUser(id, currentUser.id);
  const isAdmin = currentUser.role === "ADMIN";

  if (!document && !isAdmin) {
    return NextResponse.json(
      { error: "Document not found." },
      { status: 404 },
    );
  }

  const visibleDocument = document ?? (isAdmin
    ? await prisma.verificationDocument.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        type: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        rejectionReason: true,
        reviewedById: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    : null);

  if (!visibleDocument) {
    return NextResponse.json(
      { error: "Document not found." },
      { status: 404 },
    );
  }

  const filePath = getVerificationDocumentPathFromPublicUrl(visibleDocument.fileUrl);
  if (!filePath) {
    return NextResponse.json(
      { error: "Document file is unavailable." },
      { status: 404 },
    );
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = buildDownloadFileName(visibleDocument.fileName ?? path.basename(filePath));

    return new NextResponse(fileBuffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": visibleDocument.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json(
        { error: "Document file is unavailable." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Unable to load document file." },
      { status: 500 },
    );
  }
}

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
