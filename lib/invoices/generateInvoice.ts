import { InvoiceStatus, Prisma, type UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculateInvoiceCharges } from "@/lib/invoices/calculateInvoice";
import { generateInvoiceNumber } from "@/lib/invoices/invoiceNumber";
import {
  getInvoiceStatusLabel,
  normalizeInvoiceSort,
  normalizeInvoiceStatusFilter,
} from "@/lib/invoices/invoiceTypes";

type InvoiceViewer = {
  role: UserRole;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
};

const invoiceInclude = {
  booking: {
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          postalCode: true,
          storageType: true,
          pricePerMonth: true,
          securityDeposit: true,
          insuranceFee: true,
          status: true,
          isPublished: true,
        },
      },
      owner: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
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
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  },
  owner: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
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
          phone: true,
          avatarUrl: true,
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      platformCommission: true,
      ownerAmount: true,
      paidAt: true,
      createdAt: true,
    },
  },
  items: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceRecord = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

function toMoneyString(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const decimal = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return decimal.toFixed(2);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildTimeline(
  record: Pick<
    InvoiceRecord,
    "issuedAt" | "paidAt" | "cancelledAt" | "dueAt" | "createdAt" | "status"
  >,
) {
  return [
    {
      key: "generated",
      label: "Generated",
      at: record.createdAt.toISOString(),
      active: true,
    },
    {
      key: "issued",
      label: "Issued",
      at: record.issuedAt?.toISOString() ?? null,
      active: Boolean(record.issuedAt),
    },
    {
      key: "due",
      label: "Due",
      at: record.dueAt?.toISOString() ?? null,
      active: Boolean(record.dueAt),
    },
    {
      key: "paid",
      label: "Paid",
      at: record.paidAt?.toISOString() ?? null,
      active: Boolean(record.paidAt || record.status === InvoiceStatus.PAID),
    },
    {
      key: "cancelled",
      label: "Cancelled",
      at: record.cancelledAt?.toISOString() ?? null,
      active: Boolean(record.cancelledAt || record.status === InvoiceStatus.CANCELLED),
    },
  ];
}

export type SafeInvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

export type SafeInvoice = {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  bookingNumber: string;
  bookingTitle: string;
  bookingAddress: string;
  bookingCity: string;
  bookingStorageType: string;
  ownerName: string;
  ownerEmail: string;
  renterName: string;
  renterEmail: string;
  subtotal: string;
  platformFee: string;
  taxAmount: string;
  securityDeposit: string;
  totalAmount: string;
  currency: string;
  status: InvoiceStatus;
  statusLabel: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  generatedFile: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string | null;
  paymentAmount: string | null;
  items: SafeInvoiceItem[];
  timeline: Array<{
    key: string;
    label: string;
    at: string | null;
    active: boolean;
  }>;
};

export type InvoiceListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string | null;
  sort?: string | null;
};

export type InvoiceListResult = {
  invoices: SafeInvoice[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    paidCount: number;
    openCount: number;
    overdueCount: number;
    paidAmount: string;
    openAmount: string;
    overdueAmount: string;
  };
  totals: {
    subtotal: string;
    platformFee: string;
    totalAmount: string;
  };
};

