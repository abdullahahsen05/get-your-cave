import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  emitConversationUpdated,
  emitMessagesRead,
} from "@/lib/socket/server";
import { markConversationRead } from "@/lib/messages";
import { messageReadSchema } from "@/lib/validations/message";

export const dynamic = "force-dynamic";

function canAccessMessaging(role: string) {
  return role === "OWNER" || role === "RENTER";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to mark messages as read." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can access messages." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = { conversationId: id };
  }

  const parsed = messageReadSchema.safeParse({
    conversationId: id,
    ...(typeof body === "object" && body !== null ? body : {}),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid read details.",
      },
      { status: 400 },
    );
  }

  const result = await markConversationRead({
    conversationId: parsed.data.conversationId,
    viewerId: currentUser.id,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 404 },
    );
  }

  emitMessagesRead(
    [result.conversation.ownerUserId, result.conversation.renterUserId],
    {
      conversationId: result.conversation.id,
      readerId: currentUser.id,
      readAt: new Date().toISOString(),
      markedCount: result.markedCount,
    },
  );
  emitConversationUpdated(
    [result.conversation.ownerUserId, result.conversation.renterUserId],
    result.conversation.id,
  );

  return NextResponse.json({
    success: true,
    markedCount: result.markedCount,
  });
}
