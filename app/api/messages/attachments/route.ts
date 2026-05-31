import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  buildStoredMessageAttachmentFileName,
  getMessageAttachmentPublicUrl,
  isSupportedMessageExtension,
  isSupportedMessageMimeType,
  sanitizeUploadFileName,
  saveMessageAttachmentFile,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const acceptedAttachmentTypes = z.enum([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  const requestOrigin = new URL(request.url).origin;

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to upload message attachments." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    return NextResponse.json(
      { error: "Only owners and renters can upload message attachments." },
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

  const fileValue = formData.get("file");

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

  const sanitizedOriginalName = sanitizeUploadFileName(fileValue.name || "message");
  const parsedMime = acceptedAttachmentTypes.safeParse(fileValue.type);

  if (
    !parsedMime.success ||
    !isSupportedMessageMimeType(fileValue.type) ||
    !isSupportedMessageExtension(sanitizedOriginalName)
  ) {
    return NextResponse.json(
      { error: "Only PDF, JPG, JPEG, PNG, WEBP, and GIF files are allowed." },
      { status: 415 },
    );
  }

  const storedFileName = buildStoredMessageAttachmentFileName(
    sanitizedOriginalName,
    fileValue.type,
  );

  if (!storedFileName) {
    return NextResponse.json(
      { error: "Unsupported file type." },
      { status: 415 },
    );
  }

  const fileUrl = new URL(
    getMessageAttachmentPublicUrl(storedFileName),
    requestOrigin,
  ).toString();

  try {
    await saveMessageAttachmentFile(fileValue, storedFileName);
  } catch {
    return NextResponse.json(
      { error: "Unable to store the uploaded file." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      fileUrl,
      fileName: sanitizedOriginalName,
      mimeType: parsedMime.data,
      sizeBytes: fileValue.size,
    },
    { status: 201 },
  );
}
