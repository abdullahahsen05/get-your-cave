import type { Server as HttpServer } from "http";

import { Server as SocketIOServer, type Socket } from "socket.io";

import { safeUserSelect, verifySessionToken } from "@/lib/auth";
import {
  createConversationMessage,
  markConversationRead,
} from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import {
  messageCreateSchema,
} from "@/lib/validations/message";
import {
  SOCKET_EVENTS,
  type SocketErrorPayload,
  type SocketMessagePayload,
} from "@/lib/socket/events";

type SocketUser = {
  id: string;
  fullName: string;
};

type AuthenticatedSocket = Socket & {
  data: {
    user?: SocketUser;
    joinedConversationIds?: Set<string>;
  };
};

let messagingSocketServer: SocketIOServer | null = null;

function parseCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(name.length + 1);
  return decodeURIComponent(value);
}

async function getSocketUser(socket: AuthenticatedSocket) {
  const token = parseCookieValue(
    socket.handshake.headers.cookie,
    "gyc_auth_token",
  );

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: safeUserSelect,
  });

  return user
    ? {
        id: user.id,
        fullName: user.fullName,
      }
    : null;
}

async function assertConversationMembership(
  conversationId: string,
  userId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ ownerUserId: userId }, { renterUserId: userId }],
    },
    select: {
      id: true,
      ownerUserId: true,
      renterUserId: true,
    },
  });

  return conversation;
}

function emitToParticipantRooms(
  participantIds: Array<string | null | undefined>,
  eventName: string,
  payload: SocketErrorPayload | Record<string, unknown>,
) {
  if (!messagingSocketServer) {
    return;
  }

  const uniqueIds = Array.from(
    new Set(participantIds.filter(Boolean) as string[]),
  );

  for (const participantId of uniqueIds) {
    messagingSocketServer.to(`user:${participantId}`).emit(eventName, payload);
  }
}

export function getMessagingSocketServer() {
  return messagingSocketServer;
}

export function emitConversationUpdated(participantIds: string[], conversationId: string) {
  emitToParticipantRooms(participantIds, SOCKET_EVENTS.conversationUpdated, {
    conversationId,
  });
}

export function emitNewMessageToConversation(
  conversationId: string,
  message: SocketMessagePayload,
) {
  messagingSocketServer?.to(`conversation:${conversationId}`).emit(
    SOCKET_EVENTS.newMessage,
    message,
  );
}

export function emitMessagesRead(
  participantIds: string[],
  payload: { conversationId: string; readerId: string; readAt: string; markedCount: number },
) {
  emitToParticipantRooms(participantIds, SOCKET_EVENTS.messagesRead, payload);
}