type InvoiceBooking = {
  id: string;
  bookingNumber: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  monthlyPrice: Prisma.Decimal;
  securityDeposit: Prisma.Decimal;
  insuranceFee: Prisma.Decimal;
  platformCommission: Prisma.Decimal;
  ownerAmount: Prisma.Decimal;
  totalMonthlyAmount: Prisma.Decimal;
  ownerId: string;
  renterId: string;
  listing: {
    id: string;
    title: string;
    address: string;
    city: string;
    postalCode: string | null;
    storageType: string;
  };
  owner: {
    user: {
      fullName: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
    };
  };
  renter: {
    user: {
      fullName: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
    };
  };
  payments: Array<{
    id: string;
    status: string;
    amount: Prisma.Decimal;
    platformCommission: Prisma.Decimal;
    ownerAmount: Prisma.Decimal;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  invoices: Array<{
    id: string;
    issuedAt: Date | null;
    dueAt: Date | null;
    status: InvoiceStatus;
    paymentId: string | null;
    generatedFile: string | null;
  }>;
};

function toSafeInvoice(record: InvoiceRecord): SafeInvoice {
  const latestPayment = record.payment ?? null;
  const items = record.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: toMoneyString(item.unitPrice),
    total: toMoneyString(item.total),
  }));

  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    bookingId: record.bookingId,
    bookingNumber: record.booking.bookingNumber,
    bookingTitle: record.booking.listing.title,
    bookingAddress: record.booking.listing.address,
    bookingCity: record.booking.listing.city,
    bookingStorageType: record.booking.listing.storageType,
    ownerName: record.owner?.user.fullName ?? record.booking.owner.user.fullName,
    ownerEmail: record.owner?.user.email ?? record.booking.owner.user.email,
    renterName: record.renter?.user.fullName ?? record.booking.renter.user.fullName,
    renterEmail: record.renter?.user.email ?? record.booking.renter.user.email,
    subtotal: toMoneyString(record.subtotal),
    platformFee: toMoneyString(record.platformFee),
    taxAmount: toMoneyString(record.taxAmount),
    securityDeposit: toMoneyString(record.booking.securityDeposit),
    totalAmount: toMoneyString(record.totalAmount),
    currency: record.currency,
    status: record.status,
    statusLabel: getInvoiceStatusLabel(record.status),
    issuedAt: record.issuedAt?.toISOString() ?? null,
    dueAt: record.dueAt?.toISOString() ?? null,
    paidAt: record.paidAt?.toISOString() ?? null,
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
    generatedFile: record.generatedFile ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    paymentStatus: latestPayment?.status ?? null,
    paymentAmount: latestPayment ? toMoneyString(latestPayment.amount) : null,
    items,
    timeline: buildTimeline(record),
  };
}

async function loadInvoiceBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          postalCode: true,
          storageType: true,
        },
      },
      owner: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
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
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
      payments: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
      },
      invoices: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
      },
    },
  }) as Promise<InvoiceBooking | null>;
}

function buildInvoiceLineItems(params: {
  monthlyPrice: Prisma.Decimal;
  insuranceFee: Prisma.Decimal;
  securityDeposit: Prisma.Decimal;
  platformFee: Prisma.Decimal;
  taxes: Prisma.Decimal;
}) {
  return [
    {
      description: "Monthly rental charge",
      quantity: 1,
      unitPrice: params.monthlyPrice,
      total: params.monthlyPrice,
    },
    {
      description: "Insurance fee",
      quantity: 1,
      unitPrice: params.insuranceFee,
      total: params.insuranceFee,
    },
    {
      description: "Security deposit",
      quantity: 1,
      unitPrice: params.securityDeposit,
      total: params.securityDeposit,
    },
    {
      description: "Platform commission",
      quantity: 1,
      unitPrice: params.platformFee,
      total: params.platformFee,
    },
    ...(params.taxes.gt(0)
      ? [
          {
            description: "Taxes",
            quantity: 1,
            unitPrice: params.taxes,
            total: params.taxes,
          },
        ]
      : []),
  ];
}

function buildInvoiceTimelinePayload(status: InvoiceStatus, issuedAt: Date, dueAt: Date | null) {
  return [
    {
      key: "generated",
      label: "Generated",
      at: issuedAt.toISOString(),
      active: true,
    },
    {
      key: "issued",
      label: "Issued",
      at: issuedAt.toISOString(),
      active: true,
    },
    {
      key: "due",
      label: "Due",
      at: dueAt?.toISOString() ?? null,
      active: Boolean(dueAt),
    },
    {
      key: "paid",
      label: "Paid",
      at: status === InvoiceStatus.PAID ? issuedAt.toISOString() : null,
      active: status === InvoiceStatus.PAID,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      at: status === InvoiceStatus.CANCELLED ? issuedAt.toISOString() : null,
      active: status === InvoiceStatus.CANCELLED,
    },
  ];
}

function buildDefaultDueDate(issuedAt: Date) {
  return addDays(issuedAt, 14);
}

