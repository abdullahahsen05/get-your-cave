import {
  BookingStatus,
  TemporaryDocumentStatus,
  TemporaryDocumentType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createNotificationForUser } from "@/lib/notifications";

// Required document types every owner must upload before contract proceeds.
export const REQUIRED_TEMP_DOC_TYPES: TemporaryDocumentType[] = [
  TemporaryDocumentType.IDENTITY,
  TemporaryDocumentType.OWNERSHIP_PROOF,
];

// Days until a temporary document record expires.
const TEMP_DOC_EXPIRY_DAYS = 90;

// Booking statuses that allow the owner to upload documents.
const UPLOADABLE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.DOCUMENTS_REQUIRED,
];

// Booking statuses that admin can transition to DOCUMENTS_REQUIRED.
const REQUEST_DOCS_ALLOWED_STATUSES: BookingStatus[] = [
  BookingStatus.APPROVED,
  BookingStatus.ACTIVE,
];

export type TempDocRecord = {
  id: string;
  ownerId: string;
  bookingId: string | null;
  type: TemporaryDocumentType;
  fileUrl: string;
  status: TemporaryDocumentStatus;
  expiresAt: string;
  createdAt: string;
};

function serializeTempDoc(doc: {
  id: string;
  ownerId: string;
  bookingId: string | null;
  type: TemporaryDocumentType;
  fileUrl: string;
  status: TemporaryDocumentStatus;
  expiresAt: Date;
  createdAt: Date;
}): TempDocRecord {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    bookingId: doc.bookingId,
    type: doc.type,
    fileUrl: doc.fileUrl,
    status: doc.status,
    expiresAt: doc.expiresAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

async function areAllRequiredDocsSubmitted(bookingId: string): Promise<boolean> {
  const docs = await prisma.temporaryDocument.findMany({
    where: {
      bookingId,
      status: { in: [TemporaryDocumentStatus.PENDING, TemporaryDocumentStatus.APPROVED] },
      deletedAt: null,
    },
    select: { type: true },
  });

  const submittedTypes = new Set(docs.map((d) => d.type));
  return REQUIRED_TEMP_DOC_TYPES.every((t) => submittedTypes.has(t));
}

async function areAllRequiredDocsApproved(bookingId: string): Promise<boolean> {
  const docs = await prisma.temporaryDocument.findMany({
    where: {
      bookingId,
      status: TemporaryDocumentStatus.APPROVED,
      deletedAt: null,
    },
    select: { type: true },
  });

  const approvedTypes = new Set(docs.map((d) => d.type));
  return REQUIRED_TEMP_DOC_TYPES.every((t) => approvedTypes.has(t));
}

// Admin triggers: set booking to DOCUMENTS_REQUIRED.
export async function requestDocumentsForBooking(
  bookingId: string,
  adminId: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      owner: { select: { userId: true } },
    },
  });

  if (!booking) {
    return { error: "Booking not found." } as const;
  }

  if (!REQUEST_DOCS_ALLOWED_STATUSES.includes(booking.status)) {
    return {
      error: "Documents can only be requested for approved or active bookings.",
    } as const;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.DOCUMENTS_REQUIRED },
  });

  await createNotificationForUser({
    userId: booking.owner.userId,
    title: "Documents required",
    body: `Please upload your identity and ownership documents for booking ${booking.bookingNumber}.`,
    linkUrl: "/owner/dashboard",
  });

  return { success: true } as const;
}

// Owner uploads a document for a booking.
export async function createTemporaryDocumentForBooking(params: {
  bookingId: string;
  ownerProfileId: string;
  type: TemporaryDocumentType;
  fileUrl: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      id: true,
      status: true,
      ownerId: true,
    },
  });

  if (!booking) {
    return { error: "Booking not found." } as const;
  }

  if (booking.ownerId !== params.ownerProfileId) {
    return { error: "You can only upload documents for your own bookings." } as const;
  }

  if (!UPLOADABLE_BOOKING_STATUSES.includes(booking.status)) {
    return {
      error: "Documents can only be uploaded when the booking requires them.",
    } as const;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TEMP_DOC_EXPIRY_DAYS);

  const doc = await prisma.temporaryDocument.create({
    data: {
      ownerId: params.ownerProfileId,
      bookingId: params.bookingId,
      type: params.type,
      fileUrl: params.fileUrl,
      status: TemporaryDocumentStatus.PENDING,
      expiresAt,
    },
  });

  // Auto-advance: if all required types are now submitted → ADMIN_REVIEW.
  const allSubmitted = await areAllRequiredDocsSubmitted(params.bookingId);
  if (allSubmitted && booking.status === BookingStatus.DOCUMENTS_REQUIRED) {
    await prisma.booking.update({
      where: { id: params.bookingId },
      data: { status: BookingStatus.ADMIN_REVIEW },
    });
  }

  return { document: serializeTempDoc(doc) } as const;
}

