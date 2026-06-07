import { Prisma, WithdrawalStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createNotificationForUser } from "@/lib/notifications";

// Statuses that allow admin to act on a withdrawal.
const ACTIONABLE_STATUSES: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.PROCESSING,
];

export type WithdrawalRecord = {
  id: string;
  ownerId: string;
  amount: string;
  status: WithdrawalStatus;
  iban: string;
  bankName: string | null;
  accountHolder: string | null;
  adminNote: string | null;
  paymentReference: string | null;
  requestedAt: string;
  processedAt: string | null;
  processedById: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeWithdrawal(w: {
  id: string;
  ownerId: string;
  amount: Prisma.Decimal;
  status: WithdrawalStatus;
  iban: string;
  bankName: string | null;
  accountHolder: string | null;
  adminNote: string | null;
  paymentReference: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  processedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WithdrawalRecord {
  return {
    id: w.id,
    ownerId: w.ownerId,
    amount: w.amount.toFixed(2),
    status: w.status,
    iban: w.iban,
    bankName: w.bankName,
    accountHolder: w.accountHolder,
    adminNote: w.adminNote,
    paymentReference: w.paymentReference,
    requestedAt: w.requestedAt.toISOString(),
    processedAt: w.processedAt?.toISOString() ?? null,
    processedById: w.processedById,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

// Create a withdrawal request inside a transaction to prevent over-drawing.
export async function createWithdrawalRequest(params: {
  ownerProfileId: string;
  ownerUserId: string;
  amount: Prisma.Decimal;
  iban: string;
  bankName?: string | null;
  accountHolder?: string | null;
}) {
  if (params.amount.lte(0)) {
    return { error: "Withdrawal amount must be greater than zero." } as const;
  }

  const ibanTrimmed = params.iban.trim();
  if (!ibanTrimmed) {
    return { error: "Please provide a valid IBAN." } as const;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Re-read walletBalance inside the transaction to prevent race conditions.
    const profile = await tx.ownerProfile.findUnique({
      where: { id: params.ownerProfileId },
      select: {
        walletBalance: true,
        iban: true,
        bankName: true,
        accountHolder: true,
      },
    });

    if (!profile) {
      return { error: "Owner profile not found." } as const;
    }

    if (params.amount.gt(profile.walletBalance)) {
      return {
        error: `Insufficient balance. Available: €${profile.walletBalance.toFixed(2)}.`,
      } as const;
    }

    // Deduct from available wallet balance.
    await tx.ownerProfile.update({
      where: { id: params.ownerProfileId },
      data: {
        walletBalance: { decrement: params.amount },
        // Save bank details for future pre-filling.
        iban: ibanTrimmed,
        bankName: params.bankName ?? profile.bankName,
        accountHolder: params.accountHolder ?? profile.accountHolder,
      },
    });

    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        ownerId: params.ownerProfileId,
        amount: params.amount,
        status: WithdrawalStatus.REQUESTED,
        iban: ibanTrimmed,
        bankName: params.bankName ?? null,
        accountHolder: params.accountHolder ?? null,
      },
    });

    return { withdrawal } as const;
  });

  if ("error" in result) {
    return result;
  }

  await createNotificationForUser({
    userId: params.ownerUserId,
    title: "Withdrawal requested",
    body: `Your withdrawal request of €${params.amount.toFixed(2)} has been submitted and is being reviewed.`,
    linkUrl: "/owner/wallet",
  });

  return { withdrawal: serializeWithdrawal(result.withdrawal) } as const;
}

// Owner cancels their own withdrawal request (REQUESTED → CANCELLED).
export async function cancelWithdrawalRequest(params: {
  withdrawalId: string;
  ownerProfileId: string;
  ownerUserId: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: params.withdrawalId },
    });

    if (!withdrawal) {
      return { error: "Withdrawal request not found." } as const;
    }

    if (withdrawal.ownerId !== params.ownerProfileId) {
      return { error: "You can only cancel your own withdrawal requests." } as const;
    }

    if (withdrawal.status !== WithdrawalStatus.REQUESTED) {
      return {
        error: "Only requests with status REQUESTED can be cancelled.",
      } as const;
    }

    await tx.withdrawalRequest.update({
      where: { id: params.withdrawalId },
      data: {
        status: WithdrawalStatus.CANCELLED,
        processedAt: new Date(),
      },
    });

    // Return the amount to available wallet balance.
    await tx.ownerProfile.update({
      where: { id: params.ownerProfileId },
      data: { walletBalance: { increment: withdrawal.amount } },
    });

    return { cancelled: true } as const;
  });

  if ("error" in result) {
    return result;
  }

  await createNotificationForUser({
    userId: params.ownerUserId,
    title: "Withdrawal cancelled",
    body: "Your withdrawal request has been cancelled and the amount has been returned to your balance.",
    linkUrl: "/owner/wallet",
  });

  return result;
}

// List all withdrawal requests for an owner.
export async function listWithdrawalsForOwner(ownerProfileId: string) {
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { ownerId: ownerProfileId },
    orderBy: [{ requestedAt: "desc" }],
  });

  return withdrawals.map(serializeWithdrawal);
}

// Admin: list withdrawal requests with optional status filter.
export type AdminWithdrawalRow = WithdrawalRecord & {
  ownerName: string;
  ownerEmail: string;
};