export async function generateInvoiceForBooking(params: {
  bookingId: string;
  status?: InvoiceStatus;
}) {
  const booking = await loadInvoiceBooking(params.bookingId);
  if (!booking) {
    return null;
  }

  const charges = calculateInvoiceCharges({
    monthlyPrice: booking.monthlyPrice,
    insuranceFee: booking.insuranceFee,
    securityDeposit: booking.securityDeposit,
    platformCommission: booking.platformCommission,
  });

  const issuedAt = new Date();
  const dueAt = buildDefaultDueDate(issuedAt);
  const payment = booking.payments[0] ?? null;
  const invoiceStatus =
    payment?.status === "PAID" ? InvoiceStatus.PAID : params.status ?? InvoiceStatus.ISSUED;
  const lineItems = buildInvoiceLineItems({
    monthlyPrice: charges.monthlyPrice,
    insuranceFee: charges.insuranceFee,
    securityDeposit: charges.securityDeposit,
    platformFee: charges.platformFee,
    taxes: charges.taxes,
  });
  const existing = booking.invoices[0] ?? null;

  const invoice = await prisma.$transaction(async (transaction) => {
    if (existing) {
      const updated = await transaction.invoice.update({
        where: { id: existing.id },
        data: {
          ownerId: booking.ownerId,
          renterId: booking.renterId,
          subtotal: charges.subtotal,
          platformFee: charges.platformFee,
          taxAmount: charges.taxes,
          totalAmount: charges.total,
          issuedAt: existing.issuedAt ?? issuedAt,
          dueAt: existing.dueAt ?? dueAt,
          status: invoiceStatus,
          paymentId: payment?.id ?? existing.paymentId,
          timeline: buildInvoiceTimelinePayload(
            invoiceStatus,
            existing.issuedAt ?? issuedAt,
            existing.dueAt ?? dueAt,
          ),
          generatedFile: existing.generatedFile ?? null,
        },
        include: invoiceInclude,
      });

      await transaction.invoiceItem.deleteMany({
        where: { invoiceId: updated.id },
      });

      await transaction.invoiceItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: updated.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      });

      const reloaded = await transaction.invoice.findUnique({
        where: { id: updated.id },
        include: invoiceInclude,
      });

      return reloaded;
    }

    let generatedInvoiceNumber = await generateInvoiceNumber();
    let created: InvoiceRecord | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        created = await transaction.invoice.create({
          data: {
            invoiceNumber: generatedInvoiceNumber,
            bookingId: booking.id,
            paymentId: payment?.id ?? null,
            ownerId: booking.ownerId,
            renterId: booking.renterId,
            subtotal: charges.subtotal,
            platformFee: charges.platformFee,
            taxAmount: charges.taxes,
            totalAmount: charges.total,
            currency: "eur",
            status: invoiceStatus,
            issuedAt,
            dueAt,
            timeline: buildInvoiceTimelinePayload(invoiceStatus, issuedAt, dueAt),
          },
          include: invoiceInclude,
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

        generatedInvoiceNumber = await generateInvoiceNumber();
      }
    }

    if (!created) {
      return null;
    }

    await transaction.invoiceItem.createMany({
      data: lineItems.map((item) => ({
        invoiceId: created.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });

    const reloaded = await transaction.invoice.findUnique({
      where: { id: created.id },
      include: invoiceInclude,
    });

    return reloaded;
  });

  return invoice ? toSafeInvoice(invoice) : null;
}

export async function getInvoiceForViewer(invoiceId: string, viewer: InvoiceViewer) {
  const record = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: invoiceInclude,
  });

  if (!record) {
    return null;
  }

  if (
    viewer.role !== "ADMIN" &&
    !(
      (viewer.role === "OWNER" && viewer.ownerProfileId === record.ownerId) ||
      (viewer.role === "RENTER" && viewer.renterProfileId === record.renterId)
    )
  ) {
    return null;
  }

  return toSafeInvoice(record);
}

