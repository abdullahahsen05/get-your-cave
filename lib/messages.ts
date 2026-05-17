import { UserRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const conversationParticipantSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  avatarUrl: true,
  ownerProfile: {
    select: {
      id: true,
      city: true,
      verificationStatus: true,
    },
  },
  renterProfile: {
    select: {
      id: true,
      city: true,
      verificationStatus: true,
    },
  },
} satisfies Prisma.UserSelect;

export type ConversationParticipant = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  ownerProfile: {
    id: string;
    city: string | null;
    verificationStatus: string;
  } | null;
  renterProfile: {
    id: string;
    city: string | null;
    verificationStatus: string;
  } | null;
};

export type ConversationListItem = {
  id: string;
  listingId: string | null;
  bookingId: string | null;
  ownerUserId: string;
  renterUserId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  owner: ConversationParticipant;
  renter: ConversationParticipant;
  otherParticipant: ConversationParticipant;
  listing: {
    id: string;
    title: string;
    city: string;
    address: string;
    pricePerMonth: string;
    sizeSqFt: number | null;
    imageUrl: string | null;
  } | null;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    startDate: string;
    endDate: string | null;
    monthlyPrice: string;
  } | null;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "FILE" | "SYSTEM";
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  readAt: string | null;
  createdAt: string;
  sender: ConversationParticipant;
};

export type ConversationDetail = ConversationListItem & {
  messages: ConversationMessage[];
};

type ConversationRecord = {
  id: string;
  listingId: string | null;
  bookingId: string | null;
  ownerUserId: string;
  renterUserId: string;
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    ownerProfile: { id: string; city: string | null; verificationStatus: string } | null;
    renterProfile: { id: string; city: string | null; verificationStatus: string } | null;
  };
  renter: ConversationRecord["owner"];
  listing: {
    id: string;
    title: string;
    city: string;
    address: string;
    pricePerMonth: Prisma.Decimal;
    sizeSqFt: number | null;
    images: Array<{ url: string; isPrimary: boolean; sortOrder: number }>;
  } | null;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    monthlyPrice: Prisma.Decimal;
  } | null;
};

type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "FILE" | "SYSTEM";
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  readAt: Date | null;
  createdAt: Date;
  sender: ConversationRecord["owner"];
};

const conversationInclude = {
  owner: {
    select: conversationParticipantSelect,
  },
  renter: {
    select: conversationParticipantSelect,
  },
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      address: true,
      pricePerMonth: true,
      sizeSqFt: true,
      images: {
        select: {
          url: true,
          isPrimary: true,
          sortOrder: true,
        },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
    },
  },
  booking: {
    select: {
      id: true,
      bookingNumber: true,
      status: true,
      startDate: true,
      endDate: true,
      monthlyPrice: true,
    },
  },
} satisfies Prisma.ConversationInclude;

const conversationDetailInclude = {
  ...conversationInclude,
  messages: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      type: true,
      body: true,
      fileUrl: true,
      fileName: true,
      readAt: true,
      createdAt: true,
      sender: {
        select: conversationParticipantSelect,
      },
    },
  },
} satisfies Prisma.ConversationInclude;

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toParticipant(participant: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  ownerProfile: { id: string; city: string | null; verificationStatus: string } | null;
  renterProfile: { id: string; city: string | null; verificationStatus: string } | null;
}): ConversationParticipant {
  return participant;
}

