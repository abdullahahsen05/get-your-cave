import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { removeOwnerListing } from "@/lib/listings";

export const dynamic = "force-dynamic";

function canManageListing(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): user is NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> & {
  role: "OWNER";
} {
  return Boolean(user && user.role === "OWNER" && user.ownerProfile);
}

export async function DELETE(
  _request: Request,
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

  const deleted = await removeOwnerListing({
    listingId: id,
    ownerProfileId,
  });

  if (!deleted) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: true });
}
