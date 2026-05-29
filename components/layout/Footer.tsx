"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";

const footerColumns = [
  {
    titleKey: "footer.platform",
    items: [
      { href: "/storage", labelKey: "footer.findStorage" },
      { href: "/create-listing", labelKey: "footer.listYourSpace" },
      { href: "/#how-it-works", labelKey: "footer.howItWorks" },
      { href: "/#pricing", labelKey: "footer.pricing" },
    ],
  },
  {
    titleKey: "footer.company",
    items: [
      { href: "/#about", labelKey: "footer.about" },
      { href: "/#careers", labelKey: "footer.careers" },
      { href: "/#blog", labelKey: "footer.blog" },
      { href: "/#contact", labelKey: "footer.contact" },
    ],
  },
  {
    titleKey: "footer.legal",
    items: [
      { href: "/#terms", labelKey: "footer.terms" },
      { href: "/#privacy", labelKey: "footer.privacy" },
      { href: "/#legal", labelKey: "footer.mentions" },
      { href: "/#cookies", labelKey: "footer.cookies" },
    ],
  },
] as const;

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#181d28] text-[#aeb6c4]">
      <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))] lg:gap-16">
          <div className="max-w-sm">
            <div className="mb-4 flex items-center gap-3 text-xl font-extrabold text-white sm:text-2xl">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-[#F26A1B]">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-[18px]">
              Grenier<b className="text-[#F26A1B]">Cave</b>
            </span>
          </div>
            <p className="text-sm leading-relaxed text-[#aeb6c4]">{t("footer.description")}</p>
          </div>

          {footerColumns.map((column) => (
            <div className="flex flex-col gap-4" key={column.titleKey}>
              <h5 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                {t(column.titleKey)}
              </h5>
              {column.items.map((item) => (
                <Link
                  className="text-sm text-[#aeb6c4] transition-colors hover:text-[#F26A1B]"
                  href={item.href}
                  key={item.labelKey}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-6 text-sm text-[#aeb6c4] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <p>{t("footer.bottomLeft")}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8f98a6]">{t("footer.bottomRight")}</p>
        </div>
      </div>
    </footer>
  );
}
