import { AccountStatus, DocumentType, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStoredVerificationDocumentFileName,
  getVerificationDocumentPublicUrl,
  isSupportedVerificationExtension,
  isSupportedVerificationMimeType,
  sanitizeUploadFileName,
  removeVerificationDocumentFile,
  saveVerificationDocumentFile,
} from "@/lib/uploads";
import { verificationDocumentSelect } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uploadTypeSchema = z.nativeEnum(DocumentType);
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to upload verification documents." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    return NextResponse.json(
      { error: "Only owners and renters can upload verification documents." },
      { status: 403 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart payload." },
      { status: 400 },
    );
  }

  const typeValue = formData.get("type");
  const fileValue = formData.get("file");

  const parsedType = uploadTypeSchema.safeParse(
    typeof typeValue === "string" ? typeValue : null,
  );

  if (!parsedType.success) {
    return NextResponse.json(
      { error: "Please choose a valid document type." },
      { status: 400 },
    );
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { error: "Please choose a file to upload." },
      { status: 400 },
    );
  }

  if (fileValue.size <= 0) {
    return NextResponse.json(
      { error: "Please choose a valid file." },
      { status: 400 },
    );
  }

  if (fileValue.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: "Files must be 10MB or smaller." },
      { status: 413 },
    );
  }

  const sanitizedOriginalName = sanitizeUploadFileName(fileValue.name || "document");

  if (
    !isSupportedVerificationMimeType(fileValue.type) ||
    !isSupportedVerificationExtension(sanitizedOriginalName)
  ) {
    return NextResponse.json(
      { error: "Only PDF, JPG, JPEG, and PNG files are allowed." },
      { status: 415 },
    );
  }

  const storedFileName = buildStoredVerificationDocumentFileName(
    sanitizedOriginalName,
    fileValue.type,
  );

  if (!storedFileName) {
    return NextResponse.json(
      { error: "Unsupported file type." },
      { status: 415 },
    );
  }

  const fileUrl = getVerificationDocumentPublicUrl(storedFileName);

  try {
    await saveVerificationDocumentFile(fileValue, storedFileName);
  } catch {
    return NextResponse.json(
      { error: "Unable to store the uploaded file." },
      { status: 500 },
    );
  }

  try {
    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.verificationDocument.create({
        data: {
          userId: currentUser.id,
          type: parsedType.data,
          fileUrl,
          fileName: sanitizedOriginalName,
          mimeType: fileValue.type || null,
          sizeBytes: fileValue.size,
          status: VerificationStatus.PENDING,
        },
        select: verificationDocumentSelect,
      });

      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          status: AccountStatus.PENDING_VERIFICATION,
        },
      });

      return created;
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch {
    await removeVerificationDocumentFile(fileUrl);
    return NextResponse.json(
      { error: "Unable to save the uploaded document." },
      { status: 500 },
    );
  }
}
