"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "./LanguageSwitcher";
import { isPathActive, publicNavigation } from "./navigation";

export default function PublicNavbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md px-[47px]">
      <div className="px-[2px]">
        <nav className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
          <Link className="inline-flex shrink-0 items-center gap-3 pr-1 sm:pr-2" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-[#F26A1B] shadow-[0_0_0_1px_rgba(242,106,27,.18)]">
              <span className="material-symbols-outlined text-[20px]">warehouse</span>
            </span>
            <span className="hidden whitespace-nowrap text-[14px] font-extrabold tracking-[0.18em] text-[#212733] sm:block">
              GetYour<b className="text-[#F26A1B]">Cave</b>
            </span>
          </Link>

          <div className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
            {publicNavigation.center.map((item) => {
              const active = isPathActive(pathname, item.href);

              return (
                <Link
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-semibold transition-colors ${
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
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              {publicNavigation.actions.map((item) => (
                <Link
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[14px] font-semibold transition-colors ${
                    item.href === "/signup"
                      ? "bg-[#F26A1B] text-white hover:bg-[#d9590f]"
                      : "text-[#212733] hover:bg-stone-50 hover:text-[#F26A1B]"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>

            <div className="relative lg:hidden" ref={menuRef}>
              <button
                aria-label={t("common.open")}
                aria-expanded={open}
                className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-stone-200 bg-white p-0 text-stone-600 outline-none transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-[#F26A1B]/15"
                type="button"
                onClick={() => setOpen((current) => !current)}
              >
                <Menu className="h-5 w-5" />
              </button>

              {open ? (
                <div className="fixed left-2 right-2 top-[calc(72px+0.5rem)] z-[60] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[22px] border border-stone-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:left-4 sm:right-4">
                  <div className="p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c15f1a]">
                        GetYourCave
                      </span>
                      <LanguageSwitcher />
                    </div>

                    <div className="space-y-2">
                      {publicNavigation.center.map((item) => {
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
                            onClick={() => setOpen(false)}
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

                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        {publicNavigation.actions.map((item) => (
                          <Link
                            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors ${
                              item.href === "/signup"
                                ? "bg-[#F26A1B] text-white hover:bg-[#d9590f]"
                                : "border border-stone-200 text-[#212733] hover:bg-stone-50"
                            }`}
                            href={item.href}
                            key={item.href}
                            onClick={() => setOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            {t(item.labelKey)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
