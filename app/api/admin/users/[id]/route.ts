import { AccountStatus, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  serializeVerificationDocument,
  verificationDocumentSelect,
} from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const adminUserActionSchema = z.object({
  action: z.enum(["suspend", "reactivate", "delete"]),
});

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  ownerProfile: {
    select: {
      id: true,
      userId: true,
      bio: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      iban: true,
      responseRate: true,
      verificationStatus: true,
      walletBalance: true,
      pendingPayout: true,
      totalEarnings: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  renterProfile: {
    select: {
      id: true,
      userId: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

const publicPersonSelect = {
  id: true,
  fullName: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const listingDetailSelect = {
  id: true,
  title: true,
  status: true,
  availability: true,
  isPublished: true,
  city: true,
  address: true,
  pricePerMonth: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: {
      url: true,
      isPrimary: true,
      sortOrder: true,
    },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
  },
} satisfies Prisma.ListingSelect;

const bookingDetailSelect = {
  id: true,
  bookingNumber: true,
  status: true,
  startDate: true,
  endDate: true,
  monthlyPrice: true,
  securityDeposit: true,
  insuranceFee: true,
  platformCommission: true,
  ownerAmount: true,
  totalMonthlyAmount: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      address: true,
      images: {
        select: {
          url: true,
          isPrimary: true,
          sortOrder: true,
        },
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
        take: 1,
      },
    },
  },
  owner: {
    select: {
      id: true,
      user: {
        select: publicPersonSelect,
      },
    },
  },
  renter: {
    select: {
      id: true,
      user: {
        select: publicPersonSelect,
      },
    },
  },
  generatedContract: {
    select: {
      id: true,
      contractNumber: true,
      status: true,
      generatedAt: true,
      generatedFileName: true,
      generatedFilePath: true,
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
} satisfies Prisma.BookingSelect;

const contractDetailSelect = {
  id: true,
  contractNumber: true,
  type: true,
  status: true,
  generatedPdfUrl: true,
  signedPdfUrl: true,
  sentAt: true,
  ownerSignedAt: true,
  renterSignedAt: true,
  fullySignedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      id: true,
      bookingNumber: true,
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          images: {
            select: {
              url: true,
              isPrimary: true,
              sortOrder: true,
            },
            orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
            take: 1,
          },
        },
      },
      owner: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
        },
      },
      renter: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
        },
      },
    },
  },
  signatures: {
    select: {
      id: true,
      signerUserId: true,
      party: true,
      signatureText: true,
      signatureImageUrl: true,
      signedAt: true,
    },
    orderBy: { signedAt: "asc" as const },
  },
} satisfies Prisma.ContractSelect;

const invoiceDetailSelect = {
  id: true,
  invoiceNumber: true,
  status: true,
  subtotal: true,
  platformFee: true,
  taxAmount: true,
  totalAmount: true,
  currency: true,
  pdfUrl: true,
  issuedAt: true,
  dueAt: true,
  paidAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      id: true,
      bookingNumber: true,
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          images: {
            select: {
              url: true,
              isPrimary: true,
              sortOrder: true,
            },
            orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
            take: 1,
          },
        },
      },
      owner: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
        },
      },
      renter: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
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
      failedAt: true,
      refundedAt: true,
      createdAt: true,
    },
  },
  items: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
} satisfies Prisma.InvoiceSelect;

