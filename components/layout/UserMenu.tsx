"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/components/ui/UserAvatar";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export default function UserMenu() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useNotifications();
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

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-label={t("nav.profileMenu")}
        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 pr-3 text-[#212733] shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-[#f26a1b]/30 hover:text-[#f26a1b] focus-visible:ring-2 focus-visible:ring-[#f26a1b]/15"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <UserAvatar
          avatarUrl={user.avatarUrl}
          className="h-8 w-8 ring-0"
          name={user.fullName}
          size="sm"
        />
        <span className="hidden max-w-[140px] truncate text-[13px] font-bold sm:block">
          {user.fullName}
        </span>
        <ChevronDown className="h-4 w-4 text-stone-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[280px] overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="border-b border-stone-100 bg-gradient-to-br from-[#fff7ef] to-white px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c15f1a]">
              {t("nav.profile")}
            </p>
            <h3 className="mt-1 truncate text-[16px] font-extrabold text-[#1f2937]">
              {user.fullName}
            </h3>
            <p className="mt-1 truncate text-[13px] text-[#6b7280]">{user.email}</p>
          </div>

          <div className="p-2">
            <Link
              className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[14px] font-semibold text-[#212733] transition-colors hover:bg-stone-50 hover:text-[#f26a1b]"
              href="/profile"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              <span>{t("nav.profile")}</span>
            </Link>
            <button
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-[14px] font-semibold text-[#212733] transition-colors hover:bg-stone-50 hover:text-[#f26a1b]"
              type="button"
              onClick={() => {
                setOpen(false);
                void handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
