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
  recentInvoices: SafeInvoice[];
  totalEarnings: string;
  earningsGrowthPercent: number;
  activeListingsCount: number;
  tenantActivityCount: number;
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
  const [ownerListings, ownerBookings, invoicesResult, payments, unsignedContractsCount] =
    await Promise.all([
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
          amount: true,
          ownerAmount: true,
          paidAt: true,
          createdAt: true,
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
    ]);

  const activeListings = ownerListings.filter(
    (listing) => listing.status === "APPROVED" && listing.isPublished,
  );
  const pendingBookings = ownerBookings.filter(
    (booking) => booking.status === "PENDING",
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

  const currentMonthStart = toUtcMonthStart(new Date());
  const currentMonthEnd = addMonths(currentMonthStart, 1);
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
    recentInvoices: invoicesResult.invoices.slice(0, 3),
    totalEarnings: formatMoneyAmount(new Prisma.Decimal(totalEarnings)),
    earningsGrowthPercent: getRevenueGrowthPercentage(revenueSeries),
    activeListingsCount: activeListings.length,
    tenantActivityCount: pendingBookings.length,
    pendingPayoutAmount: formatMoneyAmount(new Prisma.Decimal(pendingPayoutAmount)),
    pendingPayoutReleaseDate: getNextPayoutDate(new Date()).toISOString(),
    unsignedContractsCount,
    revenueSeries,
    revenueLinePath: revenuePaths.linePath,
    revenueAreaPath: revenuePaths.areaPath,
  };
}

