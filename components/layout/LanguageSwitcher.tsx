"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  normalizeLocale,
  setBrowserLocale,
  type Locale,
} from "@/lib/i18n";

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const activeLocale = normalizeLocale(i18n.language);

  function handleChange(locale: Locale) {
    if (locale === activeLocale) {
      return;
    }

    setBrowserLocale(locale);
    void i18n.changeLanguage(locale);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {OPTIONS.map((option) => {
        const active = option.value === activeLocale;

        return (
          <button
            aria-pressed={active}
            className={`min-w-10 rounded-full px-3 py-2 text-xs font-bold tracking-[0.12em] transition-colors ${
              active
                ? "bg-[#002627] text-white shadow-lg shadow-[#002627]/20"
                : "border border-stone-200 text-[#002627] hover:bg-stone-50"
            }`}
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
