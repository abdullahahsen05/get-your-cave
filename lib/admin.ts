import {
  AccountStatus,
  AdminEntityType,
  BookingStatus,
  ContractStatus,
  DocumentType,
  InvoiceStatus,
  ListingStatus,
  PaymentStatus,
  Prisma,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

import type { SafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  requiredDocumentTypesForRole,
  serializeVerificationDocument,
  type VerificationDocumentView,
} from "@/lib/verification";
import type {
  AdminActivityPage,
  AdminActivityRow,
  AdminDashboardResponse,
  AdminMarketInsight,
  AdminRevenuePoint,
} from "@/lib/admin-shared";
import { verificationDocumentTypeLabels } from "@/lib/verification-types";

const ACTIVITY_TYPE_CLASS: Record<string, string> = {
  User: "bg-[#4b6547]/10 text-[#516b4d]",
  Listing: "bg-[#0f3d3e]/10 text-[#0f3d3e]",
  Booking: "bg-[#4b6547]/10 text-[#516b4d]",
  Payment: "bg-[#0f3d3e]/10 text-[#0f3d3e]",
  Invoice: "bg-[#4b6547]/10 text-[#516b4d]",
  Contract: "bg-[#0f3d3e]/10 text-[#0f3d3e]",
  "Verification Document": "bg-[#4b6547]/10 text-[#516b4d]",
  System: "bg-[#0f3d3e]/10 text-[#0f3d3e]",
};

const STATUS_DOT_CLASS: Record<string, string> = {
  Approved: "bg-[#4b6547]",
  Verified: "bg-[#4b6547]",
  Active: "bg-[#4b6547]",
  Pending: "bg-amber-500",
  Rejected: "bg-rose-500",
  Completed: "bg-[#0f3d3e]",
  Paid: "bg-[#0f3d3e]",
  Failed: "bg-rose-500",
  Open: "bg-amber-500",
  Draft: "bg-stone-400",
  Sent: "bg-[#0f3d3e]",
};

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function toCurrencyString(value: Prisma.Decimal | number | string | null | undefined) {
  return decimalToNumber(value).toFixed(2);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDay(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function normalizeSearch(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : null;
}

function getActivityTypeLabel(entityType: string) {
  switch (entityType) {
    case "USER":
      return "User";
    case "LISTING":
      return "Listing";
    case "BOOKING":
      return "Booking";
    case "PAYMENT":
      return "Payment";
    case "INVOICE":
      return "Invoice";
    case "CONTRACT":
      return "Contract";
    case "VERIFICATION_DOCUMENT":
      return "Verification Document";
    default:
      return "System";
  }
}

function getStatusLabelFromEntity(entityType: string, action: string, details: Prisma.JsonValue | null | undefined) {
  const detailRecord =
    details && typeof details === "object" && !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : null;
  const explicit = detailRecord?.statusLabel;
  if (typeof explicit === "string" && explicit.length) {
    return explicit;
  }

  if (entityType === "VERIFICATION_DOCUMENT") {
    if (action.includes("APPROVE")) return "Approved";
    if (action.includes("REJECT")) return "Rejected";
    return "Pending";
  }

  if (entityType === "LISTING") {
    if (action.includes("APPROVE")) return "Approved";
    if (action.includes("REJECT")) return "Rejected";
    return "Pending";
  }

  if (entityType === "BOOKING") {
    if (action.includes("APPROVE")) return "Approved";
    if (action.includes("REJECT")) return "Rejected";
    if (action.includes("COMPLETE")) return "Completed";
    return "Pending";
  }

  if (entityType === "PAYMENT") {
    if (action.includes("FAIL")) return "Failed";
    if (action.includes("PAID")) return "Paid";
  }

  return "Updated";
}

function getStatusDot(status: string) {
  return STATUS_DOT_CLASS[status] ?? "bg-[#4b6547]";
}

function makeActivityRow(params: {
  id: string;
  name: string;
  entityId: string;
  entityType: string;
  status: string;
  date: Date;
  action: string;
}) {
  const type = getActivityTypeLabel(params.entityType);

  return {
    id: params.id,
    name: params.name,
    entityId: params.entityId,
    type,
    typeClass: ACTIVITY_TYPE_CLASS[type] ?? ACTIVITY_TYPE_CLASS.System,
    status: params.status,
    statusDot: getStatusDot(params.status),
    date: formatShortDate(params.date),
    action: params.action,
    entityType: params.entityType,
  } satisfies AdminActivityRow;
}

export function requireAdminAccess(user: SafeUser | null) {
  if (!user) {
    return { error: "You must be signed in as an admin." } as const;
  }

  if (user.role !== "ADMIN") {
    return { error: "You do not have permission to access this resource." } as const;
  }

  return { user } as const;
}

export async function getAdminDashboardData(range: "7d" | "30d" | "90d" | "12m" = "30d") {
  const now = new Date();
  const revenueRange = normalizeRevenueRange(range);

  const [
    totalUsers,
    totalOwners,
    totalRenters,
    totalAdmins,
    activeUsers,
    pendingVerificationUsers,
    totalListings,
    activeListings,
    pendingListings,
    rejectedListings,
    totalBookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    totalRevenueAggregate,
    monthlyRevenueAggregate,
    paidPaymentsCount,
    failedPaymentsCount,
    totalInvoices,
    outstandingInvoices,
    signedContracts,
    unsignedContracts,
    unreadOrRecentMessagesCount,
    revenue,
    recentActivityPage,
    marketInsights,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.OWNER } }),
    prisma.user.count({ where: { role: UserRole.RENTER } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
    prisma.user.count({ where: { status: AccountStatus.PENDING_VERIFICATION } }),
    prisma.listing.count(),
    prisma.listing.count({
      where: { status: ListingStatus.APPROVED, isPublished: true },
    }),
    prisma.listing.count({ where: { status: ListingStatus.PENDING_APPROVAL } }),
    prisma.listing.count({ where: { status: ListingStatus.REJECTED } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({
      where: { status: { in: [BookingStatus.APPROVED, BookingStatus.ACTIVE] } },
    }),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.PAID },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID,
        createdAt: {
          gte: startOfMonth(now),
          lt: addMonths(startOfMonth(now), 1),
        },
      },
    }),
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.invoice.count(),
    prisma.invoice.count({
      where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] } },
    }),
    prisma.contract.count({ where: { status: ContractStatus.SIGNED } }),
    prisma.contract.count({
      where: { status: { notIn: [ContractStatus.SIGNED, ContractStatus.CANCELLED] } },
    }),
    prisma.message.count({
      where: {
        createdAt: {
          gte: addDays(startOfDay(now), -7),
        },
      },
    }),
    getRevenueAnalytics(revenueRange),
    getRecentActivityFeed({ page: 1, limit: 3 }),
    getMarketInsights(),
  ]);

  return {
    totalUsers,
    totalOwners,
    totalRenters,
    totalAdmins,
    activeUsers,
    pendingVerificationUsers,
    totalListings,
    activeListings,
    pendingListings,
    rejectedListings,
    totalBookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    totalRevenue: toCurrencyString(totalRevenueAggregate._sum.amount),
    monthlyRevenue: toCurrencyString(monthlyRevenueAggregate._sum.amount),
    paidPaymentsCount,
    failedPaymentsCount,
    totalInvoices,
    outstandingInvoices,
    signedContracts,
    unsignedContracts,
    unreadOrRecentMessagesCount,
    recentActivity: recentActivityPage.rows,
    revenueSeries: revenue.series,
    marketInsights,
  } satisfies AdminDashboardResponse;
}

