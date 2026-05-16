import {
  BookingStatus,
  InvoiceStatus,
  ListingStatus,
  Prisma,
  type Booking,
  type UserRole,
} from "@prisma/client";

import { generateContractForBooking } from "@/lib/contracts/generateContract";
import { generateInvoiceForBooking } from "@/lib/invoices/generateInvoice";
import { prisma } from "@/lib/prisma";
import type {
  BookingCreateInput,
  BookingUpdateInput,
} from "@/lib/validations/booking";

type CurrentViewer = {
  role: UserRole;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
};

type BookingListingSummary = {
  id: string;
  title: string;
  slug: string | null;
  storageType: string;
  city: string;
  address: string;
  pricePerMonth: string;
  securityDeposit: string;
  insuranceFee: string;
  sizeSqFt: number | null;
  status: ListingStatus;
  isPublished: boolean;
  imageUrl: string | null;
};

type BookingPersonSummary = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  city: string | null;
};

export type BookingResponse = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  startDate: string;
  endDate: string | null;
  durationMonths: number | null;
  monthlyPrice: string;
  securityDeposit: string;
  insuranceFee: string;
  platformCommission: string;
  ownerAmount: string;
  totalMonthlyAmount: string;
  renterNote: string | null;
  ownerNote: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  listing: BookingListingSummary;
  owner: BookingPersonSummary;
  renter: BookingPersonSummary;
  contractStatus: string | null;
  paymentStatus: string | null;
  invoiceStatus: string | null;
};

const bookingInclude = {
  listing: {
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
      },
    },
  },
  owner: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  renter: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  generatedContract: {
    select: {
      contractNumber: true,
      status: true,
      generatedAt: true,
      generatedFilePath: true,
      generatedFileName: true,
      contractType: true,
    },
  },
  payments: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
    select: {
      status: true,
    },
  },
  invoices: {
    orderBy: [{ createdAt: "desc" as const }],
    take: 1,
    select: {
      status: true,
    },
  },
} satisfies Prisma.BookingInclude;

function toDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }

  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
}

function toMoneyString(value: number | string | Prisma.Decimal | null | undefined) {
  return toDecimal(value).toFixed(2);
}

