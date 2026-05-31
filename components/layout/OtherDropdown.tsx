"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isPathActive, type NavigationItem } from "./navigation";

type OtherDropdownProps = {
  items: NavigationItem[];
  pathname: string | null;
  onNavigate?: () => void;
  className?: string;
};

export default function OtherDropdown({
  items,
  pathname,
  onNavigate,
  className,
}: OtherDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className={`relative ${className ?? ""}`} ref={rootRef}>
      <button
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-[13px] font-bold text-[#212733] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f26a1b]/30 hover:text-[#f26a1b]"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{t("nav.other")}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-[70] w-[min(92vw,320px)] overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="border-b border-stone-100 bg-gradient-to-br from-[#fff7ef] to-white px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c15f1a]">
              {t("nav.other")}
            </p>
          </div>

          <div className="p-2">
            {items.map((item) => {
              const active = isPathActive(pathname, item.href);

              return (
                <Link
                  className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[14px] font-semibold transition-colors ${
                    active
                      ? "bg-[#f26a1b]/10 text-[#f26a1b]"
                      : "text-[#212733] hover:bg-stone-50 hover:text-[#f26a1b]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
