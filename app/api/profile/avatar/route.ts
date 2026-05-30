import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStoredAvatarFileName,
  getAvatarPublicUrl,
  isSupportedAvatarExtension,
  isSupportedAvatarMimeType,
  removeAvatarFile,
  sanitizeUploadFileName,
  saveAvatarFile,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
  }

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "Please choose a profile photo." }, { status: 400 });
  }

  if (fileValue.size <= 0) {
    return NextResponse.json({ error: "Please choose a valid file." }, { status: 400 });
  }

  if (fileValue.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Profile photos must be 8MB or smaller." }, { status: 413 });
  }

  const sanitizedOriginalName = sanitizeUploadFileName(fileValue.name || "avatar");

  if (
    !isSupportedAvatarMimeType(fileValue.type) ||
    !isSupportedAvatarExtension(sanitizedOriginalName)
  ) {
    return NextResponse.json(
      { error: "Only JPG, JPEG, PNG, WEBP, and GIF files are allowed." },
      { status: 415 },
    );
  }

  const storedFileName = buildStoredAvatarFileName(
    sanitizedOriginalName,
    fileValue.type,
  );

  if (!storedFileName) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }

  const fileUrl = getAvatarPublicUrl(storedFileName);

  try {
    await saveAvatarFile(fileValue, storedFileName);
  } catch {
    return NextResponse.json({ error: "Unable to store the uploaded file." }, { status: 500 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { avatarUrl: fileUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    await removeAvatarFile(fileUrl);
    return NextResponse.json({ error: "Unable to save avatar." }, { status: 500 });
  }
}
