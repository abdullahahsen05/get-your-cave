import "dotenv/config";

import {
  AccountStatus,
  BookingStatus,
  InvoiceStatus,
  ListingStatus,
  PaymentStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MAX_ROWS = 5;

function formatCountMap<T extends string, K extends string>(
  label: string,
  values: readonly T[],
  rows: Array<{ _count: { _all: number } } & Record<K, T>>,
  key: K,
) {
  const map = new Map<T, number>();
  for (const row of rows) {
    map.set(row[key], row._count._all);
  }

  console.log(`  ${label}:`);
  for (const value of values) {
    console.log(`    - ${value}: ${map.get(value) ?? 0}`);
  }
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  return typeof value === "object" && "toString" in value
    ? (value as { toString(): string }).toString()
    : String(value);
}

function truncate(value: string | null | undefined, length = 64) {
  if (!value) {
    return "—";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, length - 1))}…`;
}

function printSection(title: string) {
  console.log("");
  console.log(`== ${title} ==`);
}

async function printUsers() {
  printSection("Users");

  const [totalUsers, roleRows, accountRows] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total users: ${totalUsers}`);
  formatCountMap("By role", Object.values(UserRole), roleRows, "role");
  formatCountMap("By account status", Object.values(AccountStatus), accountRows, "status");

  const latestUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  console.log("  Latest users:");
  latestUsers.forEach((user, index) => {
    console.log(
      `    ${index + 1}. ${user.fullName} <${user.email}> | role=${user.role} | status=${user.status} | createdAt=${formatDate(user.createdAt)}`,
    );
  });
}