function parseDateInput(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function monthsBetween(startDate: Date, endDate: Date) {
  const years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  const months = endDate.getUTCMonth() - startDate.getUTCMonth();
  const total = years * 12 + months;
  return Math.max(1, total || 1);
}

function pickPrimaryImage(images: Array<{
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}>) {
  if (!images.length) {
    return null;
  }

  return images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? null;
}

function buildBookingNumber() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BK-${stamp}-${suffix}`;
}

function serializeBooking(
  booking: Booking & {
    listing: {
      id: string;
      title: string;
      slug: string | null;
      storageType: string;
      city: string;
      address: string;
      pricePerMonth: Prisma.Decimal;
      securityDeposit: Prisma.Decimal;
      insuranceFee: Prisma.Decimal;
      sizeSqFt: number | null;
      status: ListingStatus;
      isPublished: boolean;
      images: Array<{
        url: string;
        isPrimary: boolean;
        sortOrder: number;
      }>;
    };
    owner: {
      id: string;
      userId: string;
      city: string | null;
      user: {
        fullName: string;
        email: string;
        avatarUrl: string | null;
      };
    };
    renter: {
      id: string;
      userId: string;
      city: string | null;
      user: {
        fullName: string;
        email: string;
        avatarUrl: string | null;
      };
    };
    generatedContract: {
      status: BookingStatus | null;
    } | null;
    payments: Array<{
      status: string;
    }>;
    invoices: Array<{
      status: string;
    }>;
  },
): BookingResponse {
  const monthlyPrice = toDecimal(booking.monthlyPrice);
  const securityDeposit = toDecimal(booking.securityDeposit);
  const insuranceFee = toDecimal(booking.insuranceFee);
  const platformCommission = toDecimal(booking.platformCommission);
  const ownerAmount = toDecimal(booking.ownerAmount);
  const totalMonthlyAmount = toDecimal(booking.totalMonthlyAmount);

  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate?.toISOString() ?? null,
    durationMonths: booking.durationMonths,
    monthlyPrice: monthlyPrice.toFixed(2),
    securityDeposit: securityDeposit.toFixed(2),
    insuranceFee: insuranceFee.toFixed(2),
    platformCommission: platformCommission.toFixed(2),
    ownerAmount: ownerAmount.toFixed(2),
    totalMonthlyAmount: totalMonthlyAmount.toFixed(2),
    renterNote: booking.renterNote,
    ownerNote: booking.ownerNote,
    approvedAt: booking.approvedAt?.toISOString() ?? null,
    rejectedAt: booking.rejectedAt?.toISOString() ?? null,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    completedAt: booking.completedAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    listing: {
      id: booking.listing.id,
      title: booking.listing.title,
      slug: booking.listing.slug,
      storageType: booking.listing.storageType,
      city: booking.listing.city,
      address: booking.listing.address,
      pricePerMonth: toMoneyString(booking.listing.pricePerMonth),
      securityDeposit: toMoneyString(booking.listing.securityDeposit),
      insuranceFee: toMoneyString(booking.listing.insuranceFee),
      sizeSqFt: booking.listing.sizeSqFt,
      status: booking.listing.status,
      isPublished: booking.listing.isPublished,
      imageUrl: pickPrimaryImage(booking.listing.images),
    },
    owner: {
      id: booking.owner.id,
      fullName: booking.owner.user.fullName,
      email: booking.owner.user.email,
      avatarUrl: booking.owner.user.avatarUrl,
      city: booking.owner.city,
    },
    renter: {
      id: booking.renter.id,
      fullName: booking.renter.user.fullName,
      email: booking.renter.user.email,
      avatarUrl: booking.renter.user.avatarUrl,
      city: booking.renter.city,
    },
    contractStatus: booking.generatedContract?.status ?? null,
    paymentStatus: booking.payments[0]?.status ?? null,
    invoiceStatus: booking.invoices[0]?.status ?? null,
  };
}

function buildBookingQueryWhere(viewer: CurrentViewer) {
  if (viewer.role === "ADMIN") {
    return {};
  }

  if (viewer.role === "OWNER" && viewer.ownerProfileId) {
    return { ownerId: viewer.ownerProfileId };
  }

  if (viewer.role === "RENTER" && viewer.renterProfileId) {
    return { renterId: viewer.renterProfileId };
  }

  return null;
}

export async function getBookableListingById(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      owner: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      images: {
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
      },
    },
  });

  if (!listing) {
    return null;
  }

  if (!listing.isPublished || listing.status !== ListingStatus.APPROVED) {
    return null;
  }

  return listing;
}

export function calculateBookingCharges(params: {
  monthlyPrice: number | string | Prisma.Decimal;
  securityDeposit?: number | string | Prisma.Decimal | null;
  insuranceFee?: number | string | Prisma.Decimal | null;
}) {
  const monthlyPrice = toDecimal(params.monthlyPrice);
  const securityDeposit = toDecimal(params.securityDeposit ?? 0);
  const insuranceFee = toDecimal(params.insuranceFee ?? 0);
  const platformCommission = monthlyPrice.mul(0.12).toDecimalPlaces(2);
  const ownerAmount = monthlyPrice.sub(platformCommission).toDecimalPlaces(2);
  const totalMonthlyAmount = monthlyPrice
    .add(insuranceFee)
    .add(platformCommission)
    .toDecimalPlaces(2);

  return {
    monthlyPrice: monthlyPrice.toDecimalPlaces(2),
    securityDeposit: securityDeposit.toDecimalPlaces(2),
    insuranceFee: insuranceFee.toDecimalPlaces(2),
    platformCommission,
    ownerAmount,
    totalMonthlyAmount,
  };
}

export async function createRenterBooking(params: {
  renterProfileId: string;
  data: BookingCreateInput;
}) {
  const listing = await getBookableListingById(params.data.listingId);

  if (!listing) {
    return null;
  }

  const startDate = parseDateInput(params.data.startDate);
  if (!startDate) {
    return null;
  }

  const endDateInput = params.data.endDate ? parseDateInput(params.data.endDate) : null;
  if (params.data.endDate && !endDateInput) {
    return null;
  }

  const durationMonths =
    params.data.durationMonths ?? (endDateInput ? monthsBetween(startDate, endDateInput) : 1);

  const derivedEndDate = endDateInput ?? addMonths(startDate, durationMonths);

  if (derivedEndDate.getTime() <= startDate.getTime()) {
    return null;
  }

  const charges = calculateBookingCharges({
    monthlyPrice: listing.pricePerMonth,
    securityDeposit: listing.securityDeposit,
    insuranceFee: listing.insuranceFee,
  });

  let booking: Booking | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      booking = await prisma.booking.create({
        data: {
          bookingNumber: buildBookingNumber(),
          listingId: listing.id,
          ownerId: listing.ownerId,
          renterId: params.renterProfileId,
          startDate,
          endDate: derivedEndDate,
          durationMonths,
          monthlyPrice: charges.monthlyPrice,
          securityDeposit: charges.securityDeposit,
          insuranceFee: charges.insuranceFee,
          platformCommission: charges.platformCommission,
          ownerAmount: charges.ownerAmount,
          totalMonthlyAmount: charges.totalMonthlyAmount,
          renterNote: params.data.renterNote ?? null,
          status: BookingStatus.PENDING,
        },
      });
      break;
    } catch (error) {
      const isDuplicate =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";

      if (!isDuplicate || attempt === 2) {
        throw error;
      }
    }
  }

  if (!booking) {
    return null;
  }

  const refreshed = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: bookingInclude,
  });

  return refreshed ? serializeBooking(refreshed as Parameters<typeof serializeBooking>[0]) : null;
}

export async function getBookingForViewer(
  bookingId: string,
  viewer?: CurrentViewer | null,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) {
    return null;
  }

  if (!viewer) {
    return null;
  }

  if (
    viewer.role === "ADMIN" ||
    (viewer.role === "OWNER" && viewer.ownerProfileId === booking.ownerId) ||
    (viewer.role === "RENTER" && viewer.renterProfileId === booking.renterId)
  ) {
    return serializeBooking(booking as Parameters<typeof serializeBooking>[0]);
  }

  return null;
}

export async function getOwnerBookings(ownerProfileId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      ownerId: ownerProfileId,
    },
    orderBy: [{ updatedAt: "desc" }],
    include: bookingInclude,
  });

  return bookings.map((booking) =>
    serializeBooking(booking as Parameters<typeof serializeBooking>[0]),
  );
}

export async function getRenterBookings(renterProfileId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      renterId: renterProfileId,
    },
    orderBy: [{ updatedAt: "desc" }],
    include: bookingInclude,
  });

  return bookings.map((booking) =>
    serializeBooking(booking as Parameters<typeof serializeBooking>[0]),
  );
}

export async function getBookingsForViewer(viewer: CurrentViewer) {
  const where = buildBookingQueryWhere(viewer);
  if (where === null) {
    return [];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: bookingInclude,
  });

  return bookings.map((booking) =>
    serializeBooking(booking as Parameters<typeof serializeBooking>[0]),
  );
}

export async function updateBookingForViewer(params: {
  bookingId: string;
  viewer: CurrentViewer;
  data: BookingUpdateInput;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: bookingInclude,
  });

  if (!booking) {
    return null;
  }

  const isOwner = params.viewer.role === "OWNER" && params.viewer.ownerProfileId === booking.ownerId;
  const isRenter = params.viewer.role === "RENTER" && params.viewer.renterProfileId === booking.renterId;
  const isAdmin = params.viewer.role === "ADMIN";

  if (!isOwner && !isRenter && !isAdmin) {
    return null;
  }

  const nextStatus = params.data.status ?? booking.status;

  if (isOwner || isAdmin) {
    const allowedOwnerStatuses = new Set<BookingStatus>([
      BookingStatus.PENDING,
      BookingStatus.APPROVED,
      BookingStatus.REJECTED,
      BookingStatus.ACTIVE,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ]);

    if (!allowedOwnerStatuses.has(nextStatus)) {
      return null;
    }
  }

  if (isRenter && nextStatus !== BookingStatus.CANCELLED) {
    return null;
  }

  if (
    isOwner &&
    booking.ownerId !== params.viewer.ownerProfileId
  ) {
    return null;
  }

  const updates: Prisma.BookingUpdateInput = {};

  if (typeof params.data.ownerNote === "string") {
    updates.ownerNote = params.data.ownerNote;
  }

  if (typeof params.data.renterNote === "string") {
    updates.renterNote = params.data.renterNote;
  }

  if (params.data.startDate) {
    const startDate = parseDateInput(params.data.startDate);
    if (!startDate) {
      return null;
    }
    updates.startDate = startDate;
  }

  if (params.data.endDate) {
    const endDate = parseDateInput(params.data.endDate);
    if (!endDate) {
      return null;
    }
    updates.endDate = endDate;
  }

  if (typeof params.data.durationMonths === "number") {
    updates.durationMonths = params.data.durationMonths;
  }

  if (params.data.status) {
    updates.status = params.data.status;
    updates.approvedAt =
      params.data.status === BookingStatus.APPROVED ? new Date() : null;
    updates.rejectedAt =
      params.data.status === BookingStatus.REJECTED ? new Date() : null;
    updates.cancelledAt =
      params.data.status === BookingStatus.CANCELLED ? new Date() : null;
    updates.completedAt =
      params.data.status === BookingStatus.COMPLETED ? new Date() : null;

    if (params.data.status === BookingStatus.APPROVED) {
      updates.rejectedAt = null;
      updates.cancelledAt = null;
      updates.completedAt = null;
    }

    if (params.data.status === BookingStatus.REJECTED) {
      updates.approvedAt = null;
      updates.cancelledAt = null;
      updates.completedAt = null;
    }

    if (params.data.status === BookingStatus.CANCELLED) {
      updates.approvedAt = null;
      updates.rejectedAt = null;
      updates.completedAt = null;
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: updates,
    include: bookingInclude,
  });

  let refreshedUpdated = updated;

  if (params.data.status === BookingStatus.APPROVED) {
    await generateContractForBooking({
      bookingId: updated.id,
    }).catch((error) => {
      console.error("Failed to auto-generate contract after approval:", error);
    });

    await generateInvoiceForBooking({
      bookingId: updated.id,
      status: InvoiceStatus.ISSUED,
    }).catch((error) => {
      console.error("Failed to auto-generate invoice after approval:", error);
    });

    const reloaded = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: bookingInclude,
    });

    if (reloaded) {
      refreshedUpdated = reloaded;
    }
  }

  return serializeBooking(
    refreshedUpdated as Parameters<typeof serializeBooking>[0],
  );
}
