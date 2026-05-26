import Link from "next/link";

import LogoutButton from "@/components/layout/LogoutButton";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

type NavLinkItem = {
  href: string;
  labelKey: string;
};

type NavbarRole = "PUBLIC" | "OWNER" | "RENTER" | "ADMIN";

type NavbarConfig = {
  links: NavLinkItem[];
  guestPrimaryAction?: NavLinkItem;
  loginHref?: string;
};

function getNavbarConfig(role: NavbarRole): NavbarConfig {
  if (role === "OWNER") {
    return {
      links: [
        { href: "/create-listing", labelKey: "nav.createListing" },
        { href: "/messaging", labelKey: "nav.messaging" },
        { href: "/contracts", labelKey: "nav.contracts" },
        { href: "/invoices", labelKey: "nav.invoices" },
      ],
    };
  }

  if (role === "RENTER") {
    return {
      links: [
        { href: "/storage", labelKey: "nav.browseStorage" },
        { href: "/messaging", labelKey: "nav.messaging" },
        { href: "/invoices", labelKey: "nav.invoices" },
        { href: "/contracts", labelKey: "nav.contracts" },
      ],
    };
  }

  if (role === "ADMIN") {
    return {
      links: [
        { href: "/storage", labelKey: "nav.listings" },
        { href: "/document", labelKey: "nav.verifications" },
        { href: "/invoices", labelKey: "nav.revenue" },
        { href: "/messaging", labelKey: "nav.messaging" },
      ],
    };
  }

  return {
    links: [
      { href: "/", labelKey: "nav.home" },
      { href: "/storage", labelKey: "nav.browseStorage" },
      { href: "/signup?next=/create-listing", labelKey: "nav.listYourSpace" },
    ],
    guestPrimaryAction: { href: "/signup", labelKey: "nav.joinNow" },
    loginHref: "/login",
  };
}

export default async function Navbar() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();
  const role: NavbarRole = currentUser?.role ?? "PUBLIC";
  const needsVerification =
    currentUser !== null &&
    currentUser.status !== "ACTIVE" &&
    (currentUser.role === "OWNER" || currentUser.role === "RENTER");
  const dashboardPath = currentUser
    ? needsVerification
      ? "/document"
      : getDashboardPath(currentUser.role)
    : "/login";
  const dashboardLabel = needsVerification
    ? t("nav.completeVerification")
    : currentUser?.role === "ADMIN"
      ? t("nav.adminDashboard")
      : currentUser?.role === "OWNER"
        ? t("nav.ownerDashboard")
        : t("nav.renterDashboard");
  const config = getNavbarConfig(role);

  return (
    <header className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] z-50 w-full px-2 sm:px-4 sm:top-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[1440px]">
        <nav className="relative flex min-h-[72px] items-center justify-between gap-3 rounded-[28px] border border-stone-100 bg-white px-3 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:min-h-[88px] sm:rounded-full sm:px-4 sm:py-4 lg:scale-[0.85] lg:origin-top lg:px-8">
          <Link className="flex items-center gap-3 shrink-0" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#002627] sm:h-12 sm:w-12">
              <span className="material-symbols-outlined text-xl text-white sm:text-[22px]">
                architecture
              </span>
            </div>
            <span className="hidden text-sm font-bold tracking-[0.24em] text-[#002627] sm:block">
              {t("components.layout.Navbar.text.get.your.cave.5c627b86")}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {config.links.map((item) => (
              <Link
                key={item.labelKey}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#002627] transition-colors hover:bg-stone-50 hover:text-[#002627]/75"
                href={item.href}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />

            {currentUser ? (
              <>
                <LogoutButton />
                <Link
                  className="rounded-full bg-[#002627] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20 transition-all hover:opacity-90 active:scale-95"
                  href={dashboardPath}
                >
                  {dashboardLabel}
                </Link>
              </>
            ) : (
              <>
                <Link
                  aria-label={t("nav.login")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50"
                  href={config.loginHref ?? "/login"}
                >
                  <span className="material-symbols-outlined text-xl">person</span>
                </Link>
                <Link
                  className="rounded-full bg-[#002627] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20 transition-all hover:opacity-90 active:scale-95"
                  href={config.guestPrimaryAction?.href ?? "/signup"}
                >
                  {t(config.guestPrimaryAction?.labelKey ?? "nav.joinNow")}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="scale-[0.9] origin-right">
              <LanguageSwitcher />
            </div>

            <details className="relative">
              <summary
                aria-label={t("common.open")}
                className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-stone-200 bg-white p-0 text-stone-600 outline-none transition-colors hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-[#002627]/15 [&::-webkit-details-marker]:hidden"
              >
                <span className="material-symbols-outlined block text-[22px] leading-none translate-y-[0.5px]">
                  menu
                </span>
              </summary>

              <div className="fixed left-2 right-2 top-[calc(0.75rem+env(safe-area-inset-top)+72px+1px)] z-[60] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[24px] border border-stone-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:left-4 sm:right-4 sm:top-[calc(1rem+env(safe-area-inset-top)+88px+1px)] sm:max-h-[calc(100vh-6rem)] lg:hidden">
                <div className="p-4 sm:p-5">
                  <div className="space-y-2">
                    {config.links.map((item) => (
                      <Link
                        key={item.labelKey}
                        className="flex min-h-[64px] items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-4 text-[15px] font-semibold text-[#002627] transition-colors hover:bg-stone-50 sm:px-5"
                        href={item.href}
                      >
                        <span>{t(item.labelKey)}</span>
                        <span className="material-symbols-outlined text-sm text-stone-400">
                          arrow_forward
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-stone-100 pt-4">
                    {currentUser ? (
                      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                        <LogoutButton />
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#002627] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20 transition-all hover:opacity-90 active:scale-95"
                          href={dashboardPath}
                        >
                          {dashboardLabel}
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-200 px-4 py-3 text-sm font-bold text-[#002627] transition-colors hover:bg-stone-50"
                          href={config.loginHref ?? "/login"}
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#002627] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20 transition-all hover:opacity-90 active:scale-95"
                          href={config.guestPrimaryAction?.href ?? "/signup"}
                        >
                          {t(config.guestPrimaryAction?.labelKey ?? "nav.joinNow")}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </nav>
      </div>
    </header>
  );
}
