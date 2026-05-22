import {
  AccountStatus,
  DocumentType,
  VerificationStatus,
  type Prisma,
  type UserRole,
} from "@prisma/client";

import type { SafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getVerificationDocumentTypeLabel,
  type VerificationDocumentType,
  type VerificationStatusValue,
} from "@/lib/verification-types";

export const verificationDocumentSelect = {
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
} satisfies Prisma.VerificationDocumentSelect;

export type VerificationDocumentRecord = Prisma.VerificationDocumentGetPayload<{
  select: typeof verificationDocumentSelect;
}>;

export type VerificationDocumentView = {
  id: string;
  type: VerificationDocumentType;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  status: VerificationStatusValue;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VerificationSummary = {
  role: UserRole;
  accountStatus: VerificationStatusValue;
  requiredDocumentTypes: VerificationDocumentType[];
  missingDocumentTypes: VerificationDocumentType[];
  canSubmit: boolean;
};

export function requiredDocumentTypesForRole(role: UserRole) {
  if (role === "OWNER") {
    return [DocumentType.ID_CARD, DocumentType.PROOF_OF_OWNERSHIP];
  }

  if (role === "RENTER") {
    return [DocumentType.ID_CARD];
  }

  return [DocumentType.ID_CARD];
}

export function verificationAccountStatusForUser(user: SafeUser) {
  if (user.role === "OWNER") {
    return user.ownerProfile?.verificationStatus ?? VerificationStatus.NOT_SUBMITTED;
  }

  if (user.role === "RENTER") {
    return user.renterProfile?.verificationStatus ?? VerificationStatus.NOT_SUBMITTED;
  }

  return (
    user.ownerProfile?.verificationStatus ??
    user.renterProfile?.verificationStatus ??
    VerificationStatus.NOT_SUBMITTED
  );
}

export function serializeVerificationDocument(
  document: VerificationDocumentRecord,
): VerificationDocumentView {
  return {
    id: document.id,
    type: document.type,
    fileUrl: document.fileUrl,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    rejectionReason: document.rejectionReason,
    reviewedById: document.reviewedById,
    reviewedAt: document.reviewedAt ? document.reviewedAt.toISOString() : null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function loadVerificationDocumentsForUser(userId: string) {
  const documents = await prisma.verificationDocument.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    select: verificationDocumentSelect,
  });

  return documents.map(serializeVerificationDocument);
}

export async function listUserVerificationState(user: SafeUser) {
  const documents = await loadVerificationDocumentsForUser(user.id);
  const accountStatus = verificationAccountStatusForUser(user);
  const requiredDocumentTypes = requiredDocumentTypesForRole(user.role);
  const missingDocumentTypes = requiredDocumentTypes.filter((requiredType) => {
    return !documents.some(
      (document) =>
        document.type === requiredType &&
        (document.status === VerificationStatus.PENDING ||
          document.status === VerificationStatus.APPROVED),
    );
  });

  return {
    documents,
    verification: {
      role: user.role,
      accountStatus,
      requiredDocumentTypes,
      missingDocumentTypes,
      canSubmit: missingDocumentTypes.length === 0,
    } satisfies VerificationSummary,
  };
}

export async function createVerificationDocument(input: {
  userId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
}) {
  const document = await prisma.verificationDocument.create({
    data: {
      userId: input.userId,
      type: input.type,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: VerificationStatus.PENDING,
    },
    select: verificationDocumentSelect,
  });

  return serializeVerificationDocument(document);
}

export async function getVerificationDocumentForUser(
  documentId: string,
  userId: string,
) {
  return prisma.verificationDocument.findFirst({
    where: { id: documentId, userId },
    select: verificationDocumentSelect,
  });
}

export async function deleteVerificationDocumentForUser(
  documentId: string,
  userId: string,
) {
  const document = await prisma.verificationDocument.findFirst({
    where: { id: documentId, userId },
    select: verificationDocumentSelect,
  });

  if (!document) {
    return { error: "Document not found." } as const;
  }

  if (
    document.status !== VerificationStatus.PENDING &&
    document.status !== VerificationStatus.NOT_SUBMITTED &&
    document.status !== VerificationStatus.REJECTED
  ) {
    return {
      error: "Approved documents cannot be deleted.",
    } as const;
  }

  await prisma.verificationDocument.delete({
    where: { id: document.id },
  });

  return {
    document: serializeVerificationDocument(document),
  } as const;
}

export async function submitVerificationForUser(user: SafeUser) {
  const { documents, verification } = await listUserVerificationState(user);

  if (verification.missingDocumentTypes.length) {
    const missing = verification.missingDocumentTypes
      .map((type) => getVerificationDocumentTypeLabel(type))
      .join(", ");

    return {
      error: `Missing required documents: ${missing}.`,
      missingDocumentTypes: verification.missingDocumentTypes,
    } as const;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        status: AccountStatus.PENDING_VERIFICATION,
      },
    });

    if (user.ownerProfile) {
      await tx.ownerProfile.update({
        where: { id: user.ownerProfile.id },
        data: {
          verificationStatus: VerificationStatus.PENDING,
        },
      });
    }

    if (user.renterProfile) {
      await tx.renterProfile.update({
        where: { id: user.renterProfile.id },
        data: {
          verificationStatus: VerificationStatus.PENDING,
        },
      });
    }
  });

  return {
    documents,
    verification: {
      ...verification,
      accountStatus: VerificationStatus.PENDING,
    },
  } as const;
}
