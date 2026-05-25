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

type NavColumnItem = {
  titleKey: string;
  links: NavLinkItem[];
};

function getNavIcon(labelKey: string) {
  if (labelKey.includes("dashboard")) return "dashboard";
  if (
    labelKey.includes("payment") ||
    labelKey.includes("invoice") ||
    labelKey.includes("payout")
  ) {
    return "payments";
  }
  if (labelKey.includes("contract") || labelKey.includes("doc")) {
    return "description";
  }
  if (labelKey.includes("verify")) return "task_alt";
  if (labelKey.includes("message")) return "support_agent";
  if (labelKey.includes("storage") || labelKey.includes("listing")) return "warehouse";
  if (labelKey.includes("browse") || labelKey.includes("find")) return "search";
  if (labelKey.includes("security") || labelKey.includes("trust")) return "verified_user";
  return "star";
}

export default async function Navbar() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();
  const role = currentUser?.role ?? "PUBLIC";
  const dashboardPath = currentUser ? getDashboardPath(currentUser.role) : "/login";
  const listYourSpacePath = currentUser?.role === "OWNER" ? "/create-listing" : "/signup";

  const topNavLinks: NavLinkItem[] =
    role === "OWNER"
      ? [
          { href: "/owner/dashboard", labelKey: "nav.dashboard" },
          { href: "/storage", labelKey: "nav.browseStorage" },
          { href: "/messaging", labelKey: "nav.messages" },
          { href: "/create-listing", labelKey: "nav.createListing" },
          { href: "/contracts", labelKey: "nav.contracts" },
        ]
      : role === "RENTER"
        ? [
            { href: "/renter/dashboard", labelKey: "nav.dashboard" },
            { href: "/storage", labelKey: "nav.browseStorage" },
            { href: "/messaging", labelKey: "nav.messaging" },
            { href: "/invoices", labelKey: "nav.invoices" },
          ]
        : role === "ADMIN"
          ? [
              { href: "/admin/dashboard", labelKey: "nav.dashboard" },
              { href: "/storage", labelKey: "nav.listings" },
              { href: "/document", labelKey: "nav.verifications" },
              { href: "/invoices", labelKey: "nav.revenue" },
            ]
          : [
              { href: "/", labelKey: "nav.home" },
              { href: "/storage", labelKey: "nav.browseStorage" },
              { href: "/document", labelKey: "nav.howItWorks" },
              { href: "/storage", labelKey: "nav.pricing" },
            ];

  const menuTitle =
    role === "OWNER"
      ? t("nav.forOwners")
      : role === "RENTER"
        ? t("nav.forRenters")
        : role === "ADMIN"
          ? t("nav.platform")
          : t("nav.forOwners");

  const menuColumns: NavColumnItem[] =
    role === "OWNER"
      ? [
          {
            titleKey: "nav.listAndEarn",
            links: [
              { href: "/owner/dashboard", labelKey: "nav.dashboardOverview" },
              { href: "/create-listing", labelKey: "nav.createListing" },
              { href: "/invoices", labelKey: "nav.payoutsPayments" },
              { href: "/contracts", labelKey: "nav.contractsDocs" },
            ],
          },
            {
              titleKey: "nav.resources",
              links: [
                { href: "/document", labelKey: "nav.ownerGuide" },
                { href: "/document", labelKey: "nav.safetySecurity" },
                { href: "/storage", labelKey: "nav.pricingFees" },
                { href: "/messaging", labelKey: "nav.messages" },
              ],
            },
          {
            titleKey: "nav.tools",
            links: [
              { href: "/owner/dashboard", labelKey: "nav.dashboardOverview" },
              { href: "/invoices", labelKey: "nav.payoutsPayments" },
              { href: "/contracts", labelKey: "nav.contractsDocs" },
              { href: "/document", labelKey: "nav.verificationProcess" },
            ],
          },
        ]
      : role === "RENTER"
        ? [
            {
              titleKey: "nav.rentAndManage",
              links: [
                { href: "/renter/dashboard", labelKey: "nav.dashboardOverview" },
                { href: "/storage", labelKey: "nav.browseStorage" },
                { href: "/messaging", labelKey: "nav.messages" },
                { href: "/invoices", labelKey: "nav.invoices" },
              ],
            },
            {
              titleKey: "nav.resources",
              links: [
                { href: "/document", labelKey: "nav.renterGuide" },
                { href: "/document", labelKey: "nav.safetySecurity" },
                { href: "/storage", labelKey: "nav.pricingAvailability" },
                { href: "/messaging", labelKey: "nav.helpCenter" },
              ],
            },
            {
              titleKey: "nav.tools",
              links: [
                { href: "/renter/dashboard", labelKey: "nav.dashboardOverview" },
                { href: "/invoices", labelKey: "nav.paymentHistory" },
                { href: "/contracts", labelKey: "nav.contractsDocs" },
                { href: "/document", labelKey: "nav.verificationProcess" },
              ],
            },
          ]
        : role === "ADMIN"
          ? [
              {
                titleKey: "nav.listAndEarn",
                links: [
                  { href: "/admin/dashboard", labelKey: "nav.dashboardOverview" },
                  { href: "/storage", labelKey: "nav.listingsQueue" },
                  { href: "/document", labelKey: "nav.verifications" },
                  { href: "/invoices", labelKey: "nav.payments" },
                ],
              },
              {
                titleKey: "nav.resources",
                links: [
                  { href: "/admin/dashboard", labelKey: "nav.platformOverview" },
                  { href: "/document", labelKey: "nav.safetySecurity" },
                  { href: "/messaging", labelKey: "nav.supportMessages" },
                  { href: "/storage", labelKey: "nav.listingSearch" },
                ],
              },
              {
                titleKey: "nav.tools",
                links: [
                  { href: "/admin/dashboard", labelKey: "nav.dashboardOverview" },
                  { href: "/admin/dashboard", labelKey: "nav.revenueActivity" },
                  { href: "/document", labelKey: "nav.verificationProcess" },
                  { href: "/contracts", labelKey: "nav.contractsDocs" },
                ],
              },
            ]
          : [
              {
                titleKey: "nav.listAndEarn",
                links: [
                  { href: "/signup", labelKey: "nav.whyListYourSpace" },
                  { href: "/storage", labelKey: "nav.earningPotential" },
                  { href: "/storage", labelKey: "nav.successStories" },
                  { href: "/signup", labelKey: "nav.ownerBenefits" },
                ],
              },
              {
                titleKey: "nav.resources",
                links: [
                  { href: "/signup", labelKey: "nav.ownerGuide" },
                  { href: "/document", labelKey: "nav.safetySecurity" },
                  { href: "/storage", labelKey: "nav.pricingFees" },
                  { href: "/messaging", labelKey: "nav.helpCenter" },
                ],
              },
              {
                titleKey: "nav.tools",
                links: [
                  { href: dashboardPath, labelKey: "nav.dashboardOverview" },
                  { href: "/storage", labelKey: "nav.browseStorage" },
                  { href: "/contracts", labelKey: "nav.contractsDocs" },
                  { href: "/document", labelKey: "nav.verificationProcess" },
                ],
              },
            ];

  const roleSideLink =
    role === "OWNER"
      ? t("nav.invoices")
      : role === "RENTER"
        ? t("nav.messages")
        : role === "ADMIN"
          ? t("nav.admin")
          : t("nav.pricing");

  return (
    <header className="fixed top-[calc(1rem+env(safe-area-inset-top))] w-full z-50 px-4 sm:px-6">
      <div className="max-w-[1440px] mx-auto">
        <nav className="bg-white rounded-full px-4 sm:px-8 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 origin-top scale-100 lg:scale-[0.85]">
          <Link className="flex items-center gap-2" href="/">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#002627]">
                <span className="material-symbols-outlined text-white text-xl">
                  architecture
                </span>
              </div>
              <div className="text-sm font-bold tracking-[0.2em] text-[#002627]">
                GET YOUR CAVE
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {topNavLinks.map((item) => (
              <Link
                className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
                href={item.href}
                key={item.labelKey}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <div className="relative group">
              <button className="flex items-center gap-1 font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors py-4">
                {menuTitle}
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-[900px]">
                <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 p-10 flex gap-12">
                  {menuColumns.map((column) => (
                    <div className="flex-1" key={column.titleKey}>
                      <h4 className="font-bold text-[#002627] mb-6">{t(column.titleKey)}</h4>
                      <div className="space-y-4">
                        {column.links.map((item) => (
                          <a
                            className="flex items-center gap-3 text-stone-600 hover:text-[#002627] transition-colors"
                            href={item.href}
                            key={item.labelKey}
                          >
                            <span className="material-symbols-outlined text-stone-400">
                              {getNavIcon(item.labelKey)}
                            </span>
                            <span className="text-sm font-medium">{t(item.labelKey)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="w-72 bg-[#002627] rounded-[1.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10">
                      <h4 className="text-xl font-bold mb-3">
                        {role === "OWNER"
                          ? t("nav.ownerBenefits")
                          : role === "RENTER"
                            ? t("nav.findYourSpace")
                            : role === "ADMIN"
                              ? t("nav.adminOverview")
                              : t("nav.ownerBenefits")}
                      </h4>
                      <p className="text-white/70 text-sm mb-6 leading-relaxed">
                        {role === "OWNER"
                          ? t("nav.ownerPitch")
                          : role === "RENTER"
                            ? t("nav.renterPitch")
                            : role === "ADMIN"
                              ? t("nav.adminPitch")
                              : t("nav.publicPitch")}
                      </p>
                    </div>
                    <Link
                      className="relative z-10 bg-[#CDEBC5] text-[#002627] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-between group/btn hover:bg-white transition-colors"
                      href={listYourSpacePath}
                    >
                      {t("nav.listYourSpace")}
                      <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                    <div className="absolute bottom-0 right-0 opacity-10 translate-y-1/4">
                      <svg fill="none" height="200" viewBox="0 0 200 200" width="200">
                        <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="70" stroke="white" strokeWidth="0.5" />
                        <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="0.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Link
              className="font-semibold text-sm text-[#002627] hover:text-[#002627]/70 transition-colors"
              href={
                role === "OWNER"
                  ? "/invoices"
                  : role === "RENTER"
                    ? "/messaging"
                    : role === "ADMIN"
                      ? "/admin/dashboard"
                      : "/storage"
              }
            >
              {roleSideLink}
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            {currentUser ? (
              <>
                <LogoutButton />
                <Link
                  className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20"
                  href={dashboardPath}
                >
                  {currentUser.role === "ADMIN"
                    ? t("nav.adminDashboard")
                    : currentUser.role === "OWNER"
                      ? t("nav.ownerDashboard")
                      : t("nav.renterDashboard")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  aria-label={t("nav.login")}
                  className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                  href="/login"
                >
                  <span className="material-symbols-outlined text-xl">person</span>
                </Link>
                <Link
                  className="bg-[#002627] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#002627]/20"
                  href="/signup"
                >
                  {t("nav.joinNow")}
                </Link>
              </>
            )}
          </div>

          <details className="relative lg:hidden">
            <summary className="list-none [&::-webkit-details-marker]:hidden flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-xl">menu</span>
            </summary>

            <div className="absolute right-0 top-full mt-3 max-h-[70vh] w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto rounded-[1.5rem] border border-stone-100 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                    {t("nav.quickLinks")}
                  </p>
                  <div className="space-y-2">
                    {topNavLinks.map((item) => (
                      <Link
                        className="flex items-center justify-between rounded-2xl border border-stone-100 px-4 py-3 text-sm font-semibold text-[#002627] hover:bg-stone-50"
                        href={item.href}
                        key={item.labelKey}
                      >
                        <span>{t(item.labelKey)}</span>
                        <span className="material-symbols-outlined text-sm text-stone-400">
                          arrow_forward
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {menuColumns.map((column) => (
                    <div className="space-y-2" key={column.titleKey}>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                        {t(column.titleKey)}
                      </h4>
                      <div className="space-y-2">
                        {column.links.map((item) => (
                          <a
                            className="flex items-center justify-between rounded-2xl border border-stone-100 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-[#002627]"
                            href={item.href}
                            key={item.labelKey}
                          >
                            <span>{t(item.labelKey)}</span>
                            <span className="material-symbols-outlined text-sm text-stone-400">
                              arrow_forward
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-stone-100 pt-4">
                  <div className="flex justify-end">
                    <LanguageSwitcher />
                  </div>
                  {currentUser ? (
                    <div className="flex items-center gap-3">
                      <LogoutButton />
                      <Link
                        className="flex-1 rounded-full bg-[#002627] px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-[#002627]/20"
                        href={dashboardPath}
                      >
                        {currentUser.role === "ADMIN"
                          ? t("nav.adminDashboard")
                          : currentUser.role === "OWNER"
                            ? t("nav.ownerDashboard")
                            : t("nav.renterDashboard")}
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-bold text-[#002627]"
                        href="/login"
                      >
                        {t("nav.login")}
                      </Link>
                      <Link
                        className="rounded-full bg-[#002627] px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-[#002627]/20"
                        href="/signup"
                      >
                        {t("nav.joinNow")}
                      </Link>
                    </div>
                  )}

                  <Link
                    className="flex items-center justify-between rounded-full bg-[#CDEBC5] px-5 py-3 text-sm font-bold text-[#002627]"
                    href={listYourSpacePath}
                  >
                    <span>{t("nav.listYourSpace")}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
