"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SafeUser } from "@/lib/auth";
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

function formatTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return formatTime(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildPreview(conversation: ConversationListItem) {
  if (conversation.lastMessageText) {
    return conversation.lastMessageText;
  }

  if (conversation.booking) {
    return `Booking ${conversation.booking.bookingNumber}`;
  }

  if (conversation.listing) {
    return conversation.listing.title;
  }

  return "No messages yet";
}

function getRoleLabel(role: string) {
  if (role === "OWNER") return "Owner";
  if (role === "RENTER") return "Renter";
  return "Admin";
}

function formatConversationTitle(conversation: ConversationListItem) {
  return `${conversation.otherParticipant.fullName} (${getRoleLabel(conversation.otherParticipant.role)})`;
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
        throw new Error(data.error ?? "Unable to load conversations.");
      }

      const nextConversations = data.conversations ?? [];
      setConversations(nextConversations);

      if (!selectedConversationId && nextConversations[0]) {
        setSelectedConversationId(nextConversations[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load conversations.",
      );
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, [canAccessMessaging, selectedConversationId]);

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
        throw new Error(data.error ?? "Unable to load messages.");
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
        error instanceof Error ? error.message : "Unable to load messages.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [canAccessMessaging, currentUser.id]);

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
          setErrorMessage(response.error ?? "Unable to join conversation.");
          return;
        }

        void loadDetailRef.current();
      },
    );

    if (previousConversationId !== selectedConversationId) {
      router.replace(`/messaging?conversation=${selectedConversationId}`);
    }
  }, [canAccessMessaging, router, selectedConversationId]);

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
      setErrorMessage("Message cannot be empty.");
      return;
    }

    if (!selectedConversationId) {
      setErrorMessage("Select a conversation first.");
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
            throw new Error(data.error ?? "Unable to send message.");
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
            error instanceof Error ? error.message : "Unable to send message.",
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
          setErrorMessage(response.error ?? "Unable to send message.");
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
      <div className="bg-[#F7F7F5] text-on-surface min-h-screen overflow-x-hidden">
        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-gutter mt-24 lg:mt-[140px]">
          <div className="flex items-center justify-center min-h-[680px] bg-white rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <div className="text-center max-w-md px-6">
              <h2 className="font-h2 text-h2 text-primary mb-3">Messaging unavailable</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                This account cannot access the messaging workspace.
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
      ? `${typingStatus.userName} is typing...`
      : socketConnected
        ? "Active now"
        : "Connecting...";

  return (
    <div className="bg-[#F7F7F5] text-on-surface min-h-screen overflow-x-hidden">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-gutter mt-24 lg:mt-[140px]">
        <div className="flex flex-col md:flex-row min-h-[560px] md:min-h-[680px] md:h-[750px] bg-white rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] overflow-hidden">
          <aside className="w-full md:w-1/3 border-r-0 md:border-r border-b md:border-b-0 border-[#EBEBE8] flex flex-col bg-surface max-h-[42vh] md:max-h-none">
            <div className="h-20 px-4 sm:px-lg flex items-center border-b border-[#EBEBE8] shrink-0">
              <h2 className="font-h2 text-h2 text-primary">Messages</h2>
            </div>

            <div className="px-4 sm:px-lg pb-md mt-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm font-manrope placeholder-stone-400 focus:ring-1 focus:ring-primary"
                  placeholder="Search messages..."
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="px-4 sm:px-lg py-6 text-sm text-stone-500">
                  Loading conversations...
                </div>
              ) : filteredConversations.length ? (
                filteredConversations.map((conversation, index) => {
                  const isActive = conversation.id === selectedConversationId;
                  return (
                    <button
                      className={`w-full text-left p-md flex items-center gap-md transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#F2F0E9]"
                          : index === 0
                            ? "border-b border-[#F7F7F5]"
                            : "hover:bg-stone-50 border-b border-[#F7F7F5]"
                      }`}
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0 border-2 border-primary">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-h3 text-body-md text-primary truncate">
                            {formatConversationTitle(conversation)}
                          </span>
                          <span className="text-label-caps text-stone-400">
                            {formatDateLabel(conversation.lastMessageAt ?? conversation.updatedAt)}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant truncate font-medium">
                          {buildPreview(conversation)}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 ? (
                        <span className="ml-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 sm:px-lg py-10 text-center text-stone-500">
                  No conversations found.
                </div>
              )}
            </div>
          </aside>

          <section className="flex-1 flex flex-col bg-white min-w-0 min-h-[420px] md:min-h-0">
            <header className="px-4 sm:px-lg py-4 md:py-0 md:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EBEBE8] shrink-0">
              <div className="flex items-center gap-md min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100">
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
                  <h3 className="font-h3 text-body-md text-primary leading-tight truncate">
                    {activeConversation
                      ? formatConversationTitle(activeConversation)
                      : "Select a conversation"}
                  </h3>
                  <div className="flex items-center gap-xs">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-label-caps text-stone-400">
                      {activeTypingLabel}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="self-start sm:self-auto px-md py-2 border border-primary text-primary rounded-full font-label-caps hover:bg-stone-50 transition-all text-xs"
                type="button"
                disabled={!activeConversation?.listingId}
                onClick={() => {
                  if (activeConversation?.listingId) {
                    router.push(`/storage/${activeConversation.listingId}`);
                  }
                }}
              >
                View Listing
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-lg flex flex-col gap-lg bg-[#FCF9F8]">
              {detailLoading ? (
                <div className="text-sm text-stone-500">Loading messages...</div>
              ) : selectedMessages.length ? (
                selectedMessages.map((message) => {
                  const isOutgoing = message.senderId === currentUser.id;

                  return (
                    <div
                      className={`flex flex-col gap-sm max-w-[86%] sm:max-w-[70%] ${
                        isOutgoing ? "self-end items-end" : ""
                      }`}
                      key={message.id}
                    >
                      <div
                        className={`message-bubble p-md text-body-md leading-relaxed shadow-sm ${
                          isOutgoing
                            ? "message-bubble-outgoing bg-[#0F3D3E] text-white"
                            : "message-bubble-incoming bg-[#F2F0E9] text-on-surface"
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
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  );
                })
              ) : selectedConversationId ? (
                <div className="rounded-lg border border-[#EBEBE8] bg-white p-8 text-on-surface-variant">
                  No messages yet.
                </div>
              ) : (
                <div className="rounded-lg border border-[#EBEBE8] bg-white p-8 text-on-surface-variant">
                  Select a conversation to start messaging.
                </div>
              )}

              {errorMessage ? (
                <div className="rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
                  {errorMessage}
                </div>
              ) : null}

              <div ref={scrollAnchorRef} />
            </div>

            <div className="border-t border-[#EBEBE8] bg-white p-4 sm:p-xl">
              <div className="flex flex-wrap items-center gap-3 bg-[#F2F0E9]/50 rounded-3xl px-4 py-3 border border-[#EBEBE8] focus-within:border-primary transition-colors">
                <button className="p-sm text-stone-400 hover:text-primary transition-colors" type="button">
                  <span className="material-symbols-outlined" data-icon="attach_file">
                    attach_file
                  </span>
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-body-md placeholder-stone-400 text-on-surface py-2"
                  placeholder="Type your message..."
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
                  className="p-md bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shrink-0"
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