export async function listWithdrawalsForAdmin(params?: {
  status?: WithdrawalStatus;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: Prisma.WithdrawalRequestWhereInput = params?.status
    ? { status: params.status }
    : {};

  const [total, withdrawals] = await prisma.$transaction([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ requestedAt: "asc" }],
      include: {
        owner: {
          select: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    withdrawals: withdrawals.map((w) => ({
      ...serializeWithdrawal(w),
      ownerName: w.owner.user.fullName,
      ownerEmail: w.owner.user.email,
    })),
  };
}

// Admin: mark a request as PROCESSING (intermediate step, no balance change).
export async function markWithdrawalProcessing(
  withdrawalId: string,
  adminId: string,
) {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { owner: { select: { user: { select: { id: true } } } } },
  });

  if (!withdrawal) {
    return { error: "Withdrawal request not found." } as const;
  }

  if (withdrawal.status !== WithdrawalStatus.REQUESTED) {
    return { error: "Only REQUESTED withdrawals can be marked as processing." } as const;
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: {
      status: WithdrawalStatus.PROCESSING,
      processedById: adminId,
    },
  });

  await createNotificationForUser({
    userId: withdrawal.owner.user.id,
    title: "Withdrawal processing",
    body: `Your withdrawal of €${withdrawal.amount.toFixed(2)} is now being processed.`,
    linkUrl: "/owner/wallet",
  });

  return { withdrawal: serializeWithdrawal(updated) } as const;
}

// Admin: mark a request as PAID (REQUESTED or PROCESSING → PAID).
// No walletBalance change — was already deducted on creation.
export async function markWithdrawalPaid(
  withdrawalId: string,
  adminId: string,
  paymentReference?: string,
) {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { owner: { select: { user: { select: { id: true } } } } },
  });

  if (!withdrawal) {
    return { error: "Withdrawal request not found." } as const;
  }

  if (!ACTIONABLE_STATUSES.includes(withdrawal.status)) {
    return {
      error: "Only REQUESTED or PROCESSING withdrawals can be marked as paid.",
    } as const;
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: {
      status: WithdrawalStatus.PAID,
      processedAt: new Date(),
      processedById: adminId,
      paymentReference: paymentReference ?? null,
    },
  });

  await createNotificationForUser({
    userId: withdrawal.owner.user.id,
    title: "Withdrawal paid",
    body: `Your withdrawal of €${withdrawal.amount.toFixed(2)} has been paid.${
      paymentReference ? ` Reference: ${paymentReference}.` : ""
    }`,
    linkUrl: "/owner/wallet",
  });

  return { withdrawal: serializeWithdrawal(updated) } as const;
}

// Admin: reject a request (REQUESTED or PROCESSING → REJECTED).
// Returns the amount to walletBalance.
export async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  adminNote?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { owner: { select: { user: { select: { id: true } } } } },
    });

    if (!withdrawal) {
      return { error: "Withdrawal request not found." } as const;
    }

    if (!ACTIONABLE_STATUSES.includes(withdrawal.status)) {
      return {
        error: "Only REQUESTED or PROCESSING withdrawals can be rejected.",
      } as const;
    }

    await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        processedAt: new Date(),
        processedById: adminId,
        adminNote: adminNote ?? null,
      },
    });

    // Return the amount to available wallet balance.
    await tx.ownerProfile.update({
      where: { id: withdrawal.ownerId },
      data: { walletBalance: { increment: withdrawal.amount } },
    });

    return { ownerId: withdrawal.owner.user.id, amount: withdrawal.amount } as const;
  });

  if ("error" in result) {
    return result;
  }

  await createNotificationForUser({
    userId: result.ownerId,
    title: "Withdrawal rejected",
    body: adminNote
      ? `Your withdrawal of €${result.amount.toFixed(2)} was rejected: ${adminNote}`
      : `Your withdrawal of €${result.amount.toFixed(2)} was rejected. The amount has been returned to your balance.`,
    linkUrl: "/owner/wallet",
  });

  return { success: true } as const;
}

// Read owner wallet summary directly from OwnerProfile + pending withdrawal sum.
export async function getOwnerWalletSummary(ownerProfileId: string) {
  const [profile, pendingSum] = await prisma.$transaction([
    prisma.ownerProfile.findUnique({
      where: { id: ownerProfileId },
      select: {
        walletBalance: true,
        pendingPayout: true,
        totalEarnings: true,
        iban: true,
        bankName: true,
        accountHolder: true,
        bicSwift: true,
      },
    }),
    prisma.withdrawalRequest.aggregate({
      where: {
        ownerId: ownerProfileId,
        status: { in: [WithdrawalStatus.REQUESTED, WithdrawalStatus.PROCESSING] },
      },
      _sum: { amount: true },
    }),
  ]);

  if (!profile) {
    return null;
  }

  const pendingWithdrawals = pendingSum._sum.amount ?? new Prisma.Decimal(0);

  return {
    walletBalance: profile.walletBalance.toFixed(2),
    pendingPayout: profile.pendingPayout.toFixed(2),
    totalEarnings: profile.totalEarnings.toFixed(2),
    pendingWithdrawals: pendingWithdrawals.toFixed(2),
    iban: profile.iban,
    bankName: profile.bankName,
    accountHolder: profile.accountHolder,
    bicSwift: profile.bicSwift,
  };
}
