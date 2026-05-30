import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import I18nProvider from "@/components/providers/I18nProvider";
import NotificationsProvider from "@/components/providers/NotificationsProvider";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

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

  return (
    <html lang={locale} className={`${manrope.variable} h-full antialiased`}>
      <head>
        <meta
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          name="viewport"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-on-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <I18nProvider initialLocale={locale}>
          <NotificationsProvider>
            <Navbar />
            {children}
          </NotificationsProvider>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
