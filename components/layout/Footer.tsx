import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export default async function Footer() {
  const t = createTranslator(await getServerLocale());

  const columns = [
    [t("footer.platform"), t("nav.findStorage"), t("nav.listYourSpace"), t("nav.howItWorks")],
    [t("footer.trust"), t("footer.privacy"), t("footer.terms"), t("footer.hostGuarantee")],
    [t("footer.resources"), t("footer.support"), t("footer.safety"), t("footer.cookies")],
  ];

  return (
    <footer className="w-full rounded-t-[32px] bg-[#F2F0E9] sm:rounded-t-[48px]">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-start lg:gap-12 lg:px-12 lg:py-20">
        <div className="w-full flex-none lg:w-[22rem] xl:w-[20rem]">
          <div className="mb-4 text-xl font-bold text-[#0F3D3E] sm:text-2xl">
            {t("components.layout.Footer.text.getyourcave.823e3085")}
          </div>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-stone-600">
            {t("footer.description")}
          </p>
          <div className="flex gap-3 sm:gap-4">
            <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white">
              <span className="material-symbols-outlined text-xl">share</span>
            </span>
            <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white">
              <span className="material-symbols-outlined text-xl">public</span>
            </span>
          </div>
        </div>
        <div className="grid flex-1 min-w-0 grid-cols-2 gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-16">
          {columns.map(([title, ...items]) => (
            <div key={title} className="flex flex-col gap-4">
              <h5 className="text-sm font-bold uppercase tracking-widest text-primary">{title}</h5>
              {items.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-stone-500 transition-colors hover:text-[#0F3D3E]"
                >
                  {item}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 border-t border-primary/5 px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 md:flex-row md:items-center lg:px-12">
        <p className="font-manrope text-sm text-stone-600">{t("footer.copyright")}</p>
        <p className="text-xs text-stone-400">{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