export function createMessagingSocketServer(httpServer: HttpServer) {
  if (messagingSocketServer) {
    return messagingSocketServer;
  }

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  messagingSocketServer = io;

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const user = await getSocketUser(socket);

      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }

      socket.data.user = user;
      socket.data.joinedConversationIds = new Set();
      socket.join(`user:${user.id}`);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const currentUser = socket.data.user;

    if (!currentUser) {
      socket.disconnect(true);
      return;
    }

    socket.on(
      SOCKET_EVENTS.joinConversation,
      async (
        payload: { conversationId?: string },
        ack?: (response: { ok: boolean; error?: string }) => void,
      ) => {
        const conversationId = payload?.conversationId;

        if (!conversationId) {
          ack?.({ ok: false, error: "Conversation id is required." });
          socket.emit(SOCKET_EVENTS.socketError, {
            message: "Conversation id is required.",
          } satisfies SocketErrorPayload);
          return;
        }

        const conversation = await assertConversationMembership(
          conversationId,
          currentUser.id,
        );

        if (!conversation) {
          ack?.({ ok: false, error: "You cannot access this conversation." });
          socket.emit(SOCKET_EVENTS.socketError, {
            message: "You cannot access this conversation.",
          } satisfies SocketErrorPayload);
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.data.joinedConversationIds?.add(conversationId);
        ack?.({ ok: true });
      },
    );

    socket.on(
      SOCKET_EVENTS.leaveConversation,
      (payload: { conversationId?: string }) => {
        if (!payload?.conversationId) {
          return;
        }

        socket.leave(`conversation:${payload.conversationId}`);
        socket.data.joinedConversationIds?.delete(payload.conversationId);
      },
    );

    socket.on(
      SOCKET_EVENTS.sendMessage,
      async (
        payload: {
          conversationId?: string;
          body?: string;
          type?: "TEXT" | "FILE" | "SYSTEM";
          fileUrl?: string | null;
          fileName?: string | null;
        },
        ack?: (
          response:
            | { ok: true; message: SocketMessagePayload }
            | { ok: false; error: string },
        ) => void,
      ) => {
        const parsed = messageCreateSchema.safeParse(payload);

        if (!payload?.conversationId) {
          ack?.({ ok: false, error: "Conversation id is required." });
          return;
        }

        if (!parsed.success) {
          const error =
            parsed.error.issues[0]?.message ?? "Invalid message payload.";
          ack?.({ ok: false, error });
          socket.emit(SOCKET_EVENTS.socketError, { message: error });
          return;
        }

        const conversation = await assertConversationMembership(
          payload.conversationId,
          currentUser.id,
        );

        if (!conversation) {
          const error = "You cannot send messages in this conversation.";
          ack?.({ ok: false, error });
          socket.emit(SOCKET_EVENTS.socketError, { message: error });
          return;
        }

        const saved = await createConversationMessage({
          conversationId: payload.conversationId,
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

        if ("error" in saved) {
          const errorMessage = saved.error ?? "Unable to save message.";
          ack?.({ ok: false, error: errorMessage });
          socket.emit(SOCKET_EVENTS.socketError, { message: errorMessage });
          return;
        }

        emitNewMessageToConversation(payload.conversationId, saved.message);
        emitConversationUpdated(
          [saved.conversation.ownerUserId, saved.conversation.renterUserId],
          saved.conversation.id,
        );

        ack?.({ ok: true, message: saved.message });
      },
    );

    socket.on(
      SOCKET_EVENTS.typing,
      async (payload: { conversationId?: string; userName?: string }) => {
        if (!payload?.conversationId) {
          return;
        }

        const conversation = await assertConversationMembership(
          payload.conversationId,
          currentUser.id,
        );

        if (!conversation) {
          return;
        }

        socket.to(`conversation:${payload.conversationId}`).emit(
          SOCKET_EVENTS.userTyping,
          {
            conversationId: payload.conversationId,
            userId: currentUser.id,
            userName: currentUser.fullName,
          },
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.stopTyping,
      async (payload: { conversationId?: string }) => {
        if (!payload?.conversationId) {
          return;
        }

        const conversation = await assertConversationMembership(
          payload.conversationId,
          currentUser.id,
        );

        if (!conversation) {
          return;
        }

        socket.to(`conversation:${payload.conversationId}`).emit(
          SOCKET_EVENTS.userStoppedTyping,
          {
            conversationId: payload.conversationId,
            userId: currentUser.id,
          },
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.messageRead,
      async (
        payload: { conversationId?: string },
        ack?: (
          response:
            | { ok: true; markedCount: number }
            | { ok: false; error: string },
        ) => void,
      ) => {
        if (!payload?.conversationId) {
          ack?.({ ok: false, error: "Conversation id is required." });
          return;
        }

        const result = await markConversationRead({
          conversationId: payload.conversationId,
          viewerId: currentUser.id,
        });

        if ("error" in result) {
          const errorMessage = result.error ?? "Unable to mark messages as read.";
          ack?.({ ok: false, error: errorMessage });
          return;
        }

        emitMessagesRead(
          [result.conversation.ownerUserId, result.conversation.renterUserId],
          {
            conversationId: payload.conversationId,
            readerId: currentUser.id,
            readAt: new Date().toISOString(),
            markedCount: result.markedCount,
          },
        );
        emitConversationUpdated(
          [result.conversation.ownerUserId, result.conversation.renterUserId],
          result.conversation.id,
        );

        ack?.({ ok: true, markedCount: result.markedCount });
      },
    );
  });

  return io;
}

export function disconnectMessagingSocketServer() {
  messagingSocketServer?.removeAllListeners();
  messagingSocketServer?.close();
  messagingSocketServer = null;
}