export async function getRevenueAnalytics(range: "7d" | "30d" | "90d" | "12m" = "30d") {
  const now = new Date();
  const normalizedRange = normalizeRevenueRange(range);
  const { start, end, labels } = buildRevenueBuckets(normalizedRange, now);

  const paidPaymentsWindow = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  const values = labels.map(() => 0);

  for (const payment of paidPaymentsWindow) {
    const index = bucketIndexForDate(payment.createdAt, normalizedRange, start, labels.length);
    if (index >= 0 && index < values.length) {
      values[index] += decimalToNumber(payment.amount);
    }
  }

  const [totalRevenueAggregate, monthlyRevenueAggregate, paidPaymentsCount, failedPaymentsCount, outstandingInvoices] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.PAID,
          createdAt: {
            gte: startOfMonth(now),
            lt: addMonths(startOfMonth(now), 1),
          },
        },
      }),
      prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
      prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      prisma.invoice.count({
        where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] } },
      }),
    ]);

  return {
    labels,
    values,
    series: labels.map((label, index) => ({
      label,
      value: values[index] ?? 0,
    })),
    totalRevenue: toCurrencyString(totalRevenueAggregate._sum.amount),
    monthlyRevenue: toCurrencyString(monthlyRevenueAggregate._sum.amount),
    paidPayments: paidPaymentsCount,
    failedPayments: failedPaymentsCount,
    outstandingInvoices,
    paidPaymentsCount,
    failedPaymentsCount,
  };
}

