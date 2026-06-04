"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  normalizeLocale,
  setBrowserLocale,
  type Locale,
} from "@/lib/i18n";

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "components.layout.LanguageSwitcher.label.en" },
  { value: "fr", label: "components.layout.LanguageSwitcher.label.fr" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const activeLocale = normalizeLocale(i18n.language);

  function handleChange(locale: Locale) {
    if (locale === activeLocale) {
      return;
    }

    // Update client i18next immediately (affects client components like nav/topbar).
    setBrowserLocale(locale);
    void i18n.changeLanguage(locale);

    // Re-render server components in the background so they pick up the new locale cookie.
    // startTransition marks this as non-urgent — the toggle stays responsive.
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      aria-label={t("components.layout.LanguageSwitcher.label.en")}
      className="inline-flex items-center rounded-full border border-stone-200 bg-white p-0.5 shadow-[0_4px_14px_rgba(20,25,40,0.04)]"
    >
      {OPTIONS.map((option) => {
        const active = option.value === activeLocale;

        return (
          <button
            aria-pressed={active}
            className={`min-w-8 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors outline-none focus-visible:ring-0 ${
              active
                ? "bg-[#212733] text-white"
                : "text-[#7a8090] hover:bg-stone-50 hover:text-[#212733]"
            }`}
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
          >
            {t(option.label)}
          </button>
        );
      })}
    </div>
  );
}
