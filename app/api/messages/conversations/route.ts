import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  createOrLoadConversation,
  loadConversationListForViewer,
} from "@/lib/messages";
import { conversationStartSchema } from "@/lib/validations/message";

export const dynamic = "force-dynamic";

function canAccessMessaging(role: string) {
  return role === "OWNER" || role === "RENTER";
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view messages." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can access messages." },
      { status: 403 },
    );
  }

  const conversations = await loadConversationListForViewer(currentUser.id);

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to start a conversation." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can start conversations." },
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

  const parsed = conversationStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid conversation details.",
      },
      { status: 400 },
    );
  }

  const conversation = await createOrLoadConversation({
    viewerId: currentUser.id,
    viewerRole: currentUser.role,
    listingId: parsed.data.listingId ?? null,
    bookingId: parsed.data.bookingId ?? null,
    targetUserId: parsed.data.targetUserId ?? null,
  });

  if ("error" in conversation) {
    return NextResponse.json(
      { error: conversation.error },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      conversation,
    },
    { status: 201 },
  );
}