function normalizeRevenueRange(range: "7d" | "30d" | "90d" | "12m") {
  if (range === "7d" || range === "30d" || range === "90d" || range === "12m") {
    return range;
  }

  return "30d";
}

function buildRevenueBuckets(range: "7d" | "30d" | "90d" | "12m", now: Date) {
  if (range === "12m") {
    const start = startOfMonth(addMonths(now, -11));
    const labels: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      labels.push(formatMonthLabel(addMonths(start, i)));
    }
    return { start, end: addMonths(startOfMonth(now), 1), labels };
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const start = startOfDay(addDays(now, -(days - 1)));
  const labels: string[] = [];
  for (let i = 0; i < days; i += 1) {
    labels.push(formatShortDay(addDays(start, i)));
  }

  return { start, end: addDays(startOfDay(now), 1), labels };
}

function bucketIndexForDate(date: Date, range: "7d" | "30d" | "90d" | "12m", start: Date, bucketCount: number) {
  if (range === "12m") {
    return (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  }

  const diff = startOfDay(date).getTime() - start.getTime();
  const dayIndex = Math.floor(diff / (24 * 60 * 60 * 1000));
  return dayIndex >= 0 && dayIndex < bucketCount ? dayIndex : -1;
}

export async function getRecentActivityFeed(params: {
  page: number;
  limit: number;
  entityType?: AdminEntityType;
  search?: string;
}) {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, Math.min(100, params.limit));
  const search = normalizeSearch(params.search);

  const logWhere: Prisma.AdminLogWhereInput = {};

  if (params.entityType) {
    logWhere.entityType = params.entityType;
  }

  if (search) {
    logWhere.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      {
        admin: {
          fullName: { contains: search, mode: "insensitive" },
        },
      },
      {
        targetUser: {
          fullName: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const logCount = await prisma.adminLog.count({ where: logWhere });

  if (logCount > 0) {
    const logs = await prisma.adminLog.findMany({
      where: logWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: { fullName: true, email: true },
        },
        targetUser: {
          select: { fullName: true, email: true },
        },
      },
    });

    const rows = logs.map((log) =>
      makeActivityRow({
        id: log.id,
        name:
          detailsToName(log.details) ??
          log.targetUser?.fullName ??
          log.admin.fullName ??
          log.action,
        entityId: log.entityId ?? log.id,
        entityType: log.entityType,
        status: getStatusLabelFromEntity(log.entityType, log.action, log.details),
        date: log.createdAt,
        action: log.action,
      }),
    );

    return {
      rows,
      page,
      limit,
      totalItems: logCount,
      totalPages: Math.max(1, Math.ceil(logCount / limit)),
    } satisfies AdminActivityPage;
  }

  const synthesized = await synthesizeActivityFeed();
  const filtered = synthesized.filter((row) => {
    if (params.entityType && row.entityType !== params.entityType) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = `${row.name} ${row.entityId} ${row.status} ${row.action} ${row.type}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const totalItems = filtered.length;
  const start = (page - 1) * limit;
  const rows = filtered.slice(start, start + limit);

  return {
    rows,
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  } satisfies AdminActivityPage;
}

function detailsToName(details: Prisma.JsonValue | null | undefined) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  const record = details as Record<string, unknown>;
  const keys = ["entityName", "title", "fullName", "fileName", "bookingNumber", "invoiceNumber"];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

async function synthesizeActivityFeed() {
  const [users, listings, documents, bookings] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        role: true,
        status: true,
      },
    }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        owner: {
          select: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    }),
    prisma.verificationDocument.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        listing: {
          select: { title: true },
        },
      },
    }),
  ]);

  const rows = [
    ...users.map((user) => ({
      createdAt: user.createdAt,
      row: makeActivityRow({
        id: user.id,
        name: user.fullName,
        entityId: user.id,
        entityType: AdminEntityType.USER,
        status:
          user.status === AccountStatus.ACTIVE
            ? "Verified"
            : user.status === AccountStatus.PENDING_VERIFICATION
              ? "Pending"
              : "Updated",
        date: user.createdAt,
        action: "USER_CREATED",
      }),
    })),
    ...listings.map((listing) => ({
      createdAt: listing.createdAt,
      row: makeActivityRow({
        id: listing.id,
        name: listing.title,
        entityId: listing.id,
        entityType: AdminEntityType.LISTING,
        status:
          listing.status === ListingStatus.APPROVED
            ? "Approved"
            : listing.status === ListingStatus.PENDING_APPROVAL
              ? "Pending"
              : listing.status === ListingStatus.REJECTED
                ? "Rejected"
                : "Updated",
        date: listing.createdAt,
        action: `LISTING_${listing.status}`,
      }),
    })),
    ...documents.map((document) => ({
      createdAt: document.createdAt,
      row: makeActivityRow({
        id: document.id,
        name: document.fileName ?? verificationDocumentTypeLabels[document.type],
        entityId: document.id,
        entityType: AdminEntityType.VERIFICATION_DOCUMENT,
        status:
          document.status === VerificationStatus.APPROVED
            ? "Approved"
            : document.status === VerificationStatus.PENDING
              ? "Pending"
              : document.status === VerificationStatus.REJECTED
                ? "Rejected"
                : "Updated",
        date: document.createdAt,
        action: `VERIFICATION_${document.status}`,
      }),
    })),
    ...bookings.map((booking) => ({
      createdAt: booking.createdAt,
      row: makeActivityRow({
        id: booking.id,
        name: booking.listing?.title ?? booking.bookingNumber,
        entityId: booking.id,
        entityType: AdminEntityType.BOOKING,
        status:
          booking.status === BookingStatus.APPROVED
            ? "Approved"
            : booking.status === BookingStatus.ACTIVE
              ? "Active"
              : booking.status === BookingStatus.COMPLETED
                ? "Completed"
                : booking.status === BookingStatus.REJECTED
                  ? "Rejected"
                  : "Pending",
        date: booking.createdAt,
        action: `BOOKING_${booking.status}`,
      }),
    })),
  ];

  return rows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((item) => item.row)
    .slice(0, 20);
}

async function getMarketInsights(): Promise<AdminMarketInsight[]> {
  const cities = await prisma.listing.groupBy({
    by: ["city"],
    where: {
      status: ListingStatus.APPROVED,
      isPublished: true,
    },
    _count: {
      city: true,
    },
    orderBy: {
      _count: {
        city: "desc",
      },
    },
    take: 2,
  });

  if (!cities.length) {
    return [
      {
        label: "Market Insights",
        value: "No published listings yet.",
        note: "Insights will appear once the marketplace has active inventory.",
      },
    ];
  }

  return cities.map((city) => ({
    label: city.city,
    value: `${city._count.city} active listings`,
    note: "Across approved inventory",
  }));
}

export async function getAdminUsers(params: {
  page: number;
  limit: number;
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
}) {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, Math.min(100, params.limit));
  const search = normalizeSearch(params.search);

  const where: Prisma.UserWhereInput = {};

  if (params.role) {
    where.role = params.role;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        ownerProfile: {
          select: {
            verificationStatus: true,
          },
        },
        renterProfile: {
          select: {
            verificationStatus: true,
          },
        },
      },
    }),
  ]);

  return {
    rows: users,
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  };
}

export async function getAdminListings(params: {
  page: number;
  limit: number;
  status?: ListingStatus;
  search?: string;
}) {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, Math.min(100, params.limit));
  const search = normalizeSearch(params.search);

  const where: Prisma.ListingWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      {
        owner: {
          user: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [totalItems, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        city: true,
        pricePerMonth: true,
        status: true,
        availability: true,
        isPublished: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    rows: listings,
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  };
}

export async function getAdminVerifications(params: {
  page: number;
  limit: number;
  status?: VerificationStatus;
  type?: DocumentType;
  search?: string;
}) {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, Math.min(100, params.limit));
  const search = normalizeSearch(params.search);

  const where: Prisma.VerificationDocumentWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.type) {
    where.type = params.type;
  }

  if (search) {
    where.OR = [
      { fileName: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [totalItems, documents] = await Promise.all([
    prisma.verificationDocument.count({ where }),
    prisma.verificationDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        fileName: true,
        fileUrl: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            ownerProfile: {
              select: { verificationStatus: true },
            },
            renterProfile: {
              select: { verificationStatus: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    rows: documents,
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
  };
}

async function recalculateUserVerificationState(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      ownerProfile: {
        select: {
          id: true,
          verificationStatus: true,
        },
      },
      renterProfile: {
        select: {
          id: true,
          verificationStatus: true,
        },
      },
      uploadedDocuments: {
        select: {
          type: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const requiredDocuments = requiredDocumentTypesForRole(user.role);
  const requiredSets = requiredDocuments.map((type) => {
    const matching = user.uploadedDocuments.filter((document) => document.type === type);
    const approved = matching.some((document) => document.status === VerificationStatus.APPROVED);
    const pending = matching.some((document) => document.status === VerificationStatus.PENDING);
    const rejected = matching.some((document) => document.status === VerificationStatus.REJECTED);
    return { type, approved, pending, rejected, hasAny: matching.length > 0 };
  });

  const hasAnyDocuments = user.uploadedDocuments.length > 0;
  const allApproved = requiredSets.every((item) => item.approved);
  const hasPending = requiredSets.some((item) => item.pending || !item.hasAny);
  const hasRejected = requiredSets.some((item) => item.rejected);

  let profileStatus: VerificationStatus = VerificationStatus.NOT_SUBMITTED;
  if (allApproved) {
    profileStatus = VerificationStatus.APPROVED;
  } else if (!hasAnyDocuments) {
    profileStatus = VerificationStatus.NOT_SUBMITTED;
  } else if (hasPending) {
    profileStatus = VerificationStatus.PENDING;
  } else if (hasRejected) {
    profileStatus = VerificationStatus.REJECTED;
  }

  const accountStatus = allApproved
    ? AccountStatus.ACTIVE
    : AccountStatus.PENDING_VERIFICATION;

  await tx.user.update({
    where: { id: user.id },
    data: {
      status: accountStatus,
    },
  });

  if (user.ownerProfile) {
    await tx.ownerProfile.update({
      where: { id: user.ownerProfile.id },
      data: { verificationStatus: profileStatus },
    });
  }

  if (user.renterProfile) {
    await tx.renterProfile.update({
      where: { id: user.renterProfile.id },
      data: { verificationStatus: profileStatus },
    });
  }

  return {
    userId: user.id,
    role: user.role,
    profileStatus,
    accountStatus,
    allApproved,
    requiredDocuments,
  };
}

export async function approveListingForAdmin(listingId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        status: true,
        isPublished: true,
        owner: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!listing) {
      return { error: "Listing not found." } as const;
    }

    const updated = await tx.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.APPROVED,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        city: true,
        status: true,
        availability: true,
        isPublished: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        targetUserId: listing.owner.userId,
        entityType: AdminEntityType.LISTING,
        entityId: listing.id,
        action: "LISTING_APPROVED",
        details: {
          title: listing.title,
          status: "Approved",
        },
      },
    });

    return { listing: updated } as const;
  });
}

export async function rejectListingForAdmin(
  listingId: string,
  adminId: string,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        status: true,
        owner: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!listing) {
      return { error: "Listing not found." } as const;
    }

    const updated = await tx.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.REJECTED,
        isPublished: false,
      },
      select: {
        id: true,
        title: true,
        city: true,
        status: true,
        availability: true,
        isPublished: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        targetUserId: listing.owner.userId,
        entityType: AdminEntityType.LISTING,
        entityId: listing.id,
        action: "LISTING_REJECTED",
        details: {
          title: listing.title,
          status: "Rejected",
          reason: reason ?? "Rejected by admin",
        },
      },
    });

    return { listing: updated } as const;
  });
}

export async function approveVerificationDocumentForAdmin(
  documentId: string,
  adminId: string,
) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.verificationDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        type: true,
        fileName: true,
        status: true,
      },
    });

    if (!document) {
      return { error: "Verification document not found." } as const;
    }

    const updatedDocument = await tx.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: VerificationStatus.APPROVED,
        rejectionReason: null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      select: {
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
      },
    });

    const verificationState = await recalculateUserVerificationState(tx, document.userId);

    await tx.adminLog.create({
      data: {
        adminId,
        targetUserId: document.userId,
        entityType: AdminEntityType.VERIFICATION_DOCUMENT,
        entityId: document.id,
        action: "VERIFICATION_DOCUMENT_APPROVED",
        details: {
          fileName: document.fileName,
          documentType: document.type,
          status: "Approved",
        },
      },
    });

    return {
      document: serializeVerificationDocument(updatedDocument),
      verificationState,
    } as const;
  });
}

export async function rejectVerificationDocumentForAdmin(
  documentId: string,
  adminId: string,
  rejectionReason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.verificationDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        type: true,
        fileName: true,
        status: true,
      },
    });

    if (!document) {
      return { error: "Verification document not found." } as const;
    }

    const updatedDocument = await tx.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: VerificationStatus.REJECTED,
        rejectionReason: rejectionReason ?? "Rejected by admin",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      select: {
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
      },
    });

    const verificationState = await recalculateUserVerificationState(tx, document.userId);

    await tx.adminLog.create({
      data: {
        adminId,
        targetUserId: document.userId,
        entityType: AdminEntityType.VERIFICATION_DOCUMENT,
        entityId: document.id,
        action: "VERIFICATION_DOCUMENT_REJECTED",
        details: {
          fileName: document.fileName,
          documentType: document.type,
          status: "Rejected",
          reason: rejectionReason ?? "Rejected by admin",
        },
      },
    });

    return {
      document: serializeVerificationDocument(updatedDocument),
      verificationState,
    } as const;
  });
}

export function listVerificationDocumentsForUser(userId: string): Promise<VerificationDocumentView[]> {
  return prisma.verificationDocument
    .findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      select: {
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
      },
    })
    .then((documents) => documents.map((document) => serializeVerificationDocument(document)));
}