// List documents for a booking — owner sees own booking's docs, admin sees any.
export async function listTempDocsForBooking(
  bookingId: string,
  viewer: {
    role: string;
    ownerProfileId?: string | null;
  },
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, ownerId: true, status: true },
  });

  if (!booking) {
    return null;
  }

  if (viewer.role === "OWNER" && viewer.ownerProfileId !== booking.ownerId) {
    return null;
  }

  const docs = await prisma.temporaryDocument.findMany({
    where: {
      bookingId,
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    bookingId,
    bookingStatus: booking.status,
    documents: docs.map(serializeTempDoc),
    requiredTypes: REQUIRED_TEMP_DOC_TYPES,
  };
}

export type TempDocsForBooking = Awaited<ReturnType<typeof listTempDocsForBooking>>;

// Admin: list all pending temporary documents with booking context.
export async function listPendingTempDocsForAdmin(params?: {
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(50, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;

  const where = {
    status: TemporaryDocumentStatus.PENDING,
    deletedAt: null,
  };

  const [total, docs] = await prisma.$transaction([
    prisma.temporaryDocument.count({ where }),
    prisma.temporaryDocument.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  // Enrich with booking context via bookingIds.
  const bookingIds = [...new Set(docs.flatMap((d) => (d.bookingId ? [d.bookingId] : [])))];

  const bookings = bookingIds.length
    ? await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          owner: {
            select: {
              id: true,
              user: { select: { fullName: true, email: true } },
            },
          },
          listing: { select: { title: true, city: true } },
        },
      })
    : [];

  const bookingMap = new Map(bookings.map((b) => [b.id, b]));

  return {
    total,
    page,
    limit,
    documents: docs.map((doc) => {
      const booking = doc.bookingId ? bookingMap.get(doc.bookingId) : undefined;
      return {
        ...serializeTempDoc(doc),
        booking: booking
          ? {
              id: booking.id,
              bookingNumber: booking.bookingNumber,
              status: booking.status,
              ownerName: booking.owner.user.fullName,
              ownerEmail: booking.owner.user.email,
              listingTitle: booking.listing.title,
              listingCity: booking.listing.city,
            }
          : null,
      };
    }),
  };
}

export type AdminTempDocList = Awaited<ReturnType<typeof listPendingTempDocsForAdmin>>;

// Admin: approve a document. If all required types are approved → booking advances.
export async function approveTempDocument(docId: string) {
  const doc = await prisma.temporaryDocument.findUnique({
    where: { id: docId },
  });

  if (!doc || doc.deletedAt) {
    return { error: "Document not found." } as const;
  }

  if (doc.status !== TemporaryDocumentStatus.PENDING) {
    return { error: "Only pending documents can be approved." } as const;
  }

  await prisma.temporaryDocument.update({
    where: { id: docId },
    data: { status: TemporaryDocumentStatus.APPROVED },
  });

  if (doc.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: doc.bookingId },
      select: {
        id: true,
        status: true,
        owner: { select: { userId: true } },
      },
    });

    if (booking?.status === BookingStatus.ADMIN_REVIEW) {
      const allApproved = await areAllRequiredDocsApproved(doc.bookingId);
      if (allApproved) {
        await prisma.booking.update({
          where: { id: doc.bookingId },
          data: { status: BookingStatus.APPROVED },
        });

        await createNotificationForUser({
          userId: booking.owner.userId,
          title: "Documents approved",
          body: "All your documents have been approved. Your booking can now proceed.",
          linkUrl: "/owner/dashboard",
        });
      }
    }
  }

  return { success: true } as const;
}

// Admin: reject a document. If booking is ADMIN_REVIEW → revert to DOCUMENTS_REQUIRED.
export async function rejectTempDocument(docId: string, reason?: string) {
  const doc = await prisma.temporaryDocument.findUnique({
    where: { id: docId },
  });

  if (!doc || doc.deletedAt) {
    return { error: "Document not found." } as const;
  }

  if (doc.status !== TemporaryDocumentStatus.PENDING) {
    return { error: "Only pending documents can be rejected." } as const;
  }

  await prisma.temporaryDocument.update({
    where: { id: docId },
    data: { status: TemporaryDocumentStatus.REJECTED },
  });

  if (doc.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: doc.bookingId },
      select: {
        id: true,
        status: true,
        owner: { select: { userId: true } },
      },
    });

    if (booking?.status === BookingStatus.ADMIN_REVIEW) {
      await prisma.booking.update({
        where: { id: doc.bookingId },
        data: { status: BookingStatus.DOCUMENTS_REQUIRED },
      });

      await createNotificationForUser({
        userId: booking.owner.userId,
        title: "Document rejected",
        body: reason
          ? `A document was rejected: ${reason}. Please upload a replacement.`
          : "A document was rejected. Please upload a replacement.",
        linkUrl: "/owner/dashboard",
      });
    }
  }

  return { success: true } as const;
}