const paymentDetailSelect = {
  id: true,
  status: true,
  amount: true,
  currency: true,
  platformCommission: true,
  ownerAmount: true,
  stripePaymentIntentId: true,
  stripeCheckoutSessionId: true,
  paidAt: true,
  failedAt: true,
  refundedAt: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      id: true,
      bookingNumber: true,
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          images: {
            select: {
              url: true,
              isPrimary: true,
              sortOrder: true,
            },
            orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
            take: 1,
          },
        },
      },
      owner: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
        },
      },
      renter: {
        select: {
          id: true,
          user: {
            select: publicPersonSelect,
          },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

const notificationSelect = {
  id: true,
  title: true,
  body: true,
  linkUrl: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

const adminLogSelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  details: true,
  createdAt: true,
  admin: {
    select: publicPersonSelect,
  },
  targetUser: {
    select: publicPersonSelect,
  },
} satisfies Prisma.AdminLogSelect;

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toMoney(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const decimal = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return decimal.toFixed(2);
}

function pickPrimaryImageUrl(images: Array<{ url: string; isPrimary: boolean; sortOrder: number }>) {
  return images[0]?.url ?? null;
}

async function loadAdminUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });

  if (!user) {
    return null;
  }

  const ownerProfileId = user.ownerProfile?.id ?? null;
  const renterProfileId = user.renterProfile?.id ?? null;

  const [
    verificationDocuments,
    ownerListings,
    ownerBookings,
    ownerContracts,
    ownerInvoices,
    ownerPayments,
    renterBookings,
    renterContracts,
    renterInvoices,
    renterPayments,
    notifications,
    adminLogs,
  ] = await Promise.all([
    prisma.verificationDocument.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }],
      select: verificationDocumentSelect,
    }),
    ownerProfileId
      ? prisma.listing.findMany({
          where: { ownerId: ownerProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: listingDetailSelect,
        })
      : Promise.resolve([]),
    ownerProfileId
      ? prisma.booking.findMany({
          where: { ownerId: ownerProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: bookingDetailSelect,
        })
      : Promise.resolve([]),
    ownerProfileId
      ? prisma.contract.findMany({
          where: { ownerId: ownerProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: contractDetailSelect,
        })
      : Promise.resolve([]),
    ownerProfileId
      ? prisma.invoice.findMany({
          where: { ownerId: ownerProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: invoiceDetailSelect,
        })
      : Promise.resolve([]),
    ownerProfileId
      ? prisma.payment.findMany({
          where: { booking: { ownerId: ownerProfileId } },
          orderBy: [{ updatedAt: "desc" }],
          select: paymentDetailSelect,
        })
      : Promise.resolve([]),
    renterProfileId
      ? prisma.booking.findMany({
          where: { renterId: renterProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: bookingDetailSelect,
        })
      : Promise.resolve([]),
    renterProfileId
      ? prisma.contract.findMany({
          where: { renterId: renterProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: contractDetailSelect,
        })
      : Promise.resolve([]),
    renterProfileId
      ? prisma.invoice.findMany({
          where: { renterId: renterProfileId },
          orderBy: [{ updatedAt: "desc" }],
          select: invoiceDetailSelect,
        })
      : Promise.resolve([]),
    renterProfileId
      ? prisma.payment.findMany({
          where: { booking: { renterId: renterProfileId } },
          orderBy: [{ updatedAt: "desc" }],
          select: paymentDetailSelect,
        })
      : Promise.resolve([]),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }],
      take: 25,
      select: notificationSelect,
    }),
    prisma.adminLog.findMany({
      where: {
        OR: [{ targetUserId: user.id }, { adminId: user.id }],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 25,
      select: adminLogSelect,
    }),
  ]);

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      ownerProfile: user.ownerProfile
        ? {
            ...user.ownerProfile,
            walletBalance: toMoney(user.ownerProfile.walletBalance),
            pendingPayout: toMoney(user.ownerProfile.pendingPayout),
            totalEarnings: toMoney(user.ownerProfile.totalEarnings),
            createdAt: user.ownerProfile.createdAt.toISOString(),
            updatedAt: user.ownerProfile.updatedAt.toISOString(),
          }
        : null,
      renterProfile: user.renterProfile
        ? {
            ...user.renterProfile,
            createdAt: user.renterProfile.createdAt.toISOString(),
            updatedAt: user.renterProfile.updatedAt.toISOString(),
          }
        : null,
    },
    verificationDocuments: verificationDocuments.map((document) => serializeVerificationDocument(document)),
    ownerData: ownerProfileId
      ? {
          listings: ownerListings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            status: listing.status,
            availability: listing.availability,
            isPublished: listing.isPublished,
            city: listing.city,
            address: listing.address,
            pricePerMonth: toMoney(listing.pricePerMonth),
            imageUrl: pickPrimaryImageUrl(listing.images),
            createdAt: listing.createdAt.toISOString(),
            updatedAt: listing.updatedAt.toISOString(),
          })),
          bookings: ownerBookings.map((booking) => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            startDate: booking.startDate.toISOString(),
            endDate: booking.endDate?.toISOString() ?? null,
            monthlyPrice: toMoney(booking.monthlyPrice),
            securityDeposit: toMoney(booking.securityDeposit),
            insuranceFee: toMoney(booking.insuranceFee),
            platformCommission: toMoney(booking.platformCommission),
            ownerAmount: toMoney(booking.ownerAmount),
            totalMonthlyAmount: toMoney(booking.totalMonthlyAmount),
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            listing: {
              id: booking.listing.id,
              title: booking.listing.title,
              city: booking.listing.city,
              address: booking.listing.address,
              imageUrl: pickPrimaryImageUrl(booking.listing.images),
            },
            owner: booking.owner.user,
            renter: booking.renter.user,
            generatedContract: booking.generatedContract
              ? {
                  id: booking.generatedContract.id,
                  contractNumber: booking.generatedContract.contractNumber,
                  status: booking.generatedContract.status,
                  generatedAt: booking.generatedContract.generatedAt.toISOString(),
                  generatedFileName: booking.generatedContract.generatedFileName,
                  generatedFilePath: booking.generatedContract.generatedFilePath,
                }
              : null,
            paymentStatus: booking.payments[0]?.status ?? null,
            invoiceStatus: booking.invoices[0]?.status ?? null,
          })),
          contracts: ownerContracts.map((contract) => ({
            id: contract.id,
            contractNumber: contract.contractNumber,
            type: contract.type,
            status: contract.status,
            generatedPdfUrl: contract.generatedPdfUrl,
            signedPdfUrl: contract.signedPdfUrl,
            sentAt: toIso(contract.sentAt),
            ownerSignedAt: toIso(contract.ownerSignedAt),
            renterSignedAt: toIso(contract.renterSignedAt),
            fullySignedAt: toIso(contract.fullySignedAt),
            cancelledAt: toIso(contract.cancelledAt),
            createdAt: contract.createdAt.toISOString(),
            updatedAt: contract.updatedAt.toISOString(),
            booking: {
              id: contract.booking.id,
              bookingNumber: contract.booking.bookingNumber,
              listing: {
                id: contract.booking.listing.id,
                title: contract.booking.listing.title,
                city: contract.booking.listing.city,
                address: contract.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(contract.booking.listing.images),
              },
              owner: contract.booking.owner.user,
              renter: contract.booking.renter.user,
            },
            signatures: contract.signatures.map((signature) => ({
              id: signature.id,
              signerUserId: signature.signerUserId,
              party: signature.party,
              signatureText: signature.signatureText,
              signatureImageUrl: signature.signatureImageUrl,
              signedAt: signature.signedAt.toISOString(),
            })),
          })),
          invoices: ownerInvoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            subtotal: toMoney(invoice.subtotal),
            platformFee: toMoney(invoice.platformFee),
            taxAmount: toMoney(invoice.taxAmount),
            totalAmount: toMoney(invoice.totalAmount),
            currency: invoice.currency,
            pdfUrl: invoice.pdfUrl,
            issuedAt: toIso(invoice.issuedAt),
            dueAt: toIso(invoice.dueAt),
            paidAt: toIso(invoice.paidAt),
            cancelledAt: toIso(invoice.cancelledAt),
            createdAt: invoice.createdAt.toISOString(),
            updatedAt: invoice.updatedAt.toISOString(),
            booking: {
              id: invoice.booking.id,
              bookingNumber: invoice.booking.bookingNumber,
              listing: {
                id: invoice.booking.listing.id,
                title: invoice.booking.listing.title,
                city: invoice.booking.listing.city,
                address: invoice.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(invoice.booking.listing.images),
              },
              owner: invoice.booking.owner.user,
              renter: invoice.booking.renter.user,
            },
            payment: invoice.payment
              ? {
                  id: invoice.payment.id,
                  status: invoice.payment.status,
                  amount: toMoney(invoice.payment.amount),
                  platformCommission: toMoney(invoice.payment.platformCommission),
                  ownerAmount: toMoney(invoice.payment.ownerAmount),
                  paidAt: toIso(invoice.payment.paidAt),
                  failedAt: toIso(invoice.payment.failedAt),
                  refundedAt: toIso(invoice.payment.refundedAt),
                  createdAt: invoice.payment.createdAt.toISOString(),
                }
              : null,
            items: invoice.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: toMoney(item.unitPrice),
              total: toMoney(item.total),
            })),
          })),
          payments: ownerPayments.map((payment) => ({
            id: payment.id,
            status: payment.status,
            amount: toMoney(payment.amount),
            currency: payment.currency,
            platformCommission: toMoney(payment.platformCommission),
            ownerAmount: toMoney(payment.ownerAmount),
            stripePaymentIntentId: payment.stripePaymentIntentId,
            stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
            paidAt: toIso(payment.paidAt),
            failedAt: toIso(payment.failedAt),
            refundedAt: toIso(payment.refundedAt),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            booking: {
              id: payment.booking.id,
              bookingNumber: payment.booking.bookingNumber,
              listing: {
                id: payment.booking.listing.id,
                title: payment.booking.listing.title,
                city: payment.booking.listing.city,
                address: payment.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(payment.booking.listing.images),
              },
              owner: payment.booking.owner.user,
              renter: payment.booking.renter.user,
            },
          })),
        }
      : null,
    renterData: renterProfileId
      ? {
          bookings: renterBookings.map((booking) => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            startDate: booking.startDate.toISOString(),
            endDate: booking.endDate?.toISOString() ?? null,
            monthlyPrice: toMoney(booking.monthlyPrice),
            securityDeposit: toMoney(booking.securityDeposit),
            insuranceFee: toMoney(booking.insuranceFee),
            platformCommission: toMoney(booking.platformCommission),
            ownerAmount: toMoney(booking.ownerAmount),
            totalMonthlyAmount: toMoney(booking.totalMonthlyAmount),
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            listing: {
              id: booking.listing.id,
              title: booking.listing.title,
              city: booking.listing.city,
              address: booking.listing.address,
              imageUrl: pickPrimaryImageUrl(booking.listing.images),
            },
            owner: booking.owner.user,
            renter: booking.renter.user,
            generatedContract: booking.generatedContract
              ? {
                  id: booking.generatedContract.id,
                  contractNumber: booking.generatedContract.contractNumber,
                  status: booking.generatedContract.status,
                  generatedAt: booking.generatedContract.generatedAt.toISOString(),
                  generatedFileName: booking.generatedContract.generatedFileName,
                  generatedFilePath: booking.generatedContract.generatedFilePath,
                }
              : null,
            paymentStatus: booking.payments[0]?.status ?? null,
            invoiceStatus: booking.invoices[0]?.status ?? null,
          })),
          contracts: renterContracts.map((contract) => ({
            id: contract.id,
            contractNumber: contract.contractNumber,
            type: contract.type,
            status: contract.status,
            generatedPdfUrl: contract.generatedPdfUrl,
            signedPdfUrl: contract.signedPdfUrl,
            sentAt: toIso(contract.sentAt),
            ownerSignedAt: toIso(contract.ownerSignedAt),
            renterSignedAt: toIso(contract.renterSignedAt),
            fullySignedAt: toIso(contract.fullySignedAt),
            cancelledAt: toIso(contract.cancelledAt),
            createdAt: contract.createdAt.toISOString(),
            updatedAt: contract.updatedAt.toISOString(),
            booking: {
              id: contract.booking.id,
              bookingNumber: contract.booking.bookingNumber,
              listing: {
                id: contract.booking.listing.id,
                title: contract.booking.listing.title,
                city: contract.booking.listing.city,
                address: contract.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(contract.booking.listing.images),
              },
              owner: contract.booking.owner.user,
              renter: contract.booking.renter.user,
            },
            signatures: contract.signatures.map((signature) => ({
              id: signature.id,
              signerUserId: signature.signerUserId,
              party: signature.party,
              signatureText: signature.signatureText,
              signatureImageUrl: signature.signatureImageUrl,
              signedAt: signature.signedAt.toISOString(),
            })),
          })),
          invoices: renterInvoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            subtotal: toMoney(invoice.subtotal),
            platformFee: toMoney(invoice.platformFee),
            taxAmount: toMoney(invoice.taxAmount),
            totalAmount: toMoney(invoice.totalAmount),
            currency: invoice.currency,
            pdfUrl: invoice.pdfUrl,
            issuedAt: toIso(invoice.issuedAt),
            dueAt: toIso(invoice.dueAt),
            paidAt: toIso(invoice.paidAt),
            cancelledAt: toIso(invoice.cancelledAt),
            createdAt: invoice.createdAt.toISOString(),
            updatedAt: invoice.updatedAt.toISOString(),
            booking: {
              id: invoice.booking.id,
              bookingNumber: invoice.booking.bookingNumber,
              listing: {
                id: invoice.booking.listing.id,
                title: invoice.booking.listing.title,
                city: invoice.booking.listing.city,
                address: invoice.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(invoice.booking.listing.images),
              },
              owner: invoice.booking.owner.user,
              renter: invoice.booking.renter.user,
            },
            payment: invoice.payment
              ? {
                  id: invoice.payment.id,
                  status: invoice.payment.status,
                  amount: toMoney(invoice.payment.amount),
                  platformCommission: toMoney(invoice.payment.platformCommission),
                  ownerAmount: toMoney(invoice.payment.ownerAmount),
                  paidAt: toIso(invoice.payment.paidAt),
                  failedAt: toIso(invoice.payment.failedAt),
                  refundedAt: toIso(invoice.payment.refundedAt),
                  createdAt: invoice.payment.createdAt.toISOString(),
                }
              : null,
            items: invoice.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: toMoney(item.unitPrice),
              total: toMoney(item.total),
            })),
          })),
          payments: renterPayments.map((payment) => ({
            id: payment.id,
            status: payment.status,
            amount: toMoney(payment.amount),
            currency: payment.currency,
            platformCommission: toMoney(payment.platformCommission),
            ownerAmount: toMoney(payment.ownerAmount),
            stripePaymentIntentId: payment.stripePaymentIntentId,
            stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
            paidAt: toIso(payment.paidAt),
            failedAt: toIso(payment.failedAt),
            refundedAt: toIso(payment.refundedAt),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            booking: {
              id: payment.booking.id,
              bookingNumber: payment.booking.bookingNumber,
              listing: {
                id: payment.booking.listing.id,
                title: payment.booking.listing.title,
                city: payment.booking.listing.city,
                address: payment.booking.listing.address,
                imageUrl: pickPrimaryImageUrl(payment.booking.listing.images),
              },
              owner: payment.booking.owner.user,
              renter: payment.booking.renter.user,
            },
          })),
        }
      : null,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      linkUrl: notification.linkUrl,
      readAt: toIso(notification.readAt),
      createdAt: notification.createdAt.toISOString(),
    })),
    adminLogs: adminLogs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      admin: log.admin,
      targetUser: log.targetUser,
    })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: currentUser ? 403 : 401 });
  }

  const user = await loadAdminUserDetail(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: currentUser ? 403 : 401 });
  }
  const adminUser = access.user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const user = await loadAdminUserDetail(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.user.role === UserRole.ADMIN && user.user.id === adminUser.id) {
    return NextResponse.json(
      { error: "You cannot suspend or delete your own admin account." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "delete") {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  const status = parsed.data.action === "suspend" ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE;
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: currentUser ? 403 : 401 });
  }
  const adminUser = access.user;

  const user = await loadAdminUserDetail(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.user.role === UserRole.ADMIN && user.user.id === adminUser.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
