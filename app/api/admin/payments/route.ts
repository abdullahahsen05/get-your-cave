import { PaymentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { status, search, page, limit } = parsed.data;

  const where: Prisma.PaymentWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search?.trim()) {
    const s = search.trim();
    where.OR = [
      { stripePaymentIntentId: { contains: s, mode: "insensitive" } },
      { stripeChargeId: { contains: s, mode: "insensitive" } },
      {
        booking: {
          OR: [
            { bookingNumber: { contains: s, mode: "insensitive" } },
            {
              listing: { title: { contains: s, mode: "insensitive" } },
            },
            {
              owner: {
                user: {
                  OR: [
                    { fullName: { contains: s, mode: "insensitive" } },
                    { email: { contains: s, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              renter: {
                user: {
                  OR: [
                    { fullName: { contains: s, mode: "insensitive" } },
                    { email: { contains: s, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
      },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        platformCommission: true,
        ownerAmount: true,
        stripePaymentIntentId: true,
        stripeChargeId: true,
        stripeInvoiceId: true,
        paidAt: true,
        failedAt: true,
        refundedAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
              },
            },
            owner: {
              select: {
                user: {
                  select: {
                    id: true,
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
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            pdfUrl: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  const rows = payments.map((p) => ({
    id: p.id,
    status: p.status,
    amount: p.amount.toFixed(2),
    currency: p.currency,
    platformCommission: p.platformCommission.toFixed(2),
    ownerAmount: p.ownerAmount.toFixed(2),
    stripePaymentIntentId: p.stripePaymentIntentId,
    stripeChargeId: p.stripeChargeId,
    stripeInvoiceId: p.stripeInvoiceId,
    paidAt: p.paidAt?.toISOString() ?? null,
    failedAt: p.failedAt?.toISOString() ?? null,
    refundedAt: p.refundedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    booking: {
      id: p.booking.id,
      bookingNumber: p.booking.bookingNumber,
      listingTitle: p.booking.listing?.title ?? "—",
      listingCity: p.booking.listing?.city ?? "—",
      ownerName: p.booking.owner?.user?.fullName ?? "—",
      ownerEmail: p.booking.owner?.user?.email ?? "—",
      renterName: p.booking.renter?.user?.fullName ?? "—",
      renterEmail: p.booking.renter?.user?.email ?? "—",
    },
    invoice: p.invoice
      ? {
          id: p.invoice.id,
          invoiceNumber: p.invoice.invoiceNumber,
          status: p.invoice.status,
          pdfUrl: p.invoice.pdfUrl,
        }
      : null,
  }));

  return NextResponse.json({ rows, total, page, limit });
}