function buildInvoiceWhere(viewer: InvoiceViewer, filters: InvoiceListFilters) {
  const baseWhere: Prisma.InvoiceWhereInput = {};

  if (viewer.role === "OWNER" && viewer.ownerProfileId) {
    baseWhere.ownerId = viewer.ownerProfileId;
  } else if (viewer.role === "RENTER" && viewer.renterProfileId) {
    baseWhere.renterId = viewer.renterProfileId;
  } else if (viewer.role !== "ADMIN") {
    return null;
  }

  const status = normalizeInvoiceStatusFilter(filters.status);
  if (status) {
    baseWhere.status = status;
  }

  const search = filters.search?.trim();
  if (search) {
    baseWhere.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { booking: { bookingNumber: { contains: search, mode: "insensitive" } } },
      { booking: { listing: { title: { contains: search, mode: "insensitive" } } } },
      { owner: { user: { fullName: { contains: search, mode: "insensitive" } } } },
      { renter: { user: { fullName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  return baseWhere;
}

export async function getInvoicesForViewer(
  viewer: InvoiceViewer,
  filters: InvoiceListFilters = {},
): Promise<InvoiceListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 10));
  const where = buildInvoiceWhere(viewer, filters);
  const sort = normalizeInvoiceSort(filters.sort);

  if (!where) {
    return {
      invoices: [],
      pagination: {
        page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
      },
      summary: {
        paidCount: 0,
        openCount: 0,
        overdueCount: 0,
        paidAmount: "0.00",
        openAmount: "0.00",
        overdueAmount: "0.00",
      },
      totals: {
        subtotal: "0.00",
        platformFee: "0.00",
        totalAmount: "0.00",
      },
    };
  }

  const orderBy =
    sort === "oldest"
      ? [{ issuedAt: "asc" as const }, { createdAt: "asc" as const }]
      : [{ issuedAt: "desc" as const }, { createdAt: "desc" as const }];

  const [totalItems, records] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: invoiceInclude,
    }),
  ]);

  const [summaryAggregate, paidAggregate, openAggregate, overdueAggregate, paidCount, openCount, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        platformFee: true,
        totalAmount: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        ...where,
        status: InvoiceStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        ...where,
        status: {
          in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED],
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        ...where,
        status: InvoiceStatus.OVERDUE,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.invoice.count({
      where: {
        ...where,
        status: InvoiceStatus.PAID,
      },
    }),
    prisma.invoice.count({
      where: {
        ...where,
        status: {
          in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED],
        },
      },
    }),
    prisma.invoice.count({
      where: {
        ...where,
        status: InvoiceStatus.OVERDUE,
      },
    }),
  ]);

  const invoices = records.map((record) => toSafeInvoice(record));

  return {
    invoices,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
      summary: {
        paidCount,
        openCount,
        overdueCount,
        paidAmount: paidAggregate._sum.totalAmount?.toFixed(2) ?? "0.00",
        openAmount: openAggregate._sum.totalAmount?.toFixed(2) ?? "0.00",
        overdueAmount: overdueAggregate._sum.totalAmount?.toFixed(2) ?? "0.00",
      },
    totals: {
      subtotal: summaryAggregate._sum.subtotal?.toFixed(2) ?? "0.00",
      platformFee: summaryAggregate._sum.platformFee?.toFixed(2) ?? "0.00",
      totalAmount: summaryAggregate._sum.totalAmount?.toFixed(2) ?? "0.00",
    },
  };
}

export async function updateInvoiceForViewer(params: {
  invoiceId: string;
  viewer: InvoiceViewer;
  status?: InvoiceStatus;
}) {
  const record = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: invoiceInclude,
  });

  if (!record) {
    return null;
  }

  if (
    params.viewer.role !== "ADMIN" &&
    !(
      params.viewer.role === "OWNER" && params.viewer.ownerProfileId === record.ownerId
    )
  ) {
    return null;
  }

  if (!params.status) {
    return toSafeInvoice(record);
  }

  const now = new Date();
  const timeline = Array.isArray(record.timeline) ? [...record.timeline] : [];
  timeline.push({
    key: `status-${params.status.toLowerCase()}`,
    label: `Status changed to ${getInvoiceStatusLabel(params.status)}`,
    at: now.toISOString(),
    active: true,
  });

  const updated = await prisma.invoice.update({
    where: { id: record.id },
    data: {
      status: params.status,
      paidAt: params.status === InvoiceStatus.PAID ? now : record.paidAt,
      cancelledAt: params.status === InvoiceStatus.CANCELLED ? now : record.cancelledAt,
      timeline,
    },
    include: invoiceInclude,
  });

  return toSafeInvoice(updated);
}

export async function generateInvoiceForBookingIdIfNeeded(bookingId: string) {
  const existing = await prisma.invoice.findFirst({
    where: { bookingId },
    select: { id: true },
  });

  if (existing) {
    return getInvoiceForViewer(existing.id, {
      role: "ADMIN",
      ownerProfileId: null,
      renterProfileId: null,
    });
  }

  return generateInvoiceForBooking({ bookingId });
}

export function getInvoiceStatusDisplayValue(status: InvoiceStatus) {
  return getInvoiceStatusLabel(status);
}
