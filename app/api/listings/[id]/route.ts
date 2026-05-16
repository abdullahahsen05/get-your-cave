import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  archiveOwnerListing,
  getListingByIdForViewer,
  updateOwnerListing,
} from "@/lib/listings";
import {
  listingDraftSchema,
  listingPublishSchema,
} from "@/lib/validations/listing";

export const dynamic = "force-dynamic";

function canManageListing(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): user is NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> & {
  role: "OWNER";
} {
  return Boolean(user && user.role === "OWNER" && user.ownerProfile);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const listing = await getListingByIdForViewer(id, currentUser
    ? {
        role: currentUser.role,
        ownerProfileId: currentUser.ownerProfile?.id ?? null,
      }
    : undefined);

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!canManageListing(currentUser)) {
    return NextResponse.json(
      { error: "Only authenticated owners can update listings." },
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

  const ownerProfileId = currentUser.ownerProfile?.id;
  if (!ownerProfileId) {
    return NextResponse.json(
      { error: "Owner profile not found." },
      { status: 403 },
    );
  }

  const listing = await updateOwnerListing({
    listingId: id,
    ownerProfileId,
    data: parsed.data,
  });

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!canManageListing(currentUser)) {
    return NextResponse.json(
      { error: "Only authenticated owners can delete listings." },
      { status: 403 },
    );
  }

  const ownerProfileId = currentUser.ownerProfile?.id;
  if (!ownerProfileId) {
    return NextResponse.json(
      { error: "Owner profile not found." },
      { status: 403 },
    );
  }

  const listing = await archiveOwnerListing({
    listingId: id,
    ownerProfileId,
  });

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing });
}