async function printProfiles() {
  printSection("Owner and renter profiles");

  const [ownerTotal, renterTotal, ownerRows, renterRows] = await Promise.all([
    prisma.ownerProfile.count(),
    prisma.renterProfile.count(),
    prisma.ownerProfile.groupBy({
      by: ["verificationStatus"],
      _count: { _all: true },
    }),
    prisma.renterProfile.groupBy({
      by: ["verificationStatus"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total owner profiles: ${ownerTotal}`);
  formatCountMap("Owner verification statuses", Object.values(VerificationStatus), ownerRows, "verificationStatus");
  console.log(`  Total renter profiles: ${renterTotal}`);
  formatCountMap("Renter verification statuses", Object.values(VerificationStatus), renterRows, "verificationStatus");

  const latestOwners = await prisma.ownerProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      verificationStatus: true,
      walletBalance: true,
      pendingPayout: true,
      totalEarnings: true,
      updatedAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  console.log("  Latest owner profiles:");
  latestOwners.forEach((profile, index) => {
    console.log(
      `    ${index + 1}. ${profile.user.fullName} <${profile.user.email}> | verification=${profile.verificationStatus} | wallet=${formatMoney(profile.walletBalance)} | pending=${formatMoney(profile.pendingPayout)} | earnings=${formatMoney(profile.totalEarnings)} | updatedAt=${formatDate(profile.updatedAt)}`,
    );
  });

  const latestRenters = await prisma.renterProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      verificationStatus: true,
      updatedAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  console.log("  Latest renter profiles:");
  latestRenters.forEach((profile, index) => {
    console.log(
      `    ${index + 1}. ${profile.user.fullName} <${profile.user.email}> | verification=${profile.verificationStatus} | updatedAt=${formatDate(profile.updatedAt)}`,
    );
  });
}

async function printListings() {
  printSection("Listings");

  const [totalListings, statusRows, publishedApprovedCount, archivedUnpublishedCount] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.listing.count({
      where: {
        status: ListingStatus.APPROVED,
        isPublished: true,
      },
    }),
    prisma.listing.count({
      where: {
        OR: [
          { status: ListingStatus.ARCHIVED },
          { isPublished: false },
        ],
      },
    }),
  ]);

  console.log(`  Total listings: ${totalListings}`);
  formatCountMap("By status", Object.values(ListingStatus), statusRows, "status");
  console.log(`  Approved + published count: ${publishedApprovedCount}`);
  console.log(`  Archived or unpublished count: ${archivedUnpublishedCount}`);

  const latestListings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      title: true,
      status: true,
      isPublished: true,
      availability: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      owner: {
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  console.log("  Latest listings:");
  latestListings.forEach((listing, index) => {
    const coords =
      listing.latitude !== null && listing.longitude !== null
        ? `${listing.latitude}, ${listing.longitude}`
        : "no";

    console.log(
      `    ${index + 1}. ${listing.title} | owner=${listing.owner.user.fullName} <${listing.owner.user.email}> | status=${listing.status} | published=${listing.isPublished} | availability=${listing.availability} | coords=${coords} | createdAt=${formatDate(listing.createdAt)}`,
    );
  });
}

async function printBookings() {
  printSection("Bookings");

  const [totalBookings, statusRows] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total bookings: ${totalBookings}`);
  formatCountMap("By status", Object.values(BookingStatus), statusRows, "status");

  const latestBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      monthlyPrice: true,
      totalMonthlyAmount: true,
      createdAt: true,
      updatedAt: true,
      listing: {
        select: {
          title: true,
        },
      },
      owner: {
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
      renter: {
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  console.log("  Latest bookings:");
  latestBookings.forEach((booking, index) => {
    console.log(
      `    ${index + 1}. ${booking.bookingNumber} | status=${booking.status} | renter=${booking.renter.user.fullName} <${booking.renter.user.email}> | owner=${booking.owner.user.fullName} <${booking.owner.user.email}> | listing=${booking.listing.title} | total=${formatMoney(booking.totalMonthlyAmount)} | createdAt=${formatDate(booking.createdAt)} | updatedAt=${formatDate(booking.updatedAt)}`,
    );
  });
}

async function printInvoices() {
  printSection("Invoices");

  const [totalInvoices, statusRows] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total invoices: ${totalInvoices}`);
  formatCountMap("By status", Object.values(InvoiceStatus), statusRows, "status");

  const latestInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalAmount: true,
      dueAt: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          listing: {
            select: {
              title: true,
            },
          },
          owner: {
            select: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          renter: {
            select: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("  Latest invoices:");
  latestInvoices.forEach((invoice, index) => {
    console.log(
      `    ${index + 1}. ${invoice.invoiceNumber} | status=${invoice.status} | booking=${invoice.booking.id} | renter=${invoice.booking.renter.user.fullName} <${invoice.booking.renter.user.email}> | owner=${invoice.booking.owner.user.fullName} <${invoice.booking.owner.user.email}> | total=${formatMoney(invoice.totalAmount)} | dueAt=${formatDate(invoice.dueAt)}`,
    );
  });
}

async function printPayments() {
  printSection("Payments");

  const [totalPayments, statusRows] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total payments: ${totalPayments}`);
  formatCountMap("By status", Object.values(PaymentStatus), statusRows, "status");

  const latestPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      status: true,
      amount: true,
      stripeCheckoutSessionId: true,
      stripePaymentIntentId: true,
      stripeChargeId: true,
      createdAt: true,
      updatedAt: true,
      invoice: {
        select: {
          id: true,
        },
      },
      booking: {
        select: {
          id: true,
        },
      },
    },
  });

  console.log("  Latest payments:");
  latestPayments.forEach((payment, index) => {
    console.log(
      `    ${index + 1}. ${payment.id} | status=${payment.status} | invoice=${payment.invoice?.id ?? "—"} | booking=${payment.booking.id} | amount=${formatMoney(payment.amount)} | session=${payment.stripeCheckoutSessionId ?? "—"} | intent=${payment.stripePaymentIntentId ?? "—"} | charge=${payment.stripeChargeId ?? "—"} | updatedAt=${formatDate(payment.updatedAt)}`,
    );
  });
}

async function printContracts() {
  printSection("Contracts");

  const [generatedCount, contractCount] = await Promise.all([
    prisma.generatedContract.count(),
    prisma.contract.count(),
  ]);

  console.log(`  Generated contracts count: ${generatedCount}`);
  console.log(`  Contracts count: ${contractCount}`);

  const latestGeneratedContracts = await prisma.generatedContract.findMany({
    orderBy: { generatedAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      bookingId: true,
      contractType: true,
      status: true,
      generatedFilePath: true,
      generatedFileName: true,
      generatedAt: true,
    },
  });

  console.log("  Latest generated contracts:");
  latestGeneratedContracts.forEach((contract, index) => {
    console.log(
      `    ${index + 1}. ${contract.id} | booking=${contract.bookingId} | type=${contract.contractType} | status=${contract.status} | file=${contract.generatedFilePath} | name=${contract.generatedFileName} | generatedAt=${formatDate(contract.generatedAt)}`,
    );
  });

  const latestContracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      bookingId: true,
      type: true,
      status: true,
      generatedPdfUrl: true,
      signedPdfUrl: true,
      createdAt: true,
    },
  });

  console.log("  Latest contracts:");
  latestContracts.forEach((contract, index) => {
    console.log(
      `    ${index + 1}. ${contract.id} | booking=${contract.bookingId} | type=${contract.type} | status=${contract.status} | generatedPdfUrl=${contract.generatedPdfUrl ?? "—"} | signedPdfUrl=${contract.signedPdfUrl ?? "—"} | createdAt=${formatDate(contract.createdAt)}`,
    );
  });
}

