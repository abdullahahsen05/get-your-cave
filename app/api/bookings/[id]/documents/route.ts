import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  createTemporaryDocumentForBooking,
  listTempDocsForBooking,
} from "@/lib/temporary-documents";
import {
  buildStoredBookingDocumentFileName,
  getBookingDocumentPublicUrl,
  isSupportedVerificationExtension,
  isSupportedVerificationMimeType,
  removeBookingDocumentFile,
  sanitizeUploadFileName,
  saveBookingDocumentFile,
} from "@/lib/uploads";
import { TemporaryDocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const docTypeSchema = z.nativeEnum(TemporaryDocumentType);

// GET: list temp documents for a booking (owner: own, admin: any)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const result = await listTempDocsForBooking(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
  });

  if (!result) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}

// POST: upload a document for a booking (owner only, booking must be DOCUMENTS_REQUIRED)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only owners can upload booking documents." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
  }

  const typeValue = formData.get("type");
  const fileValue = formData.get("file");

  const parsedType = docTypeSchema.safeParse(
    typeof typeValue === "string" ? typeValue : null,
  );

  if (!parsedType.success) {
    return NextResponse.json(
      { error: "Please choose a valid document type (IDENTITY or OWNERSHIP_PROOF)." },
      { status: 400 },
    );
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
  }

  if (fileValue.size <= 0) {
    return NextResponse.json({ error: "The file appears to be empty." }, { status: 400 });
  }

  if (fileValue.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 413 });
  }

  const sanitizedName = sanitizeUploadFileName(fileValue.name || "document");

  if (
    !isSupportedVerificationMimeType(fileValue.type) ||
    !isSupportedVerificationExtension(sanitizedName)
  ) {
    return NextResponse.json(
      { error: "Only PDF, JPG, JPEG, and PNG files are allowed." },
      { status: 415 },
    );
  }

  const storedFileName = buildStoredBookingDocumentFileName(sanitizedName, fileValue.type);
  if (!storedFileName) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }

  const fileUrl = getBookingDocumentPublicUrl(storedFileName);

  try {
    await saveBookingDocumentFile(fileValue, storedFileName);
  } catch {
    return NextResponse.json(
      { error: "Unable to store the uploaded file." },
      { status: 500 },
    );
  }

  const result = await createTemporaryDocumentForBooking({
    bookingId: id,
    ownerProfileId: currentUser.ownerProfile.id,
    type: parsedType.data,
    fileUrl,
  });

  if ("error" in result) {
    await removeBookingDocumentFile(fileUrl).catch(() => undefined);
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ document: result.document }, { status: 201 });
}
