"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, House, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import NotificationBadge from "./NotificationBadge";
import OtherDropdown from "./OtherDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";
import {
  getRoleNavigation,
  isPathActive,
  normalizeNavigationRole,
} from "./navigation";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export default function Topbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { unreadCount, user } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = normalizeNavigationRole(user?.role ?? null);
  const navigation = getRoleNavigation(user?.role ?? null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user || !role || !navigation) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center !px-[47px]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={t("common.open")}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 outline-none transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-[#F26A1B]/15 lg:hidden"
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link className="inline-flex shrink-0 items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-[#F26A1B] shadow-[0_0_0_1px_rgba(242,106,27,.18)]">
              <House className="h-5 w-5" />
            </span>
            <span className="hidden whitespace-nowrap text-[14px] font-extrabold tracking-[0.2em] text-[#212733] sm:block">
              GetYour<b className="text-[#F26A1B]">Cave</b>
            </span>
          </Link>
        </div>

        <div className="hidden items-center justify-center gap-2 lg:flex">
          {navigation.visible.map((item) => {
            const active = isPathActive(pathname, item.href);

            return (
              <Link
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-[#f26a1b]/10 text-[#f26a1b]"
                    : "text-[#212733] hover:bg-stone-50 hover:text-[#F26A1B]"
                }`}
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}

          {navigation.other.length ? (
            <OtherDropdown items={navigation.other} pathname={pathname} />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <NotificationBadge
            count={unreadCount}
            href="/notifications"
            label={t("nav.notifications")}
          />

          <UserMenu />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed left-2 right-2 top-[calc(72px+0.5rem)] z-[60] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[22px] border border-stone-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:left-4 sm:right-4 lg:hidden">
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c15f1a]">
                GetYourCave
              </span>
              <LanguageSwitcher />
            </div>

            <div className="space-y-2">
              {navigation.visible.map((item) => {
                const active = isPathActive(pathname, item.href);

                return (
                  <Link
                    className={`flex min-h-[58px] items-center justify-between rounded-2xl border px-4 py-4 text-[15px] font-semibold sm:px-5 ${
                      active
                        ? "border-[#f26a1b]/25 bg-[#f26a1b]/10 text-[#f26a1b]"
                        : "border-stone-100 bg-white text-[#212733] hover:bg-stone-50"
                    }`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.labelKey)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-stone-400" />
                  </Link>
                );
              })}
            </div>

            {navigation.other.length ? (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <OtherDropdown
                  className="w-full"
                  items={navigation.other}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
