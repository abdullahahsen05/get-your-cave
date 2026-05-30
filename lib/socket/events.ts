export const SOCKET_EVENTS = {
  joinConversation: "join-conversation",
  leaveConversation: "leave-conversation",
  sendMessage: "send-message",
  typing: "typing",
  stopTyping: "stop-typing",
  messageRead: "message-read",
  newMessage: "new-message",
  conversationUpdated: "conversation-updated",
  userTyping: "user-typing",
  userStoppedTyping: "user-stopped-typing",
  messagesRead: "messages-read",
  notificationCreated: "notification-created",
  notificationsUpdated: "notifications-updated",
  socketError: "socket-error",
} as const;

export type SocketConversationSummary = {
  id: string;
  listingId: string | null;
  bookingId: string | null;
  ownerUserId: string;
  renterUserId: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
};

export type SocketMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "FILE" | "SYSTEM";
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  readAt: string | null;
  createdAt: string;
};

export type SocketTypingPayload = {
  conversationId: string;
  userId: string;
  userName: string;
};

export type SocketErrorPayload = {
  message: string;
};

export type SocketNotificationPayload = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};
