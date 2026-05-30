"use client";

import Link from "next/link";
import { ChevronRight, Home, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import NotificationBell from "@/components/layout/NotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import UserMenu from "@/components/layout/UserMenu";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { getDashboardPath } from "@/lib/auth-routing";

type NavLinkItem = {
  href: string;
  labelKey: string;
};

const navLinks: NavLinkItem[] = [
  { href: "/#how-it-works", labelKey: "nav.howItWorks" },
  { href: "/storage", labelKey: "nav.browseStorage" },
  { href: "/create-listing", labelKey: "nav.listYourSpace" },
  { href: "/#about", labelKey: "nav.about" },
];

export default function Navbar() {
  const { t } = useTranslation();
  const { user } = useNotifications();
  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6">
        <nav className="flex h-[72px] items-center gap-4">
          <Link className="inline-flex shrink-0 items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-[#F26A1B] shadow-[0_0_0_1px_rgba(242,106,27,.18)]">
              <Home className="h-5 w-5" />
            </span>
            <span className="hidden whitespace-nowrap text-[14px] font-extrabold tracking-[0.2em] text-[#212733] sm:block">
              GetYour<b className="text-[#F26A1B]">Cave</b>
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {navLinks.map((item) => (
              <Link
                className="whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-semibold text-[#212733] transition-colors hover:bg-stone-50 hover:text-[#F26A1B]"
                href={item.href}
                key={item.labelKey}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? <NotificationBell /> : null}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  className="hidden items-center justify-center rounded-full px-3 py-2 text-[14px] font-semibold text-[#212733] transition-colors hover:bg-stone-50 hover:text-[#F26A1B] sm:inline-flex"
                  href="/login"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  className="hidden items-center justify-center rounded-full bg-[#F26A1B] px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#d9590f] sm:inline-flex"
                  href="/signup"
                >
                  {t("nav.joinNow")}
                </Link>
              </>
            )}

            <details className="relative lg:hidden">
              <summary
                aria-label={t("common.open")}
                className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-stone-200 bg-white p-0 text-stone-600 outline-none transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-[#F26A1B]/15 [&::-webkit-details-marker]:hidden"
              >
                <Menu className="h-5 w-5" />
              </summary>

              <div className="fixed left-2 right-2 top-[calc(72px+0.5rem)] z-[60] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[22px] border border-stone-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:left-4 sm:right-4">
                <div className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
                    <LanguageSwitcher />
                  </div>

                  <div className="space-y-2">
                    {navLinks.map((item) => (
                      <Link
                        className="flex min-h-[58px] items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-4 text-[15px] font-semibold text-[#212733] transition-colors hover:bg-stone-50 sm:px-5"
                        href={item.href}
                        key={item.labelKey}
                      >
                        <span>{t(item.labelKey)}</span>
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-stone-100 pt-4">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link
                          className="flex min-h-11 items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm font-bold text-[#212733] transition-colors hover:bg-stone-50"
                          href="/profile"
                        >
                          <span>{t("nav.profile")}</span>
                          <ChevronRight className="h-4 w-4 text-stone-400" />
                        </Link>
                        <Link
                          className="flex min-h-11 items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm font-bold text-[#212733] transition-colors hover:bg-stone-50"
                          href={user ? getDashboardPath(user.role) : "/login"}
                        >
                          <span>{t("nav.dashboard")}</span>
                          <ChevronRight className="h-4 w-4 text-stone-400" />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-200 px-4 py-3 text-sm font-bold text-[#212733] transition-colors hover:bg-stone-50"
                          href="/login"
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#F26A1B] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f]"
                          href="/signup"
                        >
                          {t("nav.joinNow")}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </nav>
      </div>
    </header>
  );
}
