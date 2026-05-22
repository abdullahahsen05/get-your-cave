import enCommon from "@/locales/en/common.json";
import frCommon from "@/locales/fr/common.json";

export const supportedLocales = ["en", "fr"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const languageCookieName = "gyc_locale";

export const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
} as const;

type TranslationTree = Record<string, unknown>;

function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return defaultLocale;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("fr")) {
    return "fr";
  }

  if (isLocale(normalized)) {
    return normalized;
  }

  return defaultLocale;
}

function getValueFromPath(tree: TranslationTree, key: string) {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return (value as TranslationTree)[segment];
    }

    return undefined;
  }, tree);
}

function applyInterpolation(
  value: string,
  options?: Record<string, string | number>,
) {
  if (!options) {
    return value;
  }

  return value.replace(/\{\{(\w+)\}\}/g, (_match, token: string) => {
    const replacement = options[token];
    return replacement === undefined ? "" : String(replacement);
  });
}

export function translate(
  locale: Locale,
  key: string,
  options?: Record<string, string | number>,
) {
  const source = resources[locale].common as TranslationTree;
  const fallback = resources.en.common as TranslationTree;
  const raw =
    getValueFromPath(source, key) ?? getValueFromPath(fallback, key) ?? key;

  if (typeof raw === "string") {
    return applyInterpolation(raw, options);
  }

  return key;
}

export function createTranslator(locale: Locale) {
  return (key: string, options?: Record<string, string | number>) =>
    translate(locale, key, options);
}

export function getBrowserStoredLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(languageCookieName);
  if (fromStorage) {
    return normalizeLocale(fromStorage);
  }

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${languageCookieName}=`));

  if (cookie) {
    const value = cookie.slice(languageCookieName.length + 1);
    return normalizeLocale(decodeURIComponent(value));
  }

  return null;
}

export function setBrowserLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }

  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${languageCookieName}=${encodeURIComponent(locale)}; path=/; max-age=${maxAge}; samesite=lax`;
  window.localStorage.setItem(languageCookieName, locale);
  document.documentElement.lang = locale;
}