function toConversationParticipantSummary(
  conversation: ConversationRecord,
  currentUserId: string,
) {
  const otherParticipant =
    conversation.owner.id === currentUserId ? conversation.renter : conversation.owner;

  const listingImage = conversation.listing?.images[0]?.url ?? null;

  return {
    id: conversation.id,
    listingId: conversation.listingId,
    bookingId: conversation.bookingId,
    ownerUserId: conversation.ownerUserId,
    renterUserId: conversation.renterUserId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageText: conversation.lastMessageText,
    lastMessageAt: toIso(conversation.lastMessageAt),
    unreadCount: 0,
    owner: toParticipant(conversation.owner),
    renter: toParticipant(conversation.renter),
    otherParticipant: toParticipant(otherParticipant),
    listing: conversation.listing
      ? {
          id: conversation.listing.id,
          title: conversation.listing.title,
          city: conversation.listing.city,
          address: conversation.listing.address,
          pricePerMonth: conversation.listing.pricePerMonth.toString(),
          sizeSqFt: conversation.listing.sizeSqFt,
          imageUrl: listingImage,
        }
      : null,
    booking: conversation.booking
      ? {
          id: conversation.booking.id,
          bookingNumber: conversation.booking.bookingNumber,
          status: conversation.booking.status,
          startDate: conversation.booking.startDate.toISOString(),
          endDate: toIso(conversation.booking.endDate),
          monthlyPrice: conversation.booking.monthlyPrice.toString(),
        }
      : null,
  };
}

function toConversationMessage(message: MessageRecord): ConversationMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    type: message.type,
    body: message.body,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    readAt: toIso(message.readAt),
    createdAt: message.createdAt.toISOString(),
    sender: toParticipant(message.sender),
  };
}

async function getUnreadCount(conversationId: string, viewerId: string) {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: viewerId },
      readAt: null,
    },
  });
}

function conversationLookupWhere({
  ownerUserId,
  renterUserId,
  listingId,
  bookingId,
}: {
  ownerUserId: string;
  renterUserId: string;
  listingId: string | null;
  bookingId: string | null;
}) {
  return {
    ownerUserId,
    renterUserId,
    listingId,
    bookingId,
  };
}

export async function listConversationsForUser(viewerId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ ownerUserId: viewerId }, { renterUserId: viewerId }],
    },
    orderBy: [
      { lastMessageAt: "desc" },
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: conversationInclude,
  });

  const items = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await getUnreadCount(conversation.id, viewerId);
      const summary = toConversationParticipantSummary(
        conversation as ConversationRecord,
        viewerId,
      );

      return {
        ...summary,
        unreadCount,
      } satisfies ConversationListItem;
    }),
  );

  return items;
}

export async function getConversationForUser(
  conversationId: string,
  viewerId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ ownerUserId: viewerId }, { renterUserId: viewerId }],
    },
    include: conversationDetailInclude,
  });

  if (!conversation) {
    return null;
  }

  const unreadCount = await getUnreadCount(conversation.id, viewerId);
  const summary = toConversationParticipantSummary(
    conversation as ConversationRecord,
    viewerId,
  );

  return {
    ...summary,
    unreadCount,
    messages: (conversation.messages as MessageRecord[]).map(toConversationMessage),
  } satisfies ConversationDetail;
}

export async function resolveConversationParticipants(input: {
  viewerId: string;
  viewerRole: UserRole;
  listingId?: string | null;
  bookingId?: string | null;
  targetUserId?: string | null;
}) {
  const listingId = input.listingId ?? null;
  const bookingId = input.bookingId ?? null;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        listingId: true,
        owner: { select: { userId: true } },
        renter: { select: { userId: true } },
      },
    });

    if (!booking) {
      return { error: "Booking not found." } as const;
    }

    const isParticipant =
      booking.owner.userId === input.viewerId ||
      booking.renter.userId === input.viewerId;

    if (!isParticipant && input.viewerRole !== UserRole.ADMIN) {
      return {
        error: "You cannot start a conversation for this booking.",
      } as const;
    }

    return {
      ownerUserId: booking.owner.userId,
      renterUserId: booking.renter.userId,
      listingId: booking.listingId,
      bookingId: booking.id,
    } as const;
  }

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        owner: { select: { userId: true } },
      },
    });

    if (!listing) {
      return { error: "Listing not found." } as const;
    }

    if (input.viewerId === listing.owner.userId) {
      if (!input.targetUserId) {
        return {
          error: "Please provide a target user for this conversation.",
        } as const;
      }

      const target = await prisma.user.findUnique({
        where: { id: input.targetUserId },
        select: { id: true, role: true },
      });

      if (!target) {
        return { error: "Target user not found." } as const;
      }

      return {
        ownerUserId: input.viewerId,
        renterUserId: target.id,
        listingId,
        bookingId: null,
      } as const;
    }

    if (input.viewerRole === UserRole.OWNER) {
      return {
        error: "Only the listing owner can start this conversation.",
      } as const;
    }

    return {
      ownerUserId: listing.owner.userId,
      renterUserId: input.viewerId,
      listingId,
      bookingId: null,
    } as const;
  }

  if (input.targetUserId) {
    const target = await prisma.user.findUnique({
      where: { id: input.targetUserId },
      select: { id: true, role: true },
    });

    if (!target) {
      return { error: "Target user not found." } as const;
    }

    if (input.viewerRole === UserRole.OWNER && target.role === UserRole.RENTER) {
      return {
        ownerUserId: input.viewerId,
        renterUserId: target.id,
        listingId: null,
        bookingId: null,
      } as const;
    }

    if (input.viewerRole === UserRole.RENTER && target.role === UserRole.OWNER) {
      return {
        ownerUserId: target.id,
        renterUserId: input.viewerId,
        listingId: null,
        bookingId: null,
      } as const;
    }

    return {
      error: "Unable to determine conversation participants.",
    } as const;
  }

  return { error: "Please provide a valid conversation target." } as const;
}

