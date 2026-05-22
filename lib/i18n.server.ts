import { cookies } from "next/headers";

import {
  defaultLocale,
  languageCookieName,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(languageCookieName)?.value;
  return normalizeLocale(cookieLocale ?? defaultLocale);
}
