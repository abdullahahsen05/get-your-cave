import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listUserVerificationState, submitVerificationForUser } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to submit verification documents." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    return NextResponse.json(
      { error: "Only owners and renters can submit verification documents." },
      { status: 403 },
    );
  }

  const state = await listUserVerificationState(currentUser);
  if (!state.verification.canSubmit) {
    const missing = state.verification.missingDocumentTypes
      .map((type) => type.toString().replace(/_/g, " "))
      .join(", ");

    return NextResponse.json(
      {
        error: `Missing required documents: ${missing}.`,
        missingDocumentTypes: state.verification.missingDocumentTypes,
      },
      { status: 400 },
    );
  }

  const result = await submitVerificationForUser(currentUser);
  if ("error" in result) {
    return NextResponse.json(
      {
        error: result.error,
        missingDocumentTypes: result.missingDocumentTypes,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    documents: result.documents,
    verification: result.verification,
  });
}

