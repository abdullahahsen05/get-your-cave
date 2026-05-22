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
    <footer className="bg-[#F2F0E9] w-full rounded-t-[48px]">
      <div className="flex flex-col md:flex-row justify-between items-start py-20 px-12 max-w-[1440px] mx-auto gap-12">
        <div className="w-full md:w-[22rem] lg:w-[20rem] flex-none">
          <div className="mb-4 text-2xl font-bold text-[#0F3D3E]">GETYOURCAVE</div>
          <p className="mb-8 text-sm leading-relaxed text-stone-600">{t("footer.description")}</p>
          <div className="flex gap-4">
            <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white">
              <span className="material-symbols-outlined text-xl">share</span>
            </span>
            <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white">
              <span className="material-symbols-outlined text-xl">public</span>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-16 flex-1 min-w-0">
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
      <div className="max-w-[1440px] mx-auto px-12 pb-12 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-manrope text-sm text-stone-600">{t("footer.copyright")}</p>
        <p className="text-xs text-stone-400">{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
