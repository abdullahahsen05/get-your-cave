import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { normalizeInvoiceSort, normalizeInvoiceStatusFilter } from "@/lib/invoices/invoiceTypes";

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

function buildInvoiceWhere(params: {
  role: string;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
  search?: string;
  status?: string | null;
}) {
  const where: Prisma.InvoiceWhereInput = {};

  if (params.role === "OWNER" && params.ownerProfileId) {
    where.ownerId = params.ownerProfileId;
  } else if (params.role === "RENTER" && params.renterProfileId) {
    where.renterId = params.renterProfileId;
  } else if (params.role !== "ADMIN") {
    return null;
  }

  const status = normalizeInvoiceStatusFilter(params.status);
  if (status) {
    where.status = status;
  }

  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { booking: { bookingNumber: { contains: search, mode: "insensitive" } } },
      { booking: { listing: { title: { contains: search, mode: "insensitive" } } } },
      { owner: { user: { fullName: { contains: search, mode: "insensitive" } } } },
      { renter: { user: { fullName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in to export invoices." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const where = buildInvoiceWhere({
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
    search: searchParams.get("q") ?? "",
    status: normalizeInvoiceStatusFilter(searchParams.get("status")),
  });

  if (!where) {
    return NextResponse.json({ error: "You cannot export these invoices." }, { status: 403 });
  }

  const sort = normalizeInvoiceSort(searchParams.get("sort"));
  const orderBy =
    sort === "oldest"
      ? [{ issuedAt: "asc" as const }, { createdAt: "asc" as const }]
      : [{ issuedAt: "desc" as const }, { createdAt: "desc" as const }];

  const records = await prisma.invoice.findMany({
    where,
    orderBy,
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
      owner: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
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
            },
          },
        },
      },
      payment: {
        select: {
          status: true,
          amount: true,
          paidAt: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const csv = buildCsv(
    [
      "Invoice Number",
      "Booking Number",
      "Booking Title",
      "Booking City",
      "Owner",
      "Renter",
      "Status",
      "Issued At",
      "Due At",
      "Paid At",
      "Subtotal",
      "Platform Fee",
      "Tax",
      "Total",
      "Currency",
      "Payment Status",
      "Payment Amount",
      "Line Items",
      "Created At",
    ],
    records.map((invoice) => [
      invoice.invoiceNumber,
      invoice.booking.bookingNumber,
      invoice.booking.listing.title,
      invoice.booking.listing.city,
      invoice.owner?.user.fullName ?? invoice.booking.owner.user.fullName,
      invoice.renter?.user.fullName ?? invoice.booking.renter.user.fullName,
      invoice.status,
      toIso(invoice.issuedAt),
      toIso(invoice.dueAt),
      toIso(invoice.paidAt),
      toMoney(invoice.subtotal),
      toMoney(invoice.platformFee),
      toMoney(invoice.taxAmount),
      toMoney(invoice.totalAmount),
      invoice.currency.toUpperCase(),
      invoice.payment?.status ?? "",
      invoice.payment?.amount ? toMoney(invoice.payment.amount) : "",
      invoice.items.length,
      invoice.createdAt.toISOString(),
    ]),
  );

  const filename = `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
