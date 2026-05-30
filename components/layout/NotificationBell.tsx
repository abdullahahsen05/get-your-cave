"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, ChevronDown, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useNotifications } from "@/components/providers/NotificationsProvider";
import { normalizeLocale } from "@/lib/i18n";

function formatTimeLabel(value: string | null, locale: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    user,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [notifications],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (!user || (user.role !== "OWNER" && user.role !== "RENTER")) {
    return null;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[#212733] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f26a1b]/30 hover:text-[#f26a1b]"
        type="button"
        aria-label={t("notifications.openCenter")}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#f26a1b] px-1.5 text-[10px] font-extrabold text-white shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(92vw,420px)] overflow-hidden rounded-[26px] border border-stone-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 bg-gradient-to-br from-[#fff7ef] to-white px-5 py-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c15f1a]">
                {t("notifications.title")}
              </p>
              <h3 className="mt-1 text-[16px] font-extrabold text-[#1f2937]">
                {t("notifications.subtitle")}
              </h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-[12px] font-bold text-[#212733] transition-colors hover:border-[#f26a1b]/30 hover:text-[#f26a1b]"
                href="/notifications"
                onClick={() => setIsOpen(false)}
              >
                <ExternalLink className="h-4 w-4" />
                {t("common.open")}
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-[12px] font-bold text-[#212733] transition-colors hover:border-[#f26a1b]/30 hover:text-[#f26a1b]"
                type="button"
                onClick={async () => {
                  await markAllNotificationsRead();
                  setIsOpen(false);
                }}
              >
                <CheckCheck className="h-4 w-4" />
                {t("notifications.markAllRead")}
              </button>
            </div>
          </div>

          <div className="max-h-[32rem] overflow-y-auto bg-[#fcfbf8]">
            {sortedNotifications.length ? (
              sortedNotifications.map((notification) => {
                const unread = !notification.readAt;

                return (
                  <button
                    className={`flex w-full items-start gap-3 border-b border-stone-100 px-5 py-4 text-left transition-colors last:border-b-0 ${
                      unread ? "bg-white" : "bg-[#fcfbf8]"
                    } hover:bg-[#fff9f4]`}
                    key={notification.id}
                    type="button"
                    onClick={async () => {
                      await markNotificationRead(notification.id);
                      if (notification.linkUrl) {
                        router.push(notification.linkUrl);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div
                      className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                        unread ? "bg-[#f26a1b]/10 text-[#f26a1b]" : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        mail
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-extrabold text-[#1f2937]">
                            {notification.title}
                          </p>
                          {notification.body ? (
                            <p className="mt-1 text-[13px] leading-6 text-[#4b5563]">
                              {notification.body}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                            unread ? "bg-[#f26a1b]" : "bg-transparent"
                          }`}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa0a6]">
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                        <span>{formatTimeLabel(notification.createdAt, locale)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-8 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-[#f26a1b]/10 text-[#f26a1b]">
                  <Bell className="h-7 w-7" />
                </div>
                <h4 className="mt-4 text-[16px] font-extrabold text-[#1f2937]">
                  {t("notifications.emptyTitle")}
                </h4>
                <p className="mt-2 max-w-sm text-[14px] leading-6 text-[#6b7280]">
                  {t("notifications.emptyDescription")}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
