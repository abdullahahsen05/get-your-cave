import { Prisma } from "@prisma/client";

import { sendNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type NotificationRecord = Prisma.NotificationGetPayload<{
  select: {
    id: true;
    userId: true;
    title: true;
    body: true;
    linkUrl: true;
    readAt: true;
    createdAt: true;
  };
}>;

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationRecordSelect = {
  id: true;
  userId: true;
  title: true;
  body: true;
  linkUrl: true;
  readAt: true;
  createdAt: true;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toNotificationItem(notification: NotificationRecord): NotificationItem {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    linkUrl: notification.linkUrl,
    readAt: toIso(notification.readAt),
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function createNotificationForUser(input: {
  userId: string;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  emitRealtime?: boolean;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body ?? null,
      linkUrl: input.linkUrl ?? null,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      body: true,
      linkUrl: true,
      readAt: true,
      createdAt: true,
    } satisfies NotificationRecordSelect,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: input.userId,
      readAt: null,
    },
  });

  const payload = toNotificationItem(notification);

  const recipient = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      fullName: true,
      email: true,
      emailNotificationsEnabled: true,
    },
  });

  if (recipient?.emailNotificationsEnabled && recipient.email) {
    void sendNotificationEmail({
      recipientEmail: recipient.email,
      recipientName: recipient.fullName,
      subject: input.title,
      summary: input.body ?? input.title,
      linkUrl: input.linkUrl ?? "/notifications",
      ctaLabel: input.linkUrl ? "Open notification" : "View notifications",
      heading: input.title,
    }).catch((error) => {
      console.error("Failed to send notification email", error);
    });
  }

  if (input.emitRealtime !== false) {
    const { emitNotificationCreated, emitNotificationsUpdated } = await import(
      "@/lib/socket/server"
    );
    emitNotificationCreated(input.userId, payload, unreadCount);
    emitNotificationsUpdated([input.userId], { unreadCount });
  }

  return {
    notification: payload,
    unreadCount,
  } as const;
}

function buildConversationLink(conversationId: string) {
  return `/messaging?conversation=${conversationId}`;
}

function trimPreview(text: string, maxLength = 120) {
  const compact = text.trim().replace(/\s+/g, " ");

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildMessageNotificationCopy(input: {
  senderName: string;
  messageBody: string;
  fileName?: string | null;
  fileUrl?: string | null;
}) {
  const isAttachment = Boolean(input.fileUrl);
  const title = `New message from ${input.senderName}`;
  const body = isAttachment
    ? input.fileName
      ? `${input.senderName} sent an attachment: ${input.fileName}`
      : `${input.senderName} sent an attachment`
    : trimPreview(input.messageBody);

  return { title, body };
}

export async function createMessageNotification(input: {
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  conversationId: string;
  messageBody: string;
  fileName?: string | null;
  fileUrl?: string | null;
}) {
  const copy = buildMessageNotificationCopy({
    senderName: input.senderName,
    messageBody: input.messageBody,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
  });
  const linkUrl = buildConversationLink(input.conversationId);

  const { notification, unreadCount } = await createNotificationForUser({
    userId: input.recipientId,
    title: copy.title,
    body: copy.body,
    linkUrl,
  });

  return {
    notification,
    unreadCount,
  } as const;
}

export async function listNotificationsForUser(
  userId: string,
  options?: { limit?: number },
) {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        body: true,
        linkUrl: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    }),
  ]);

  return {
    notifications: notifications.map(toNotificationItem),
    unreadCount,
  } as const;
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: {
      id: true,
      userId: true,
      title: true,
      body: true,
      linkUrl: true,
      readAt: true,
      createdAt: true,
    },
  });

  if (!notification) {
    return { error: "Notification not found." } as const;
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return {
    notification: toNotificationItem(notification),
    unreadCount,
  } as const;
}

export async function markConversationNotificationsAsRead(
  conversationId: string,
  userId: string,
) {
  const linkUrl = buildConversationLink(conversationId);

  await prisma.notification.updateMany({
    where: {
      userId,
      linkUrl,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return {
    unreadCount,
  } as const;
}

export async function markAllNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return {
    unreadCount,
  } as const;
}
