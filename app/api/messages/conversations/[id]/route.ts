import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  createConversationMessage,
  loadConversationDetailForViewer,
} from "@/lib/messages";
import {
  emitConversationUpdated,
  emitNewMessageToConversation,
} from "@/lib/socket/server";
import { messageCreateSchema } from "@/lib/validations/message";

export const dynamic = "force-dynamic";

function canAccessMessaging(role: string) {
  return role === "OWNER" || role === "RENTER";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view conversations." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can access conversations." },
      { status: 403 },
    );
  }

  const conversation = await loadConversationDetailForViewer(id, currentUser.id);

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ conversation });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to send messages." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can send messages." },
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

  const parsed = messageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid message details.",
      },
      { status: 400 },
    );
  }

  const message = await createConversationMessage({
    conversationId: id,
    senderId: currentUser.id,
    body: parsed.data.body,
    type: parsed.data.type,
    fileUrl:
      typeof parsed.data.fileUrl === "string" && parsed.data.fileUrl.length
        ? parsed.data.fileUrl
        : null,
    fileName:
      typeof parsed.data.fileName === "string" && parsed.data.fileName.length
        ? parsed.data.fileName
        : null,
  });

  if ("error" in message) {
    return NextResponse.json(
      { error: message.error },
      { status: 403 },
    );
  }

  emitNewMessageToConversation(id, message.message);
  emitConversationUpdated(
    [message.conversation.ownerUserId, message.conversation.renterUserId],
    message.conversation.id,
  );

  return NextResponse.json(
    {
      message: message.message,
    },
    { status: 201 },
  );
}