async function printVerificationDocuments() {
  printSection("Verification documents");

  const [totalDocuments, statusRows] = await Promise.all([
    prisma.verificationDocument.count(),
    prisma.verificationDocument.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log(`  Total verification documents: ${totalDocuments}`);
  formatCountMap(
    "By status",
    Object.values(VerificationStatus),
    statusRows,
    "status",
  );

  const latestDocuments = await prisma.verificationDocument.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      type: true,
      status: true,
      fileUrl: true,
      fileName: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log("  Latest verification documents:");
  latestDocuments.forEach((document, index) => {
    console.log(
      `    ${index + 1}. ${document.id} | user=${document.user.fullName} <${document.user.email}> | role=${document.user.role} | type=${document.type} | status=${document.status} | file=${document.fileUrl} | createdAt=${formatDate(document.createdAt)}`,
    );
  });
}

async function printMessaging() {
  printSection("Messaging");

  const [conversationsCount, messagesCount, latestMessages] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      select: {
        id: true,
        body: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  console.log(`  Conversations count: ${conversationsCount}`);
  console.log(`  Messages count: ${messagesCount}`);
  console.log("  Latest messages:");
  latestMessages.forEach((message, index) => {
    console.log(
      `    ${index + 1}. ${message.id} | conversation=${message.conversationId} | sender=${message.sender.fullName} <${message.sender.email}> | preview="${truncate(message.body, 80)}" | createdAt=${formatDate(message.createdAt)}`,
    );
  });
}

async function printAdminLogs() {
  printSection("Admin logs");

  const adminLogModel = prisma.adminLog;
  if (!adminLogModel) {
    console.log("  AdminLog model not available.");
    return;
  }

  const [totalLogs, latestLogs] = await Promise.all([
    prisma.adminLog.count(),
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
        admin: {
          select: {
            fullName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  console.log(`  Admin log count: ${totalLogs}`);
  console.log("  Latest admin actions:");
  latestLogs.forEach((log, index) => {
    console.log(
      `    ${index + 1}. ${log.id} | admin=${log.admin.fullName} <${log.admin.email}> | target=${log.targetUser ? `${log.targetUser.fullName} <${log.targetUser.email}>` : "—"} | entityType=${log.entityType} | entityId=${log.entityId ?? "—"} | action=${log.action} | details=${log.details ? JSON.stringify(log.details) : "—"} | createdAt=${formatDate(log.createdAt)}`,
    );
  });
}

function printManualChecklist() {
  printSection("Manual DB change checklist");
  [
    "Owner creates listing -> new Listing row, status PENDING_APPROVAL or DRAFT",
    "Admin approves listing -> Listing status APPROVED, isPublished true",
    "Admin rejects listing -> Listing status REJECTED, isPublished false",
    "Owner archives listing -> Listing status ARCHIVED, isPublished false",
    "Renter books listing -> new Booking row, status PENDING",
    "Owner accepts booking -> Booking status APPROVED, invoice created if current logic supports it",
    "Owner rejects booking -> Booking status REJECTED/CANCELLED",
    "Invoice generated -> new Invoice row and InvoiceItem rows if supported",
    "Renter pays invoice via Stripe webhook -> Payment PAID, Invoice PAID, Booking ACTIVE",
    "Contract generated/downloaded -> GeneratedContract/Contract exists",
    "Verification reviewed -> VerificationDocument status updated, profile verification status updated if supported",
    "Message sent -> Message count increases and latest message appears",
  ].forEach((item) => {
    console.log(`  - ${item}`);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  console.log("GETYOURCAVE database sanity check");
  console.log(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:@/]+@/, ":***@")}`);
  console.log("Read-only mode: no writes will be performed.");

  await printUsers();
  await printProfiles();
  await printListings();
  await printBookings();
  await printInvoices();
  await printPayments();
  await printContracts();
  await printVerificationDocuments();
  await printMessaging();
  await printAdminLogs();
  printManualChecklist();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
