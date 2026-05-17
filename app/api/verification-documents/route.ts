import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listUserVerificationState } from "@/lib/verification";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view verification documents." },
      { status: 401 },
    );
  }

  const { documents, verification } = await listUserVerificationState(currentUser);

  return NextResponse.json({
    documents,
    verification: {
      role: verification.role,
      accountStatus: verification.accountStatus,
      requiredDocumentTypes: verification.requiredDocumentTypes,
      missingDocumentTypes: verification.missingDocumentTypes,
      canSubmit: verification.canSubmit,
    },
  });
}

