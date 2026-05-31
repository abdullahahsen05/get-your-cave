"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/components/ui/UserAvatar";
import type { SafeUser } from "@/lib/auth";
import { normalizeLocale } from "@/lib/i18n";
import {
  getMessagingSocket,
  SOCKET_EVENTS,
} from "@/lib/socket-client";
import type {
  SocketMessagePayload,
  SocketTypingPayload,
} from "@/lib/socket/events";

type ConversationListItem = {
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
  owner: {
    id: string;
    fullName: string;
    email: string;
    role: "ADMIN" | "OWNER" | "RENTER";
    avatarUrl: string | null;
    ownerProfile: { id: string; city: string | null; verificationStatus: string } | null;
    renterProfile: { id: string; city: string | null; verificationStatus: string } | null;
  };
  renter: ConversationListItem["owner"];
  otherParticipant: ConversationListItem["owner"];
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

type ConversationMessage = SocketMessagePayload & {
  sender: ConversationListItem["owner"];
};

type ConversationDetail = ConversationListItem & {
  messages: ConversationMessage[];
};

type MessagingWorkspaceProps = {
  currentUser: SafeUser;
  initialConversationId: string | null;
};

function formatTime(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(value: string | null, locale: string) {
  if (!value) {
    return locale.startsWith("fr") ? "À l’instant" : "Just now";
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return formatTime(value, locale);
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function buildPreview(conversation: ConversationListItem, t: (key: string, options?: Record<string, unknown>) => string) {
  if (conversation.lastMessageText) {
    return conversation.lastMessageText;
  }

  if (conversation.booking) {
    return t("messaging.bookingPreview", { number: conversation.booking.bookingNumber });
  }

  if (conversation.listing) {
    return conversation.listing.title;
  }

  return t("messaging.noMessagesYet");
}

function getRoleLabel(role: string, t: (key: string) => string) {
  if (role === "OWNER") return t("common.owner");
  if (role === "RENTER") return t("common.renter");
  return t("common.admin");
}

function formatConversationTitle(
  conversation: ConversationListItem,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  return `${conversation.otherParticipant.fullName} (${getRoleLabel(conversation.otherParticipant.role, t)})`;
}

function hasUnreadIncomingMessages(
  conversation: ConversationDetail,
  viewerId: string,
) {
  return conversation.messages.some(
    (message) => message.senderId !== viewerId && message.readAt === null,
  );
}

function isImageAttachment(fileUrl: string | null, fileName: string | null) {
  const value = `${fileUrl ?? ""} ${fileName ?? ""}`.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) =>
    value.includes(ext),
  );
}

export default function MessagingWorkspace({
  currentUser,
  initialConversationId,
}: MessagingWorkspaceProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const canAccessMessaging =
    currentUser.role === "OWNER" || currentUser.role === "RENTER";
  const socketRef = useRef<ReturnType<typeof getMessagingSocket> | null>(null);
  const activeConversationIdRef = useRef<string | null>(initialConversationId);
  const typingTimeoutRef = useRef<number | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentPreviewUrlRef = useRef<string | null>(null);
  const loadListRef = useRef<() => Promise<void>>(async () => {});
  const loadDetailRef = useRef<() => Promise<void>>(async () => {});

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(
    null,
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [listLoading, setListLoading] = useState(canAccessMessaging);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typingStatus, setTypingStatus] = useState<SocketTypingPayload | null>(
    null,
  );
  const [socketConnected, setSocketConnected] = useState(false);

  const activeConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }

    if (selectedConversation?.id === selectedConversationId) {
      return selectedConversation;
    }

    return (
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      null
    );
  }, [conversations, selectedConversation, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    if (!needle) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.otherParticipant.fullName,
        conversation.otherParticipant.email,
        conversation.listing?.title,
        conversation.listing?.city,
        conversation.lastMessageText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [conversations, searchTerm]);

  const fetchConversationList = useCallback(async function fetchConversationList() {
    if (!canAccessMessaging) {
      setListLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/messages/conversations", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        conversations?: ConversationListItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("messaging.unableToLoadConversations"));
      }

      const nextConversations = data.conversations ?? [];
      setConversations(nextConversations);

      if (!selectedConversationId && nextConversations[0]) {
        setSelectedConversationId(nextConversations[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("messaging.unableToLoadConversations"),
      );
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, [canAccessMessaging, selectedConversationId, t]);

  const fetchConversationDetail = useCallback(async function fetchConversationDetail(
    conversationId: string,
  ) {
    if (!canAccessMessaging) {
      return;
    }

    setDetailLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        conversation?: ConversationDetail;
        error?: string;
      };

      if (!response.ok || !data.conversation) {
        throw new Error(data.error ?? t("messaging.unableToLoadMessages"));
      }

      setSelectedConversation(data.conversation);
      scrollAnchorRef.current?.scrollIntoView({ block: "end" });

      const socket = socketRef.current;
      if (socket?.connected && hasUnreadIncomingMessages(data.conversation, currentUser.id)) {
        socket.emit(SOCKET_EVENTS.messageRead, {
          conversationId,
        });
      }
    } catch (error) {
      setSelectedConversation(null);
      setErrorMessage(
        error instanceof Error ? error.message : t("messaging.unableToLoadMessages"),
      );
    } finally {
      setDetailLoading(false);
    }
  }, [canAccessMessaging, currentUser.id, t]);

  useEffect(() => {
    loadListRef.current = fetchConversationList;
    loadDetailRef.current = async () => {
      if (activeConversationIdRef.current) {
        await fetchConversationDetail(activeConversationIdRef.current);
      }
    };
  }, [fetchConversationDetail, fetchConversationList]);

  useEffect(() => {
    if (!canAccessMessaging) {
      return;
    }

    void loadListRef.current();
  }, [canAccessMessaging]);

  useEffect(() => {
    activeConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!canAccessMessaging) {
      return;
    }

    const socket = getMessagingSocket();
    socketRef.current = socket;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleNewMessage = (message: ConversationMessage) => {
      if (message.conversationId !== activeConversationIdRef.current) {
        void loadListRef.current();
        return;
      }

      setSelectedConversation((current) => {
        if (!current) {
          return current;
        }

        if (current.messages.some((item) => item.id === message.id)) {
          return current;
        }

        return {
          ...current,
          lastMessageText: message.body,
          lastMessageAt: message.createdAt,
          messages: [...current.messages, message],
        };
      });

      void loadListRef.current();
      socket.emit(SOCKET_EVENTS.messageRead, {
        conversationId: message.conversationId,
      });
    };

    const handleConversationUpdated = () => {
      void loadListRef.current();
    };

    const handleMessagesRead = ({
      conversationId,
      readerId,
      readAt,
    }: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (conversationId !== activeConversationIdRef.current) {
        void loadListRef.current();
        return;
      }

      setSelectedConversation((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          messages: current.messages.map((message) =>
            message.senderId === currentUser.id && readerId !== currentUser.id
              ? { ...message, readAt }
              : message,
          ),
        };
      });
    };

    const handleTyping = (payload: SocketTypingPayload) => {
      if (payload.conversationId !== activeConversationIdRef.current) {
        return;
      }

      if (payload.userId === currentUser.id) {
        return;
      }

      setTypingStatus(payload);

      window.clearTimeout(typingTimeoutRef.current ?? undefined);
      typingTimeoutRef.current = window.setTimeout(() => {
        setTypingStatus(null);
      }, 1500);
    };

    const handleStoppedTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (
        conversationId === activeConversationIdRef.current &&
        userId !== currentUser.id
      ) {
        setTypingStatus(null);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SOCKET_EVENTS.newMessage, handleNewMessage);
    socket.on(SOCKET_EVENTS.conversationUpdated, handleConversationUpdated);
    socket.on(SOCKET_EVENTS.messagesRead, handleMessagesRead);
    socket.on(SOCKET_EVENTS.userTyping, handleTyping);
    socket.on(SOCKET_EVENTS.userStoppedTyping, handleStoppedTyping);

    socket.connect();
    setSocketConnected(socket.connected);

    return () => {
      window.clearTimeout(typingTimeoutRef.current ?? undefined);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SOCKET_EVENTS.newMessage, handleNewMessage);
      socket.off(SOCKET_EVENTS.conversationUpdated, handleConversationUpdated);
      socket.off(SOCKET_EVENTS.messagesRead, handleMessagesRead);
      socket.off(SOCKET_EVENTS.userTyping, handleTyping);
      socket.off(SOCKET_EVENTS.userStoppedTyping, handleStoppedTyping);

      if (activeConversationIdRef.current) {
        socket.emit(SOCKET_EVENTS.leaveConversation, {
          conversationId: activeConversationIdRef.current,
        });
      }
    };
  }, [canAccessMessaging, currentUser.id, currentUser.fullName]);

  useEffect(() => {
    if (!canAccessMessaging) {
      return;
    }

    const socket = socketRef.current;
    const previousConversationId = activeConversationIdRef.current;

    if (previousConversationId && previousConversationId !== selectedConversationId) {
      socket?.emit(SOCKET_EVENTS.leaveConversation, {
        conversationId: previousConversationId,
      });
    }

    if (!selectedConversationId) {
      return;
    }

    socket?.emit(
      SOCKET_EVENTS.joinConversation,
      { conversationId: selectedConversationId },
      (response: { ok: boolean; error?: string }) => {
        if (!response.ok) {
          setErrorMessage(response.error ?? t("messaging.unableToJoinConversation"));
          return;
        }

        void loadDetailRef.current();
      },
    );

    if (previousConversationId !== selectedConversationId) {
      router.replace(`/messaging?conversation=${selectedConversationId}`);
    }
  }, [canAccessMessaging, router, selectedConversationId, t]);

  useEffect(() => {
    if (!canAccessMessaging || !selectedConversationId) {
      return;
    }

    if (!draftMessage.trim()) {
      const socket = socketRef.current;
      socket?.emit(SOCKET_EVENTS.stopTyping, {
        conversationId: selectedConversationId,
      });
      return;
    }

    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.emit(SOCKET_EVENTS.typing, {
      conversationId: selectedConversationId,
    });

    window.clearTimeout(typingTimeoutRef.current ?? undefined);
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit(SOCKET_EVENTS.stopTyping, {
        conversationId: selectedConversationId,
      });
    }, 1000);
  }, [canAccessMessaging, draftMessage, selectedConversationId]);

  useEffect(() => {
    if (selectedConversation?.messages.length) {
      scrollAnchorRef.current?.scrollIntoView({ block: "end" });
    }
  }, [selectedConversation?.messages.length]);

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrlRef.current) {
        window.URL.revokeObjectURL(attachmentPreviewUrlRef.current);
        attachmentPreviewUrlRef.current = null;
      }
    };
  }, []);

  function handleSelectConversation(conversationId: string) {
    setErrorMessage(null);
    setSelectedConversationId(conversationId);
    setTypingStatus(null);
    resetAttachment();
  }

  function setAttachmentSelection(nextFile: File | null) {
    if (attachmentPreviewUrlRef.current) {
      window.URL.revokeObjectURL(attachmentPreviewUrlRef.current);
      attachmentPreviewUrlRef.current = null;
    }

    setAttachmentFile(nextFile);

    if (!nextFile) {
      setAttachmentPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = window.URL.createObjectURL(nextFile);
    attachmentPreviewUrlRef.current = nextPreviewUrl;
    setAttachmentPreviewUrl(nextPreviewUrl);
  }

  function resetAttachment() {
    setAttachmentSelection(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  }

  async function uploadAttachment(file: File) {
    setIsUploadingAttachment(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/messages/attachments", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        fileUrl?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !data.fileUrl) {
        throw new Error(data.error ?? t("messaging.unableToUploadAttachment"));
      }

      return {
        fileUrl: data.fileUrl,
        fileName: data.fileName ?? file.name,
      };
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function sendMessagePayload(payload: {
    body: string;
    type: "TEXT" | "FILE" | "SYSTEM";
    fileUrl?: string | null;
    fileName?: string | null;
  }) {
    const normalizedPayload = {
      body: payload.body,
      type: payload.type,
      ...(payload.fileUrl ? { fileUrl: payload.fileUrl } : {}),
      ...(payload.fileName ? { fileName: payload.fileName } : {}),
    };

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      const response = await fetch(`/api/messages/conversations/${selectedConversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      });
      const data = (await response.json()) as {
        message?: ConversationMessage;
        error?: string;
      };

      if (!response.ok || !data.message) {
        throw new Error(data.error ?? t("messaging.unableToSendMessage"));
      }

      return data.message;
    }

    return await new Promise<ConversationMessage>((resolve, reject) => {
      socket.emit(
        SOCKET_EVENTS.sendMessage,
        {
          conversationId: selectedConversationId,
          ...normalizedPayload,
        },
        (response: {
          ok: boolean;
          message?: ConversationMessage;
          error?: string;
        }) => {
          if (!response.ok || !response.message) {
            reject(new Error(response.error ?? t("messaging.unableToSendMessage")));
            return;
          }

          resolve(response.message);
        },
      );
    });
  }

  function handleSendMessage() {
    if (isUploadingAttachment) {
      return;
    }

    const body = draftMessage.trim();

    if (!body && !attachmentFile) {
      setErrorMessage(t("messaging.emptyMessage"));
      return;
    }

    if (!selectedConversationId) {
      setErrorMessage(t("messaging.selectConversationFirst"));
      return;
    }
    void (async () => {
      try {
        let fileUrl: string | null = null;
        let fileName: string | null = null;
        let messageType: "TEXT" | "FILE" = "TEXT";
        let messageBody = body;

        if (attachmentFile) {
          const uploaded = await uploadAttachment(attachmentFile);
          fileUrl = uploaded.fileUrl;
          fileName = uploaded.fileName;
          messageType = "FILE";
          messageBody = body || uploaded.fileName || attachmentFile.name;
        }

        const savedMessage = await sendMessagePayload({
          body: messageBody,
          type: messageType,
          fileUrl,
          fileName,
        });

        setDraftMessage("");
        resetAttachment();
        setTypingStatus(null);
        setSelectedConversation((current) => {
          if (!current) {
            return current;
          }

          if (current.messages.some((message) => message.id === savedMessage.id)) {
            return current;
          }

          return {
            ...current,
            lastMessageText: savedMessage.body,
            lastMessageAt: savedMessage.createdAt,
            messages: [...current.messages, savedMessage],
          };
        });

        void loadListRef.current();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t("messaging.unableToSendMessage"),
        );
      }
    })();
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    return (
      <div className="min-h-screen overflow-x-hidden bg-background text-on-surface antialiased">
        <main className="mx-auto max-w-[1280px] px-3 pt-24 pb-6 sm:px-6 sm:pt-28 lg:px-gutter lg:pt-[132px]">
          <div className="flex min-h-[680px] items-center justify-center rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="text-center max-w-md px-6">
              <h2 className="font-h2 text-h2 text-primary mb-3">{t("messaging.unavailableTitle")}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("messaging.unavailableDescription")}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const selectedMessages = selectedConversation?.messages ?? [];
  const attachmentIsPdf =
    attachmentFile?.type === "application/pdf" ||
    attachmentFile?.name.toLowerCase().endsWith(".pdf") ||
    false;
  const activeTypingLabel =
    typingStatus && typingStatus.conversationId === selectedConversationId
      ? t("messaging.typing", { name: typingStatus.userName })
      : socketConnected
        ? t("common.activeNow")
        : t("common.connecting");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface antialiased">
      <main className="mx-auto max-w-[1280px] px-3 pt-24 pb-6 sm:px-6 sm:pt-28 lg:px-gutter lg:pt-[132px]">
        <div className="flex h-[calc(100vh-8.5rem)] min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_18px_60px_rgba(17,24,39,0.06)] md:h-[calc(100vh-9.5rem)] md:min-h-[680px] md:flex-row">
          <aside className="flex max-h-[38vh] w-full shrink-0 flex-col border-b border-outline-variant/60 bg-surface-container-low md:max-h-none md:w-[360px] md:border-b-0 md:border-r lg:w-[390px]">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-outline-variant/60 px-4 sm:px-6">
              <h2 className="font-h2 text-[26px] leading-tight text-primary sm:text-h2">{t("messaging.title")}</h2>
            </div>

            <div className="px-4 py-4 sm:px-6">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  search
                </span>
                <input
                  className="h-11 w-full rounded-full border border-outline-variant/60 bg-surface-container-low py-2 pl-10 pr-4 text-sm font-manrope placeholder-stone-400 outline-none transition-colors focus:border-secondary/40 focus:ring-0"
                  placeholder={t("messaging.searchPlaceholder")}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {listLoading ? (
                <div className="px-4 sm:px-lg py-6 text-sm text-stone-500">
                  {t("messaging.loadingConversations")}
                </div>
              ) : filteredConversations.length ? (
                filteredConversations.map((conversation, index) => {
                  const isActive = conversation.id === selectedConversationId;
                  return (
                    <button
                      className={`w-full cursor-pointer rounded-[20px] px-3 py-3 text-left transition-all sm:px-4 ${
                        isActive
                          ? "bg-secondary-container/20 shadow-sm"
                          : index === 0
                            ? "border-b border-outline-variant/20"
                            : "hover:bg-secondary-container/10"
                      }`}
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={conversation.otherParticipant.avatarUrl}
                          className="border-2 border-secondary"
                          name={conversation.otherParticipant.fullName}
                          size="md"
                        />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                          <span className="truncate font-h3 text-body-md text-primary">
                          {formatConversationTitle(conversation, t)}
                          </span>
                          <span className="shrink-0 text-label-caps text-stone-400">
                            {formatDateLabel(conversation.lastMessageAt ?? conversation.updatedAt, locale)}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant truncate font-medium">
                          {buildPreview(conversation, t)}
                        </p>
                      </div>
                        {conversation.unreadCount > 0 ? (
                          <span className="ml-2 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-secondary px-2 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 sm:px-lg py-10 text-center text-stone-500">
                  {t("messaging.noConversations")}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col bg-surface md:min-h-0">
            <header className="flex shrink-0 flex-col gap-3 border-b border-outline-variant/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:h-[72px] md:py-0">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  avatarUrl={activeConversation?.otherParticipant.avatarUrl ?? null}
                  name={activeConversation?.otherParticipant.fullName ?? "Conversation"}
                  size="md"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-h3 text-body-md leading-tight text-primary">
                    {activeConversation
                      ? formatConversationTitle(activeConversation, t)
                      : t("messaging.selectConversation")}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    <span className="shrink-0 text-label-caps text-stone-400">
                      {activeTypingLabel}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="self-start rounded-full border border-secondary px-4 py-2 font-label-caps text-xs text-secondary transition-all hover:bg-secondary-container/20 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
                type="button"
                disabled={!activeConversation?.listingId}
                onClick={() => {
                  if (activeConversation?.listingId) {
                    router.push(`/storage/${activeConversation.listingId}`);
                  }
                }}
              >
                {t("messaging.viewListing")}
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-background px-4 py-5 sm:px-6 sm:py-6">
              {detailLoading ? (
                <div className="text-sm text-stone-500">{t("messaging.loadingMessages")}</div>
              ) : selectedMessages.length ? (
                selectedMessages.map((message) => {
                  const isOutgoing = message.senderId === currentUser.id;
                  const isImage = isImageAttachment(
                    message.fileUrl,
                    message.fileName,
                  );
                  const messageStatus = isOutgoing
                    ? message.readAt
                      ? t("messaging.read")
                      : t("messaging.delivered")
                    : null;

                  return (
                    <div
                      className={`flex max-w-[88%] flex-col gap-1.5 sm:max-w-[72%] lg:max-w-[64%] ${
                          isOutgoing ? "self-end items-end" : ""
                      }`}
                      key={message.id}
                    >
                      <div
                        className={`message-bubble px-4 py-3 text-body-md leading-relaxed shadow-sm sm:px-5 ${
                          isOutgoing
                            ? "message-bubble-outgoing rounded-[22px] rounded-br-md bg-secondary text-white"
                            : "message-bubble-incoming rounded-[22px] rounded-bl-md bg-surface-container-low text-on-surface"
                        }`}
                      >
                        {message.type === "FILE" && message.fileUrl ? (
                          isImage ? (
                            <a
                              className="block overflow-hidden rounded-[18px] border border-white/20"
                              href={message.fileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <img
                                alt={message.fileName ?? message.body}
                                className="max-h-[280px] w-full object-cover"
                                src={message.fileUrl}
                              />
                            </a>
                          ) : (
                            <a
                              className="underline break-all"
                              href={message.fileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {message.fileName ?? message.body}
                            </a>
                          )
                        ) : (
                          message.body
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-sm text-label-caps text-stone-400">
                        <span>{formatTime(message.createdAt, locale)}</span>
                        {messageStatus ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-stone-300" />
                            <span className="inline-flex items-center gap-1">
                              <CheckCheck className="h-3.5 w-3.5" />
                              {messageStatus}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : selectedConversationId ? (
                <div className="m-auto max-w-md rounded-[24px] border border-outline-variant/60 bg-surface p-8 text-center text-on-surface-variant shadow-sm">
                  {t("messaging.noMessagesYet")}
                </div>
              ) : (
                <div className="m-auto max-w-md rounded-[24px] border border-outline-variant/60 bg-surface p-8 text-center text-on-surface-variant shadow-sm">
                  {t("messaging.selectConversationToStart")}
                </div>
              )}

              {errorMessage ? (
                <div className="rounded-lg border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
                  {errorMessage}
                </div>
              ) : null}

              <div ref={scrollAnchorRef} />
            </div>

            <div className="shrink-0 border-t border-outline-variant/60 bg-surface p-3 sm:p-5">
              <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low/70 p-3 shadow-[0_16px_50px_rgba(15,23,42,0.04)] transition-colors focus-within:border-secondary sm:p-4">
                {attachmentFile ? (
                  <div className="mb-3 rounded-[22px] border border-[#eadfcf] bg-white p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[18px] bg-[#f7f2ea]">
                        {attachmentIsPdf ? (
                          <span className="material-symbols-outlined text-[#f26a1b]">
                            picture_as_pdf
                          </span>
                        ) : attachmentPreviewUrl ? (
                          <img
                            alt={attachmentFile.name}
                            className="h-full w-full object-cover"
                            src={attachmentPreviewUrl}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[#f26a1b]">
                            image
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-[#1f2937]">
                          {attachmentFile.name}
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#6b7280]">
                          {t("messaging.attachmentHint")}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-stone-200 px-3 py-1.5 text-[12px] font-bold text-[#212733] transition-colors hover:bg-stone-50"
                        type="button"
                        onClick={resetAttachment}
                      >
                        {t("messaging.removeAttachment")}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-end gap-2 sm:gap-3">
                  <input
                    ref={attachmentInputRef}
                    accept="image/*,application/pdf,.pdf"
                    className="hidden"
                    type="file"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setAttachmentSelection(nextFile);
                    }}
                  />
                  <button
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-[#f26a1b]/30 hover:text-[#f26a1b] disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={isUploadingAttachment}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-[20px]" data-icon="attach_file">
                      attach_file
                    </span>
                  </button>
                  <input
                    className="min-h-11 min-w-0 flex-1 border-none bg-transparent py-2 text-body-md text-on-surface placeholder-stone-400 outline-none focus:ring-0"
                    placeholder={t("messaging.typeMessagePlaceholder")}
                    type="text"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    className="inline-flex h-11 min-w-[112px] items-center justify-center gap-2 rounded-full bg-secondary px-4 text-[13px] font-extrabold text-white transition-all hover:bg-[#d9590f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={isUploadingAttachment}
                    onClick={handleSendMessage}
                  >
                    {isUploadingAttachment ? (
                      <span className="material-symbols-outlined text-sm">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-sm" data-icon="send">
                        send
                      </span>
                    )}
                    <span>{t("common.send")}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
