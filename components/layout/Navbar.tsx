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
    <header className="fixed top-[calc(1rem+env(safe-area-inset-top))] z-50 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <nav className="flex min-h-[88px] items-center justify-between gap-4 rounded-full border border-stone-100 bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] origin-top scale-100 lg:scale-[0.85] sm:px-8">
          <Link className="flex items-center gap-3 shrink-0" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#002627]">
              <span className="material-symbols-outlined text-xl text-white">
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

          <details className="relative lg:hidden">
            <summary className="flex h-11 w-11 list-none items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
              <span className="material-symbols-outlined text-xl">menu</span>
            </summary>

            <div className="absolute right-0 top-full mt-3 w-[calc(100vw-1.5rem)] max-w-sm rounded-[24px] border border-stone-100 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  {config.links.map((item) => (
                    <Link
                      key={item.labelKey}
                      className="flex items-center justify-between rounded-2xl border border-stone-100 px-4 py-3 text-sm font-semibold text-[#002627] transition-colors hover:bg-stone-50"
                      href={item.href}
                    >
                      <span>{t(item.labelKey)}</span>
                      <span className="material-symbols-outlined text-sm text-stone-400">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                  <LanguageSwitcher />

                  {currentUser ? (
                    <div className="flex items-center gap-2">
                      <LogoutButton />
                      <Link
                        className="rounded-full bg-[#002627] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20"
                        href={dashboardPath}
                      >
                        {dashboardLabel}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        className="rounded-full border border-stone-200 px-4 py-3 text-sm font-bold text-[#002627]"
                        href={config.loginHref ?? "/login"}
                      >
                        {t("nav.login")}
                      </Link>
                      <Link
                        className="rounded-full bg-[#002627] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#002627]/20"
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
        </nav>
      </div>
    </header>
  );
}
