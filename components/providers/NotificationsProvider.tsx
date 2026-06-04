"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { SafeUser } from "@/lib/auth";
import { closeMessagingSocket, getMessagingSocket } from "@/lib/socket-client";
import {
  SOCKET_EVENTS,
  type SocketNotificationPayload,
} from "@/lib/socket/events";
import { translateNotification } from "@/lib/notifications-i18n";
import { useTranslation } from "react-i18next";

type NotificationItem = SocketNotificationPayload;

type NotificationsContextValue = {
  user: SafeUser | null;
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<NotificationItem | null>;
  markAllNotificationsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}

export default function NotificationsProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SafeUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<SafeUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications?limit=20", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load notifications.");
      }

      setNotifications(sortNotifications(data.notifications ?? []));
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const loadSession = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch session. Only update user state on a definitive server response.
      // Never clear the user on network errors or transient failures — those must
      // not log out a valid session. Server-side layout guards handle true expiry.
      const response = await fetch("/api/auth/session", {
        headers: { Accept: "application/json" },
      });

      let activeUser: SafeUser | null = null;

      if (response.ok) {
        const data = (await response.json()) as {
          user?: SafeUser | null;
        };
        activeUser = data.user ?? null;
        setUser(activeUser);

        if (!activeUser || (activeUser.role !== "OWNER" && activeUser.role !== "RENTER")) {
          setNotifications([]);
          setUnreadCount(0);
          setToasts([]);
          closeMessagingSocket();
          return;
        }
      } else {
        // Non-OK session response — don't change user state, just stop here.
        return;
      }

      // Fetch notifications for the confirmed owner/renter user.
      try {
        const notificationsResponse = await fetch("/api/notifications?limit=20", {
          headers: { Accept: "application/json" },
        });

        if (notificationsResponse.ok) {
          const notificationsData = (await notificationsResponse.json()) as {
            notifications?: NotificationItem[];
            unreadCount?: number;
          };
          setNotifications(sortNotifications(notificationsData.notifications ?? []));
          setUnreadCount(notificationsData.unreadCount ?? 0);
        }
        // If notifications fetch is non-OK, just keep existing notifications.
      } catch {
        // Notifications network error — keep existing notifications, don't clear user.
      }
    } catch {
      // Session fetch failed completely (network error) — do NOT touch user state.
      // The existing user remains; server-side guards will redirect on true expiry.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSession();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadSession, pathname]);

  useEffect(() => {
    if (!user || (user.role !== "OWNER" && user.role !== "RENTER")) {
      return;
    }

    const socket = getMessagingSocket();

    const handleNotificationCreated = ({
      notification,
      unreadCount: nextUnreadCount,
    }: {
      notification: NotificationItem;
      unreadCount: number;
    }) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return sortNotifications(
            current.map((item) =>
              item.id === notification.id ? notification : item,
            ),
          );
        }

        return sortNotifications([notification, ...current].slice(0, 20));
      });
      setUnreadCount(nextUnreadCount);
      setToasts((current) => [notification, ...current].slice(0, 3));
    };

    const handleNotificationsUpdated = ({
      unreadCount: nextUnreadCount,
    }: {
      unreadCount: number;
    }) => {
      setUnreadCount(nextUnreadCount);
      void refreshNotifications();
    };

    socket.on(SOCKET_EVENTS.notificationCreated, handleNotificationCreated);
    socket.on(SOCKET_EVENTS.notificationsUpdated, handleNotificationsUpdated);
    socket.connect();

    return () => {
      socket.off(SOCKET_EVENTS.notificationCreated, handleNotificationCreated);
      socket.off(SOCKET_EVENTS.notificationsUpdated, handleNotificationsUpdated);
    };
  }, [refreshNotifications, user]);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3000),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!user) {
        return null;
      }

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        notification?: NotificationItem;
        unreadCount?: number;
        error?: string;
      };

      if (!response.ok || !data.notification) {
        throw new Error(data.error ?? "Unable to update notification.");
      }

      setNotifications((current) =>
        sortNotifications(
          current.map((item) =>
            item.id === data.notification?.id ? data.notification : item,
          ),
        ),
      );
      setUnreadCount(data.unreadCount ?? 0);

      return data.notification;
    },
    [user],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) {
      return;
    }

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    const data = (await response.json()) as {
      notifications?: NotificationItem[];
      unreadCount?: number;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to update notifications.");
    }

    setNotifications(sortNotifications(data.notifications ?? []));
    setUnreadCount(data.unreadCount ?? 0);
  }, [user]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      user,
      isLoading,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      isLoading,
      markAllNotificationsRead,
      markNotificationRead,
      notifications,
      refreshNotifications,
      unreadCount,
      user,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-[88px] z-[80] flex justify-end px-3 sm:px-6 lg:px-8">
        <div className="w-full max-w-[420px] space-y-3">
          {toasts.map((toast) => {
            const translatedToast = translateNotification(toast, t);
            return (
              <button
                className="pointer-events-auto w-full rounded-[24px] border border-white/70 bg-[rgba(255,255,255,0.9)] p-4 text-left shadow-[0_20px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform hover:-translate-y-0.5"
                key={toast.id}
                type="button"
                onClick={async () => {
                  try {
                    await markNotificationRead(toast.id);
                    if (toast.linkUrl) {
                      router.push(toast.linkUrl);
                    }
                  } catch {
                    // Toasts should stay lightweight and never block navigation.
                  }
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f26a1b]/10 text-[#f26a1b]">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#9a5a26]">
                      {t("notifications.title")}
                    </p>
                    <h4 className="mt-1 truncate text-[15px] font-extrabold text-[#1f2937]">
                      {translatedToast.title}
                    </h4>
                    {translatedToast.body ? (
                      <p className="mt-1 max-h-[3rem] overflow-hidden text-[14px] leading-6 text-[#4b5563]">
                        {translatedToast.body}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </NotificationsContext.Provider>
  );
}
