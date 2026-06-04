"use client";

import { createInstance } from "i18next";
import { useEffect, useMemo } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import {
  defaultLocale,
  getBrowserStoredLocale,
  normalizeLocale,
  resources,
  type Locale,
} from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  initialLocale: Locale;
};

export default function I18nProvider({ children, initialLocale }: Props) {
  const locale = normalizeLocale(initialLocale);

  // Create a fresh i18next instance per distinct locale.
  // No module-level singleton: a singleton carries stale language state across
  // dev Fast Refreshes and server requests, causing SSR/client hydration mismatches.
  const i18n = useMemo(() => {
    const instance = createInstance();
    instance.use(initReactI18next);
    // void: init returns a Promise but resolves synchronously with inline resources
    void instance.init({
      resources,
      lng: locale,
      fallbackLng: defaultLocale,
      defaultNS: "common",
      ns: ["common"],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    return instance;
  }, [locale]);

  useEffect(() => {
    const preferred = getBrowserStoredLocale() ?? locale;
    if (i18n.language !== preferred) {
      void i18n.changeLanguage(preferred);
    }
    document.documentElement.lang = preferred;
  }, [i18n, locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
