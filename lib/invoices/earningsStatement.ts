import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EarningsRow = {
  paymentId: string;
  paidAt: string | null;
  bookingNumber: string;
  listingTitle: string;
  listingCity: string;
  renterName: string;
  renterEmail: string;
  grossAmount: string;
  platformCommission: string;
  ownerNet: string;
  currency: string;
  invoiceNumber: string | null;
  contractNumber: string | null;
  stripeChargeId: string | null;
};

export type WithdrawalRow = {
  id: string;
  amount: string;
  status: string;
  iban: string;
  bankName: string | null;
  accountHolder: string | null;
  paymentReference: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type EarningsStatement = {
  totalGross: string;
  totalCommission: string;
  totalNet: string;
  totalPaidOut: string;
  rows: EarningsRow[];
  withdrawals: WithdrawalRow[];
};

export async function getOwnerEarningsStatement(
  ownerProfileId: string,
): Promise<EarningsStatement> {
  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      booking: { ownerId: ownerProfileId },
    },
    orderBy: { paidAt: "desc" },
    select: {
      id: true,
      amount: true,
      platformCommission: true,
      ownerAmount: true,
      currency: true,
      paidAt: true,
      stripeChargeId: true,
      booking: {
        select: {
          bookingNumber: true,
          listing: { select: { title: true, city: true } },
          renter: {
            select: { user: { select: { fullName: true, email: true } } },
          },
          generatedContract: { select: { contractNumber: true } },
          invoices: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { invoiceNumber: true },
          },
        },
      },
    },
  });

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { ownerId: ownerProfileId },
    orderBy: { requestedAt: "desc" },
  });

  let totalGross = new Prisma.Decimal(0);
  let totalCommission = new Prisma.Decimal(0);
  let totalNet = new Prisma.Decimal(0);

  const rows: EarningsRow[] = payments.map((p) => {
    totalGross = totalGross.add(p.amount);
    totalCommission = totalCommission.add(p.platformCommission);
    totalNet = totalNet.add(p.ownerAmount);

    return {
      paymentId: p.id,
      paidAt: p.paidAt?.toISOString() ?? null,
      bookingNumber: p.booking.bookingNumber,
      listingTitle: p.booking.listing.title,
      listingCity: p.booking.listing.city,
      renterName: p.booking.renter.user.fullName,
      renterEmail: p.booking.renter.user.email,
      grossAmount: p.amount.toFixed(2),
      platformCommission: p.platformCommission.toFixed(2),
      ownerNet: p.ownerAmount.toFixed(2),
      currency: p.currency,
      invoiceNumber: p.booking.invoices[0]?.invoiceNumber ?? null,
      contractNumber: p.booking.generatedContract?.contractNumber ?? null,
      stripeChargeId: p.stripeChargeId ?? null,
    };
  });

  const totalPaidOut = withdrawals
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum.add(w.amount), new Prisma.Decimal(0));

  return {
    totalGross: totalGross.toFixed(2),
    totalCommission: totalCommission.toFixed(2),
    totalNet: totalNet.toFixed(2),
    totalPaidOut: totalPaidOut.toFixed(2),
    rows,
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount.toFixed(2),
      status: w.status,
      iban: w.iban,
      bankName: w.bankName,
      accountHolder: w.accountHolder,
      paymentReference: w.paymentReference,
      adminNote: w.adminNote,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt?.toISOString() ?? null,
    })),
  };
}
