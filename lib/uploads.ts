import fs from "fs/promises";
import path from "path";

import { randomUUID } from "crypto";

const VERIFICATION_UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "verification-documents",
);

const MESSAGE_UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "messages",
);

const AVATAR_UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "avatars",
);

const VERIFICATION_UPLOAD_PUBLIC_PREFIX = "/uploads/verification-documents";
const MESSAGE_UPLOAD_PUBLIC_PREFIX = "/uploads/messages";
const AVATAR_UPLOAD_PUBLIC_PREFIX = "/uploads/avatars";

const supportedMimeTypes = new Map<string, string>([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);

const supportedMessageMimeTypes = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const supportedExtensions = new Map<string, string>([
  [".pdf", "application/pdf"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);

const supportedMessageExtensions = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
]);

export function getVerificationDocumentUploadRoot() {
  return VERIFICATION_UPLOAD_ROOT;
}

export function getMessageAttachmentUploadRoot() {
  return MESSAGE_UPLOAD_ROOT;
}

export function getAvatarUploadRoot() {
  return AVATAR_UPLOAD_ROOT;
}

export function getVerificationDocumentPublicPrefix() {
  return VERIFICATION_UPLOAD_PUBLIC_PREFIX;
}

export function getMessageAttachmentPublicPrefix() {
  return MESSAGE_UPLOAD_PUBLIC_PREFIX;
}

export function getAvatarPublicPrefix() {
  return AVATAR_UPLOAD_PUBLIC_PREFIX;
}

export async function ensureVerificationDocumentUploadRoot() {
  await fs.mkdir(VERIFICATION_UPLOAD_ROOT, { recursive: true });
}

export async function ensureMessageAttachmentUploadRoot() {
  await fs.mkdir(MESSAGE_UPLOAD_ROOT, { recursive: true });
}

export async function ensureAvatarUploadRoot() {
  await fs.mkdir(AVATAR_UPLOAD_ROOT, { recursive: true });
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

export function isSupportedMessageMimeType(mimeType: string) {
  return supportedMessageMimeTypes.has(mimeType.toLowerCase());
}

export function isSupportedMessageExtension(fileName: string) {
  const ext = path.extname(path.basename(fileName)).toLowerCase();
  return supportedMessageExtensions.has(ext);
}

export function getMessageAttachmentFileExtension(
  fileName: string,
  mimeType: string,
) {
  const ext = path.extname(path.basename(fileName)).toLowerCase();
  if (ext && supportedMessageExtensions.has(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }

  return supportedMessageMimeTypes.get(mimeType.toLowerCase()) ?? null;
}

export function buildStoredMessageAttachmentFileName(
  originalFileName: string,
  mimeType: string,
) {
  const ext = getMessageAttachmentFileExtension(originalFileName, mimeType);
  if (!ext) {
    return null;
  }

  return `message-${Date.now()}-${randomUUID()}${ext}`;
}

export function isSupportedAvatarMimeType(mimeType: string) {
  return supportedMessageMimeTypes.has(mimeType.toLowerCase());
}

export function isSupportedAvatarExtension(fileName: string) {
  const ext = path.extname(path.basename(fileName)).toLowerCase();
  return supportedMessageExtensions.has(ext);
}

export function buildStoredAvatarFileName(originalFileName: string, mimeType: string) {
  const ext = getMessageAttachmentFileExtension(originalFileName, mimeType);
  if (!ext) {
    return null;
  }

  return `avatar-${Date.now()}-${randomUUID()}${ext}`;
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

export async function saveMessageAttachmentFile(file: File, storedFileName: string) {
  await ensureMessageAttachmentUploadRoot();

  const filePath = path.join(MESSAGE_UPLOAD_ROOT, storedFileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, bytes);

  return filePath;
}

export function getMessageAttachmentPublicUrl(storedFileName: string) {
  return `${MESSAGE_UPLOAD_PUBLIC_PREFIX}/${storedFileName}`;
}

export async function saveAvatarFile(file: File, storedFileName: string) {
  await ensureAvatarUploadRoot();

  const filePath = path.join(AVATAR_UPLOAD_ROOT, storedFileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, bytes);

  return filePath;
}

export function getAvatarPublicUrl(storedFileName: string) {
  return `${AVATAR_UPLOAD_PUBLIC_PREFIX}/${storedFileName}`;
}

export function getAvatarPathFromPublicUrl(fileUrl: string) {
  if (!fileUrl.startsWith(`${AVATAR_UPLOAD_PUBLIC_PREFIX}/`)) {
    return null;
  }

  const storedFileName = path.basename(fileUrl);
  return path.join(AVATAR_UPLOAD_ROOT, storedFileName);
}

export async function removeAvatarFile(fileUrl: string) {
  const filePath = getAvatarPathFromPublicUrl(fileUrl);
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

export function getMessageAttachmentPathFromPublicUrl(fileUrl: string) {
  if (!fileUrl.startsWith(`${MESSAGE_UPLOAD_PUBLIC_PREFIX}/`)) {
    return null;
  }

  const storedFileName = path.basename(fileUrl);
  return path.join(MESSAGE_UPLOAD_ROOT, storedFileName);
}

export async function removeMessageAttachmentFile(fileUrl: string) {
  const filePath = getMessageAttachmentPathFromPublicUrl(fileUrl);
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
