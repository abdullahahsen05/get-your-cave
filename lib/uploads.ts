import fs from "fs/promises";
import path from "path";

import { randomUUID } from "crypto";

const VERIFICATION_UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "verification-documents",
);

const VERIFICATION_UPLOAD_PUBLIC_PREFIX = "/uploads/verification-documents";

const supportedMimeTypes = new Map<string, string>([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);

const supportedExtensions = new Map<string, string>([
  [".pdf", "application/pdf"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);

export function getVerificationDocumentUploadRoot() {
  return VERIFICATION_UPLOAD_ROOT;
}

export function getVerificationDocumentPublicPrefix() {
  return VERIFICATION_UPLOAD_PUBLIC_PREFIX;
}

export async function ensureVerificationDocumentUploadRoot() {
  await fs.mkdir(VERIFICATION_UPLOAD_ROOT, { recursive: true });
}

export function sanitizeUploadFileName(fileName: string) {
  const normalized = path.basename(fileName).trim();
  const safeName = normalized.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return safeName.replace(/_+/g, "_") || "document";
}

export function getVerifiedFileExtension(fileName: string, mimeType: string) {
  const ext = path.extname(path.basename(fileName)).toLowerCase();
  if (ext && supportedExtensions.has(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }

  return supportedMimeTypes.get(mimeType.toLowerCase()) ?? null;
}

export function isSupportedVerificationMimeType(mimeType: string) {
  return supportedMimeTypes.has(mimeType.toLowerCase());
}

export function isSupportedVerificationExtension(fileName: string) {
  const ext = path.extname(path.basename(fileName)).toLowerCase();
  return ext === ".pdf" || ext === ".jpg" || ext === ".jpeg" || ext === ".png";
}

export function buildStoredVerificationDocumentFileName(
  originalFileName: string,
  mimeType: string,
) {
  const ext = getVerifiedFileExtension(originalFileName, mimeType);
  if (!ext) {
    return null;
  }

  return `verification-${Date.now()}-${randomUUID()}${ext}`;
}

export async function saveVerificationDocumentFile(file: File, storedFileName: string) {
  await ensureVerificationDocumentUploadRoot();

  const filePath = path.join(VERIFICATION_UPLOAD_ROOT, storedFileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, bytes);

  return filePath;
}

export function getVerificationDocumentPublicUrl(storedFileName: string) {
  return `${VERIFICATION_UPLOAD_PUBLIC_PREFIX}/${storedFileName}`;
}

export function getVerificationDocumentPathFromPublicUrl(fileUrl: string) {
  if (!fileUrl.startsWith(`${VERIFICATION_UPLOAD_PUBLIC_PREFIX}/`)) {
    return null;
  }

  const storedFileName = path.basename(fileUrl);
  return path.join(VERIFICATION_UPLOAD_ROOT, storedFileName);
}

export async function removeVerificationDocumentFile(fileUrl: string) {
  const filePath = getVerificationDocumentPathFromPublicUrl(fileUrl);
  if (!filePath) {
    return false;
  }

  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }

    return false;
  }
}

