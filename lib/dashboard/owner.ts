import { ContractStatus, PaymentStatus, Prisma } from "@prisma/client";

import { getOwnerBookings } from "@/lib/bookings";
import { getInvoicesForViewer, type SafeInvoice } from "@/lib/invoices/generateInvoice";
import { getOwnerListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import {
  buildMonthlyRevenueSeries,
  buildRevenuePaths,
  formatMoneyAmount,
  getNextPayoutDate,
  getRevenueGrowthPercentage,
  type RevenuePoint,
} from "@/lib/dashboard/revenue";

type OwnerListing = Awaited<ReturnType<typeof getOwnerListings>>[number];
type OwnerBooking = Awaited<ReturnType<typeof getOwnerBookings>>[number];

export type OwnerDashboardSnapshot = {
  ownerListings: OwnerListing[];
  ownerBookings: OwnerBooking[];
  pendingBookings: OwnerBooking[];
  activeBookings: OwnerBooking[];
  signedContractsCount: number;
  recentSignedContracts: Array<{
    id: string;
    contractNumber: string;
    status: string;
    fullySignedAt: string | null;
    updatedAt: string;
    bookingNumber: string;
    bookingTitle: string;
    bookingAddress: string;
    bookingCity: string;
  }>;
  payoutHistory: Array<{
    id: string;
    amount: string;
    ownerAmount: string;
    paidAt: string | null;
    createdAt: string;
    bookingNumber: string;
    bookingTitle: string;
    bookingAddress: string;
    bookingCity: string;
  }>;
  recentInvoices: SafeInvoice[];
  totalEarnings: string;
  monthlyEarningsAmount: string;
  earningsGrowthPercent: number;
  activeListingsCount: number;
  occupancyRatePercent: number;
  tenantActivityCount: number;
  pendingPaymentsAmount: string;
  pendingPayoutAmount: string;
  pendingPayoutReleaseDate: string;
  unsignedContractsCount: number;
  revenueSeries: RevenuePoint[];
  revenueLinePath: string;
  revenueAreaPath: string;
};

function toUtcMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function getPaymentReferenceDate(payment: {
  paidAt: Date | null;
  createdAt: Date;
}) {
  return payment.paidAt ?? payment.createdAt;
}

export async function getOwnerDashboardSnapshot(ownerProfileId: string) {
  const currentMonthStart = toUtcMonthStart(new Date());
  const currentMonthEnd = addMonths(currentMonthStart, 1);

  const [
    ownerListings,
    ownerBookings,
    invoicesResult,
    payments,
    unsignedContractsCount,
    signedContractsCount,
    recentSignedContracts,
  ] = await Promise.all([
    getOwnerListings(ownerProfileId),
    getOwnerBookings(ownerProfileId),
    getInvoicesForViewer(
      {
        role: "OWNER",
        ownerProfileId,
        renterProfileId: null,
      },
      {
        pageSize: 3,
      },
    ),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        booking: {
          ownerId: ownerProfileId,
        },
      },
      select: {
        id: true,
        amount: true,
        ownerAmount: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            bookingNumber: true,
            listing: {
              select: {
                title: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.contract.count({
      where: {
        ownerId: ownerProfileId,
        status: {
          notIn: [ContractStatus.SIGNED, ContractStatus.CANCELLED],
        },
      },
    }),
    prisma.contract.count({
      where: {
        ownerId: ownerProfileId,
        status: ContractStatus.SIGNED,
      },
    }),
    prisma.contract.findMany({
      where: {
        ownerId: ownerProfileId,
        status: ContractStatus.SIGNED,
      },
      orderBy: [{ fullySignedAt: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        contractNumber: true,
        status: true,
        fullySignedAt: true,
        updatedAt: true,
        booking: {
          select: {
            bookingNumber: true,
            listing: {
              select: {
                title: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const activeListings = ownerListings.filter(
    (listing) => listing.status === "APPROVED" && listing.isPublished,
  );
  const pendingBookings = ownerBookings.filter(
    (booking) => booking.status === "PENDING",
  );
  const activeBookings = ownerBookings.filter(
    (booking) => booking.status === "ACTIVE",
  );

  const revenueSeries = buildMonthlyRevenueSeries(payments, 6, new Date());
  const revenuePaths = buildRevenuePaths(revenueSeries, {
    width: 1000,
    height: 200,
    topPadding: 20,
    bottomPadding: 20,
  });

  const totalEarnings = payments.reduce(
    (sum, payment) => sum + Number(payment.ownerAmount),
    0,
  );

  const monthlyEarningsAmount = payments.reduce((sum, payment) => {
    const referenceDate = getPaymentReferenceDate(payment);
    if (referenceDate < currentMonthStart || referenceDate >= currentMonthEnd) {
      return sum;
    }

    return sum + Number(payment.ownerAmount);
  }, 0);

  const pendingPayoutAmount = payments.reduce((sum, payment) => {
    const referenceDate = getPaymentReferenceDate(payment);
    if (referenceDate < currentMonthStart || referenceDate >= currentMonthEnd) {
      return sum;
    }

    return sum + Number(payment.ownerAmount);
  }, 0);

  return {
    ownerListings,
    ownerBookings,
    pendingBookings,
    activeBookings,
    signedContractsCount,
    recentSignedContracts: recentSignedContracts.map((contract) => ({
      id: contract.id,
      contractNumber: contract.contractNumber,
      status: contract.status,
      fullySignedAt: contract.fullySignedAt?.toISOString() ?? null,
      updatedAt: contract.updatedAt.toISOString(),
      bookingNumber: contract.booking.bookingNumber,
      bookingTitle: contract.booking.listing.title,
      bookingAddress: contract.booking.listing.address,
      bookingCity: contract.booking.listing.city,
    })),
    payoutHistory: payments.slice(0, 5).map((payment) => ({
      id: payment.id,
      amount: formatMoneyAmount(payment.amount),
      ownerAmount: formatMoneyAmount(payment.ownerAmount),
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      bookingNumber: payment.booking.bookingNumber,
      bookingTitle: payment.booking.listing.title,
      bookingAddress: payment.booking.listing.address,
      bookingCity: payment.booking.listing.city,
    })),
    recentInvoices: invoicesResult.invoices.slice(0, 3),
    totalEarnings: formatMoneyAmount(new Prisma.Decimal(totalEarnings)),
    monthlyEarningsAmount: formatMoneyAmount(new Prisma.Decimal(monthlyEarningsAmount)),
    earningsGrowthPercent: getRevenueGrowthPercentage(revenueSeries),
    activeListingsCount: activeListings.length,
    occupancyRatePercent:
      ownerListings.length > 0 ? (activeBookings.length / ownerListings.length) * 100 : 0,
    tenantActivityCount: pendingBookings.length,
    pendingPaymentsAmount: invoicesResult.summary.openAmount,
    pendingPayoutAmount: formatMoneyAmount(new Prisma.Decimal(pendingPayoutAmount)),
    pendingPayoutReleaseDate: getNextPayoutDate(new Date()).toISOString(),
    unsignedContractsCount,
    revenueSeries,
    revenueLinePath: revenuePaths.linePath,
    revenueAreaPath: revenuePaths.areaPath,
  };
}
