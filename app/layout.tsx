import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import I18nProvider from "@/components/providers/I18nProvider";
import NotificationsProvider from "@/components/providers/NotificationsProvider";
import AppChrome from "@/components/layout/AppChrome";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";
import { getCurrentUser } from "@/lib/auth";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator(await getServerLocale());

  return {
    title: t("app.layout.metadata.title"),
    description: t("app.layout.metadata.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const currentUser = await getCurrentUser();

  return (
    <html
      lang={locale}
      translate="no"
      suppressHydrationWarning
      className={`${manrope.variable} h-full antialiased`}
    >
      <head>
        <meta
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          name="viewport"
        />
        {/* App ships its own EN/FR i18n; block browser auto-translate (Google
            Translate) which mutates the DOM before hydration and breaks React. */}
        <meta name="google" content="notranslate" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-on-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <I18nProvider initialLocale={locale}>
          <NotificationsProvider initialUser={currentUser}>
            <AppChrome>{children}</AppChrome>
          </NotificationsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
