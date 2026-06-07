import { NextResponse } from "next/server";

import {
  createOwnerListing,
  listPublicListings,
  normalizeListingFilters,
} from "@/lib/listings";
import { getCurrentUser } from "@/lib/auth";
import {
  listingDraftSchema,
  listingPublishSchema,
} from "@/lib/validations/listing";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = normalizeListingFilters(url.searchParams);
  const { listings, total } = await listPublicListings(filters);

  return NextResponse.json({
    listings,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "OWNER" || !currentUser.ownerProfile) {
    return NextResponse.json(
      { error: "Only authenticated owners can create listings." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const rawStatus =
    typeof body === "object" && body !== null && "status" in body
      ? (body as { status?: string }).status
      : undefined;

  const schema =
    rawStatus === "PENDING_APPROVAL" ? listingPublishSchema : listingDraftSchema;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid listing details.",
      },
      { status: 400 },
    );
  }

  // Listings go live immediately — no admin approval required.
  // Map PENDING_APPROVAL (sent by the client form) to APPROVED + isPublished=true.
  const listingData =
    rawStatus === "PENDING_APPROVAL"
      ? { ...parsed.data, status: ListingStatus.APPROVED, isPublished: true }
      : parsed.data;

  const listing = await createOwnerListing({
    ownerProfileId: currentUser.ownerProfile.id,
    data: listingData,
  });

  if (!listing) {
    return NextResponse.json(
      { error: "Unable to create listing right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ listing }, { status: 201 });
}

