"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

  function handleSelectConversation(conversationId: string) {
    setErrorMessage(null);
    setSelectedConversationId(conversationId);
    setTypingStatus(null);
  }

  function handleSendMessage() {
    const body = draftMessage.trim();
    if (!body) {
      setErrorMessage(t("messaging.emptyMessage"));
      return;
    }

    if (!selectedConversationId) {
      setErrorMessage(t("messaging.selectConversationFirst"));
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      void fetch(`/api/messages/conversations/${selectedConversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          body,
          type: "TEXT",
        }),
        })
        .then(async (response) => {
          const data = (await response.json()) as {
            message?: ConversationMessage;
            error?: string;
          };

          if (!response.ok || !data.message) {
            throw new Error(data.error ?? t("messaging.unableToSendMessage"));
          }

          const savedMessage = data.message;
          setDraftMessage("");
          setSelectedConversation((current) => {
            if (!current) {
              return current;
            }

            if (
              current.messages.some((message) => message.id === savedMessage.id)
            ) {
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
        })
        .catch((error) => {
          setErrorMessage(
            error instanceof Error ? error.message : t("messaging.unableToSendMessage"),
          );
        });
      return;
    }

    socket.emit(
      SOCKET_EVENTS.sendMessage,
      {
        conversationId: selectedConversationId,
        body,
        type: "TEXT",
      },
      (response: { ok: boolean; message?: ConversationMessage; error?: string }) => {
        if (!response.ok || !response.message) {
          setErrorMessage(response.error ?? t("messaging.unableToSendMessage"));
          return;
        }

        const savedMessage = response.message;
        setDraftMessage("");
        setTypingStatus(null);
        setSelectedConversation((current) => {
          if (!current) {
            return current;
          }

          if (
            current.messages.some((message) => message.id === savedMessage.id)
          ) {
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
      },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F7F7F5] text-on-surface antialiased">
        <main className="mx-auto max-w-[1280px] px-3 pt-24 pb-6 sm:px-6 sm:pt-28 lg:px-gutter lg:pt-[132px]">
          <div className="flex min-h-[680px] items-center justify-center rounded-[28px] border border-[#EBEBE8] bg-white shadow-[0_18px_60px_rgba(15,61,62,0.07)]">
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
  const activeTypingLabel =
    typingStatus && typingStatus.conversationId === selectedConversationId
      ? t("messaging.typing", { name: typingStatus.userName })
      : socketConnected
        ? t("common.activeNow")
        : t("common.connecting");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F7F5] text-on-surface antialiased">
      <main className="mx-auto max-w-[1280px] px-3 pt-24 pb-6 sm:px-6 sm:pt-28 lg:px-gutter lg:pt-[132px]">
        <div className="flex h-[calc(100vh-8.5rem)] min-h-[640px] flex-col overflow-hidden rounded-[28px] border border-[#EBEBE8] bg-white shadow-[0_18px_60px_rgba(15,61,62,0.07)] md:h-[calc(100vh-9.5rem)] md:min-h-[680px] md:flex-row">
          <aside className="flex max-h-[38vh] w-full shrink-0 flex-col border-b border-[#EBEBE8] bg-surface md:max-h-none md:w-[360px] md:border-b-0 md:border-r lg:w-[390px]">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#EBEBE8] px-4 sm:px-6">
              <h2 className="font-h2 text-[26px] leading-tight text-primary sm:text-h2">{t("messaging.title")}</h2>
            </div>

            <div className="px-4 py-4 sm:px-6">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  search
                </span>
                <input
                  className="h-11 w-full rounded-full border border-transparent bg-surface-container-low py-2 pl-10 pr-4 text-sm font-manrope placeholder-stone-400 outline-none transition-colors focus:border-primary/40 focus:ring-0"
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
                          ? "bg-[#F2F0E9] shadow-sm"
                          : index === 0
                            ? "border-b border-[#F7F7F5]"
                            : "hover:bg-stone-50"
                      }`}
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary bg-stone-200">
                        <img
                          alt={conversation.otherParticipant.fullName}
                          className="w-full h-full object-cover"
                          src={
                            conversation.listing?.imageUrl ??
                            conversation.otherParticipant.avatarUrl ??
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuCqHEqt0RWhmdF_GpRoXrBzUY25jLA14ju6LIeSvMPYwZf3H9dZSOASEKdkfqeRScCXFTH4hoq0cfiZlV8EMSm_XclyLCvusTp35SYX2wafIP0p_fd6kpduiv7ukrgHELnd-fDk2Lv7FE-gg3HVUoamT1vdZsHfS3lrrbPXORM0jgfG0QPdr0VMmezeehVf_Ve7Aef3w5vAuh0AnjQd4wedPD7Y5cB3YxVld1n_DcusNzY9XsfNu-rWBU-NWkfLJY4-T3x7HjGyB6M"
                          }
                        />
                      </div>
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
                          <span className="ml-2 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-white">
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

          <section className="flex min-h-0 flex-1 flex-col bg-white md:min-h-0">
            <header className="flex shrink-0 flex-col gap-3 border-b border-[#EBEBE8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:h-[72px] md:py-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-stone-100 ring-1 ring-[#EBEBE8]">
                  <img
                    alt={activeConversation?.otherParticipant.fullName ?? "Conversation"}
                    className="w-full h-full object-cover"
                    src={
                      activeConversation?.listing?.imageUrl ??
                      activeConversation?.otherParticipant.avatarUrl ??
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6C9w5Tqvfc-90F9fdaBHWaObKDwFDoXsXhzQ5pXeRgLhDB7p15rxNJ9eUWqcwncLUN0K-VwDPiSjZ5pX5ZQj2ow7MujHzGikGDfsRUSwQaEyjFR6BV4SRt1uTFTQmEnOOaDUHRBKorYf6mB4VONoBAMEwKniJ678K5i95jdPq-3x3Wdj65V0n5j_qzXLsxWKw-hIBbS5VqY9AKwrAwktcpBYdwR4J-pr7RZI910oKR7YoFXK9zOPBAf1QXrBC3nL6vprXmHB-CMQ"
                    }
                  />
                </div>
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
                className="self-start rounded-full border border-primary px-4 py-2 font-label-caps text-xs text-primary transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
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

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#FCF9F8] px-4 py-5 sm:px-6 sm:py-6">
              {detailLoading ? (
                <div className="text-sm text-stone-500">{t("messaging.loadingMessages")}</div>
              ) : selectedMessages.length ? (
                selectedMessages.map((message) => {
                  const isOutgoing = message.senderId === currentUser.id;

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
                            ? "message-bubble-outgoing rounded-[22px] rounded-br-md bg-[#0F3D3E] text-white"
                            : "message-bubble-incoming rounded-[22px] rounded-bl-md bg-[#F2F0E9] text-on-surface"
                        }`}
                      >
                        {message.type === "FILE" && message.fileUrl ? (
                          <a
                            className="underline break-all"
                            href={message.fileUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {message.fileName ?? message.body}
                          </a>
                        ) : (
                          message.body
                        )}
                      </div>
                      <span className="text-label-caps text-stone-400 px-sm">
                        {formatTime(message.createdAt, locale)}
                      </span>
                    </div>
                  );
                })
              ) : selectedConversationId ? (
                <div className="m-auto max-w-md rounded-[24px] border border-[#EBEBE8] bg-white p-8 text-center text-on-surface-variant shadow-sm">
                  {t("messaging.noMessagesYet")}
                </div>
              ) : (
                <div className="m-auto max-w-md rounded-[24px] border border-[#EBEBE8] bg-white p-8 text-center text-on-surface-variant shadow-sm">
                  {t("messaging.selectConversationToStart")}
                </div>
              )}

              {errorMessage ? (
                <div className="rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
                  {errorMessage}
                </div>
              ) : null}

              <div ref={scrollAnchorRef} />
            </div>

            <div className="shrink-0 border-t border-[#EBEBE8] bg-white p-3 sm:p-5">
              <div className="flex items-end gap-2 rounded-[28px] border border-[#EBEBE8] bg-[#F2F0E9]/50 px-3 py-2 transition-colors focus-within:border-primary sm:gap-3 sm:px-4 sm:py-3">
                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-white hover:text-primary" type="button">
                  <span className="material-symbols-outlined" data-icon="attach_file">
                    attach_file
                  </span>
                </button>
                <input
                  className="min-h-10 min-w-0 flex-1 border-none bg-transparent py-2 text-body-md text-on-surface placeholder-stone-400 outline-none focus:ring-0"
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:opacity-90 active:scale-95"
                  type="button"
                  onClick={handleSendMessage}
                >
                  <span className="material-symbols-outlined text-sm" data-icon="send">
                    send
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