export async function startOrGetConversation(input: {
  viewerId: string;
  viewerRole: UserRole;
  listingId?: string | null;
  bookingId?: string | null;
  targetUserId?: string | null;
}) {
  const participants = await resolveConversationParticipants(input);

  if ("error" in participants) {
    return participants;
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: conversationLookupWhere(participants),
      include: conversationInclude,
    });

    if (existing) {
      return existing;
    }

    return tx.conversation.create({
      data: {
        ...participants,
      },
      include: conversationInclude,
    });
  });

  const unreadCount = await getUnreadCount(conversation.id, input.viewerId);

  return {
    ...toConversationParticipantSummary(
      conversation as ConversationRecord,
      input.viewerId,
    ),
    unreadCount,
  } satisfies ConversationListItem;
}

export async function createConversationMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
  type?: "TEXT" | "FILE" | "SYSTEM";
  fileUrl?: string | null;
  fileName?: string | null;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      OR: [{ ownerUserId: input.senderId }, { renterUserId: input.senderId }],
    },
    select: {
      id: true,
      ownerUserId: true,
      renterUserId: true,
    },
  });

  if (!conversation) {
    return { error: "Conversation not found." } as const;
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        type: input.type ?? "TEXT",
        body: input.body,
        fileUrl: input.fileUrl ?? null,
        fileName: input.fileName ?? null,
      },
      include: {
        sender: {
          select: conversationParticipantSelect,
        },
      },
    });

    await tx.conversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageText: input.body,
        lastMessageAt: created.createdAt,
      },
    });

    return created;
  });

  return {
    message: toConversationMessage(message as MessageRecord),
    conversation: {
      id: conversation.id,
      ownerUserId: conversation.ownerUserId,
      renterUserId: conversation.renterUserId,
    },
  } as const;
}

export async function markConversationRead(input: {
  conversationId: string;
  viewerId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      OR: [{ ownerUserId: input.viewerId }, { renterUserId: input.viewerId }],
    },
    select: {
      id: true,
      ownerUserId: true,
      renterUserId: true,
    },
  });

  if (!conversation) {
    return { error: "Conversation not found." } as const;
  }

  const result = await prisma.message.updateMany({
    where: {
      conversationId: input.conversationId,
      senderId: { not: input.viewerId },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    success: true,
    markedCount: result.count,
    conversation: {
      id: conversation.id,
      ownerUserId: conversation.ownerUserId,
      renterUserId: conversation.renterUserId,
    },
  } as const;
}

export async function loadConversationDetailForViewer(
  conversationId: string,
  viewerId: string,
) {
  return getConversationForUser(conversationId, viewerId);
}

export async function loadConversationListForViewer(viewerId: string) {
  return listConversationsForUser(viewerId);
}

export async function createOrLoadConversation(input: {
  viewerId: string;
  viewerRole: UserRole;
  listingId?: string | null;
  bookingId?: string | null;
  targetUserId?: string | null;
}) {
  return startOrGetConversation(input);
}
