import { PaymentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toMoney(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const decimal = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return decimal.toFixed(2);
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function normalizePaymentStatus(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return Object.values(PaymentStatus).includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : null;
}

function buildPaymentWhere(params: {
  role: string;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
  search?: string;
  status?: string | null;
}) {
  const where: Prisma.PaymentWhereInput = {};

  if (params.role === "OWNER" && params.ownerProfileId) {
    where.booking = { ownerId: params.ownerProfileId };
  } else if (params.role === "RENTER" && params.renterProfileId) {
    where.booking = { renterId: params.renterProfileId };
  } else if (params.role !== "ADMIN") {
    return null;
  }

  const status = normalizePaymentStatus(params.status);
  if (status) {
    where.status = status;
  }

  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { stripePaymentIntentId: { contains: search, mode: "insensitive" } },
      { stripeCheckoutSessionId: { contains: search, mode: "insensitive" } },
      { booking: { bookingNumber: { contains: search, mode: "insensitive" } } },
      { booking: { listing: { title: { contains: search, mode: "insensitive" } } } },
      { booking: { owner: { user: { fullName: { contains: search, mode: "insensitive" } } } } },
      { booking: { renter: { user: { fullName: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  return where;
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in to export payments." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildPaymentWhere({
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
    search: searchParams.get("q") ?? "",
    status: searchParams.get("status"),
  });

  if (!where) {
    return NextResponse.json({ error: "You cannot export these payments." }, { status: 403 });
  }

  const records = await prisma.payment.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      booking: {
        include: {
          listing: {
            select: {
              title: true,
              city: true,
              address: true,
            },
          },
          owner: {
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          renter: {
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
      invoice: {
        select: {
          invoiceNumber: true,
          status: true,
        },
      },
    },
  });

  const csv = buildCsv(
    [
      "Payment ID",
      "Booking Number",
      "Listing Title",
      "Booking City",
      "Owner",
      "Renter",
      "Status",
      "Amount",
      "Platform Commission",
      "Owner Amount",
      "Currency",
      "Paid At",
      "Failed At",
      "Refunded At",
      "Stripe Payment Intent",
      "Stripe Checkout Session",
      "Stripe Charge",
      "Invoice Number",
      "Created At",
    ],
    records.map((payment) => [
      payment.id,
      payment.booking.bookingNumber,
      payment.booking.listing.title,
      payment.booking.listing.city,
      payment.booking.owner.user.fullName,
      payment.booking.renter.user.fullName,
      payment.status,
      toMoney(payment.amount),
      toMoney(payment.platformCommission),
      toMoney(payment.ownerAmount),
      payment.currency.toUpperCase(),
      toIso(payment.paidAt),
      toIso(payment.failedAt),
      toIso(payment.refundedAt),
      payment.stripePaymentIntentId ?? "",
      payment.stripeCheckoutSessionId ?? "",
      payment.stripeChargeId ?? "",
      payment.invoice?.invoiceNumber ?? "",
      payment.createdAt.toISOString(),
    ]),
  );

  const filename = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
