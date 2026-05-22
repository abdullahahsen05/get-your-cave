"use client";

import { createInstance, type i18n as I18nInstance } from "i18next";
import { useEffect, useMemo } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import {
  defaultLocale,
  getBrowserStoredLocale,
  normalizeLocale,
  resources,
  type Locale,
} from "@/lib/i18n";

let clientI18n: I18nInstance | null = null;

function createClientI18n(initialLocale: Locale) {
  if (clientI18n) {
    return clientI18n;
  }

  const instance = createInstance();
  instance.use(initReactI18next);

  void instance.init({
    resources,
    lng: initialLocale,
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

  clientI18n = instance;
  return instance;
}

type Props = {
  children: React.ReactNode;
  initialLocale: Locale;
};

export default function I18nProvider({ children, initialLocale }: Props) {
  const i18n = useMemo(
    () => createClientI18n(normalizeLocale(initialLocale)),
    [initialLocale],
  );

  useEffect(() => {
    const preferred = getBrowserStoredLocale() ?? normalizeLocale(initialLocale);
    if (i18n.language !== preferred) {
      void i18n.changeLanguage(preferred);
    }

    document.documentElement.lang = preferred;
  }, [i18n, initialLocale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
