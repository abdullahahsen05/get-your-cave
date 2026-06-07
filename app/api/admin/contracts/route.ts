import { ContractStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
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

  const where: Prisma.GeneratedContractWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search?.trim()) {
    const s = search.trim();
    where.OR = [
      { contractNumber: { contains: s, mode: "insensitive" } },
      { boldsignDocumentId: { contains: s, mode: "insensitive" } },
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

  const [total, contracts] = await Promise.all([
    prisma.generatedContract.count({ where }),
    prisma.generatedContract.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        contractNumber: true,
        contractType: true,
        status: true,
        boldsignDocumentId: true,
        signatureProvider: true,
        ownerSignedAt: true,
        tenantSignedAt: true,
        signatureFailedReason: true,
        generatedFilePath: true,
        signedPdfPath: true,
        auditTrailPath: true,
        generatedAt: true,
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
      },
    }),
  ]);

  const rows = contracts.map((c) => ({
    id: c.id,
    contractNumber: c.contractNumber,
    contractType: c.contractType,
    status: c.status,
    boldsignDocumentId: c.boldsignDocumentId,
    signatureProvider: c.signatureProvider,
    ownerSignedAt: c.ownerSignedAt?.toISOString() ?? null,
    tenantSignedAt: c.tenantSignedAt?.toISOString() ?? null,
    signatureFailedReason: c.signatureFailedReason,
    hasGeneratedPdf: Boolean(c.generatedFilePath),
    hasSignedPdf: Boolean(c.signedPdfPath),
    hasAuditTrail: Boolean(c.auditTrailPath),
    generatedAt: c.generatedAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    booking: {
      id: c.booking.id,
      bookingNumber: c.booking.bookingNumber,
      listingTitle: c.booking.listing?.title ?? "—",
      listingCity: c.booking.listing?.city ?? "—",
      ownerName: c.booking.owner?.user?.fullName ?? "—",
      ownerEmail: c.booking.owner?.user?.email ?? "—",
      renterName: c.booking.renter?.user?.fullName ?? "—",
      renterEmail: c.booking.renter?.user?.email ?? "—",
    },
  }));

  return NextResponse.json({ rows, total, page, limit });
}
