"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationBadgeProps = {
  count: number;
  href: string;
  label: string;
  className?: string;
};

export default function NotificationBadge({
  count,
  href,
  label,
  className,
}: NotificationBadgeProps) {
  return (
    <Link
      aria-label={label}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-[#212733] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f26a1b]/30 hover:text-[#f26a1b] ${className ?? ""}`}
      href={href}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#f26a1b] px-1.5 text-[10px] font-extrabold text-white shadow-md">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
