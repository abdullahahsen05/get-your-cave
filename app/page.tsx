import Link from "next/link";

import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export default async function HomeLandingPageScalableExact() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);

  return (
    <div className="bg-background text-on-surface antialiased">
      <section className="min-h-screen w-full bg-[#F7F7F5] pb-20 flex items-center pt-28 sm:pt-32 lg:pt-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
            <div className="col-span-1 lg:col-span-5">
              <span className="text-[14px] font-semibold text-stone-400 tracking-[0.1em] uppercase block mb-6">
                {t("home.eyebrow")}
              </span>
              <h1 className="text-[40px] sm:text-[54px] lg:text-[64px] font-bold text-[#0F3D3E] leading-[1.1] max-w-full sm:max-w-[480px] mb-8">
                {t("home.heroTitle")}
              </h1>
              <p className="text-base sm:text-[18px] leading-[1.6] text-stone-600 max-w-full sm:max-w-[420px] mb-10">
                {t("home.heroDescription")}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                <Link
                  className="bg-[#0F3D3E] text-white px-10 h-[48px] flex items-center justify-center rounded-full font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
                  href="/storage"
                >
                  {t("home.findStorage")}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FFB800] fill-1">
                    star
                  </span>
                  <span className="text-stone-700 font-medium">
                    {t("home.trustedBy")}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block lg:col-span-1"></div>
            <div className="col-span-1 lg:col-span-6 mt-12 lg:mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px]">
                <div className="bg-[#ECEBE6] rounded-[16px] p-6 flex items-end justify-center h-[220px] sm:h-[300px] overflow-hidden shadow-sm">
                  <div className="w-3/4 h-[90%] bg-white rounded-t-[20px] border-x-[6px] border-t-[6px] border-stone-800 shadow-xl p-4">
                    <div className="w-full h-2 bg-stone-100 rounded-full mb-4"></div>
                    <div className="space-y-3">
                      <div className="w-full h-20 bg-stone-50 rounded-lg border border-stone-100"></div>
                      <div className="w-full h-4 bg-stone-50 rounded-full"></div>
                      <div className="w-2/3 h-4 bg-stone-50 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#E4E9E2] rounded-[16px] p-6 sm:p-8 flex flex-col justify-between h-[220px] sm:h-[300px] shadow-sm">
                  <span className="material-symbols-outlined text-[#0F3D3E] text-4xl">
                    public
                  </span>
                  <div>
                    <div className="text-[40px] sm:text-[52px] font-bold text-[#0F3D3E] leading-none mb-1">
                      56+
                    </div>
                    <div className="text-stone-600 font-semibold tracking-wide uppercase text-sm">
                      {t("home.featuredTitle")}
                    </div>
                  </div>
                </div>
                <div className="bg-[#F0F0F0] rounded-[16px] p-6 sm:p-8 flex flex-col justify-between h-[220px] sm:h-[300px] shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">
                      star
                    </span>
                    <span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">
                      star
                    </span>
                    <span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">
                      star
                    </span>
                    <span className="material-symbols-outlined text-[#FFB800] fill-1 text-xl">
                      star
                    </span>
                  </div>
                  <div>
                    <div className="flex -space-x-3 mb-4">
                      <img alt={t("home.userAvatarAlt")} className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqHEqt0RWhmdF_GpRoXrBzUY25jLA14ju6LIeSvMPYwZf3H9dZSOASEKdkfqeRScCXFTH4hoq0cfiZlV8EMSm_XclyLCvusTp35SYX2wafIP0p_fd6kpduiv7ukrgHELnd-fDk2Lv7FE-gg3HVUoamT1vdZsHfS3lrrbPXORM0jgfG0QPdr0VMmezeehVf_Ve7Aef3w5vAuh0AnjQd4wedPD7Y5cB3YxVld1n_DcusNzY9XsfNu-rWBU-NWkfLJY4-T3x7HjGyB6M"/>
                      <img alt={t("home.userAvatarAlt")} className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtKHr5i3U1JF7nJWj1Y0_ygAoHV2Xqn1WPKY67KGjAxE6YlhpeC_NNaNSWDN2kD8PY2b1J5NHdmYx6REoOeWw4X_XyS976X-gOP0piKjZoR3kWhPMGpr7ShEqZ1fspbD2B1Okj_9aKiBKaayQ_yRJJjYU0Vn564XjhFmif_3dQofAZcFzpa4CBZ8au-Z8MxXnC-tC224fxe1_6OHiC8aYvdQ3LyIDeSGurMw8A0zNh6X1JB3Sct6ZkW-ZRMGGV3yZnp2qIGWiJkS8"/>
                      <img alt={t("home.userAvatarAlt")} className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASvXVWmaD5vig7Ze51DeKr0wKkNvGi5zKXto_0M0SUznS8dun3SwmCMhkPVCLW0JobyQNabmMHXLgnEHWrcxAcd3vLZYKudRNf_LsSO3tsCs4Th9ABHygt01te7qxjBW3Wbb_Xcn-f64mAK6Xn-zNnpf_QMIewUpnbIZ3RRzyDwQU5IU5yfLiosQk0heVdf_PeYRPd_Ti9dGi9_Sg3hg6EeuuXdxgjfXJPoNarpFDlCVKA9YuewdG0n2QHu68xupQchZYOCE_NJ74"/>
                      <img alt={t("home.userAvatarAlt")} className="w-10 h-10 rounded-full border-2 border-[#F0F0F0]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ7anrlDclyUuJJ2JtRK3D_axEqiyEK8DXFTVdqvV3rwSAU2ikktvX_mDbgOc3PL8ZDe-bT3FxQANug1vOrE8j9vCw1qCoOKWPzve63DKrs6EcMsQbav0z7FzsTR8zN7MTniVhMOSdlXyfoi25PiKcCPyaZUZoLO-1JRgc3XXleqpReCLZuZi0rUsPz7J2mFxijBZ37RJVLRebaId7Ji8clKapJF419tTGHl9cQUSgQArmSNE0sxRtQXR1gT7f7r5Rb5f8c45JjxY"/>
                    </div>
                    <div className="text-stone-600 font-semibold tracking-wide uppercase text-sm">
                      {t("home.availableDescription")}
                    </div>
                  </div>
                </div>
                <div className="bg-[#0F3D3E] rounded-[16px] p-6 sm:p-8 flex flex-col justify-between h-[220px] sm:h-[300px] shadow-sm text-white">
                  <div className="w-full h-12 flex items-end">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 100 40">
                      <path d="M0 35 C20 35, 40 5, 60 20 C80 35, 100 10, 100 10" fill="none" stroke="#7DA8A8" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[32px] sm:text-[40px] font-bold leading-none mb-1">$196,000</div>
                    <div className="text-white/60 font-semibold tracking-wide uppercase text-sm">
                      {t("home.statsTitle")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface border-b border-outline-variant/30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <p className="text-center font-label-caps text-label-caps text-outline mb-10 opacity-60">
            {t("home.featuredTitle")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-40">
            <span className="font-display text-h3 font-bold tracking-tighter">ARCHITECTURAL DIGEST</span>
            <span className="font-display text-h3 font-bold tracking-tighter">WIRED</span>
            <span className="font-display text-h3 font-bold tracking-tighter">FORBES</span>
            <span className="font-display text-h3 font-bold tracking-tighter">DWELL</span>
            <span className="font-display text-h3 font-bold tracking-tighter">MONOCLE</span>
          </div>
        </div>
      </section>

      <section className="py-xxl bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-h1 text-h1 mb-8 text-primary">
            {t("home.statsTitle")} <span className="italic font-light">{t("home.statsDescription")}</span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{t("home.availableDescription")}</p>
        </div>
      </section>

      <section className="py-xxl bg-surface">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="p-lg flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-primary text-3xl">search</span>
              </div>
              <h3 className="font-h3 text-h3 mb-4">{t("common.search")}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("storage.approvedListings")}
              </p>
            </div>
            <div className="p-lg flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
              </div>
              <h3 className="font-h3 text-h3 mb-4">{t("common.payNow")}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("home.heroDescription")}
              </p>
            </div>
            <div className="p-lg flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-primary text-3xl">key</span>
              </div>
              <h3 className="font-h3 text-h3 mb-4">{t("home.ctaPrimary")}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("home.ctaDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xxl bg-background">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-center">
            <div className="rounded-lg overflow-hidden shadow-2xl shadow-primary/5">
              <img
                className="w-full h-[320px] sm:h-[500px] object-cover"
                alt={t("home.findStorage")}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATpxMWB32JAG2GFOK1AQmmaEIR6betJXaH2wpWO9Ect5gFsCPsA2Vq8DDAtvsW7igp-2mQjbvk2hP8LPkHsry_BkYueJulVTR-5VgXJzu0o8NSk2WRDJ_ScYjSbTsRICrrPPTYCBJjAULTqeKu_NKUKBbLPPifqa0sJbmeWFYhXKK15QPkv7i5zYaYRR5MQgXeJOub_St6njVrP96izLbV7TsTX8vYnBr7OCd0c4bqrRkP4-aEnD7ok2lWFTZwqtTafTrdu0dPykU"
              />
            </div>
            <div className="lg:pl-12">
              <span className="font-label-caps text-label-caps text-secondary mb-4 block">
                {t("home.listSpace")}
              </span>
              <h2 className="font-h1 text-h1 mb-6 text-primary">
                {t("home.ctaTitle")} <span className="italic">{t("home.ctaSecondary")}</span>
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">
                {t("home.ctaDescription")}
              </p>
              <Link
                className="bg-[#0F3D3E] text-white px-10 py-5 rounded-full font-manrope font-bold text-lg active:scale-95 transition-all"
                href="/create-listing"
              >
                {t("home.listSpace")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xxl bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
            <div>
              <h2 className="font-h1 text-h1 text-primary">{t("home.availableTitle")}</h2>
              <p className="font-body-md text-on-surface-variant mt-2">{t("home.availableDescription")}</p>
            </div>
            <Link className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all" href="/storage">
              {t("home.exploreMore")} <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter lg:h-[600px]">
            <div className="lg:col-span-2 relative rounded-lg overflow-hidden bg-surface-container shadow-inner h-[320px] sm:h-[420px] lg:h-full">
              <img
                className="w-full h-full object-cover"
                alt={t("maps.title")}
                data-location="San Francisco"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZis-myS5KP7UUoco2lzJ7dIxoSihYKp8CK-zHwJcQ_7f14dSVkAhWkwuz6lLjc1_VJEUX1zNiLLQk0vbsfjm5oN-XwjWageE8AqESZiBnjAcXZuKyp6lCHTxgiBY6Kk6FWDjSBMEZzTm8cxUpJX8kyb9uDBonzyZkB0LC3ZgJp9rsoEZIVpvz83yrB7CEgzWzAOu9mLdVssJ_sQK_jkDpDVFc87clZynwulsPaJSVweL5EhH5Zo8VLIxfa-iUZempAOZmexfKreU"
              />
              <div className="absolute top-1/3 left-1/4 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$120</div>
              <div className="absolute top-2/3 left-1/2 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$85</div>
              <div className="absolute top-1/4 left-3/4 w-10 h-10 bg-[#0F3D3E] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">$210</div>
            </div>
            <div className="flex flex-col gap-6 lg:overflow-y-auto lg:pr-2">
              <div className="bg-background p-6 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer">
                <img className="w-full h-32 object-cover rounded-md mb-4" alt={t("home.availableTitle")} src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvanMgbDoM75fNGhHAYCWN1kVhVYTie6hT-wtjwRAU5KbSqQ69pWLV-3GbQ5csInFWWy-TFQkcsYnl2wEQjPGL2XTKV8PURmMhXQiP8nemi9anwxMc1hUkMBpfOH-nZt4LQnzJBpzecxV6VWmwVdNAl1J2N4tDQiXspcOAwhlo2heLmIQ01QAtGmjB-kZ-qIjogVHeYA5lUakMVbewaARLwJg_mT_jyagDgGBYOmxsGG66PB2vKd82VgDqO4ht-0gtIpoEXZ0F-M0"/>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-h3 text-body-lg text-primary">{t("home.sampleListing1Title")}</h4>
                  <span className="font-bold text-primary">{t("home.sampleListing1Price")}</span>
                </div>
                <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span> {t("home.sampleListing1Location")}
                </p>
                <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-sm">square_foot</span> {t("home.sampleListing1Size")}
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer">
                <img className="w-full h-32 object-cover rounded-md mb-4" alt={t("home.availableTitle")} src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWoo8Zsw06j8esugC8l1o4BX3B7CACiNFhOuTTYV059ReSnhWUO-2_eXHnTWLyLbYroWkT61uVV13XZ1wTL0BKOTqJYx4i3GamXUjvsvPw5yeYejjoQCLqRND0sGvjq6yCwaZ1ZPc881TvH0UGXGTHD06YNmCIjRtLekY108ZMjEqHCt2edA3fwypj2Rlp4zyp85y_NbZFTuAVdxJpHZ3PHZ2hDpU0R2jsFEMG__0Coeh4WikKYGYYJWpYXOvOtwqLmcauQwG7VQU"/>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-h3 text-body-lg text-primary">{t("home.sampleListing2Title")}</h4>
                  <span className="font-bold text-primary">{t("home.sampleListing2Price")}</span>
                </div>
                <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span> {t("home.sampleListing2Location")}
                </p>
                <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-sm">square_foot</span> {t("home.sampleListing2Size")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xxl bg-background">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <span className="font-label-caps text-label-caps text-secondary mb-4 block">
            {t("home.statsTitle")}
          </span>
          <h2 className="font-h1 text-h1 text-primary mb-16">
            {t("home.statsDescription")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">verified_user</span>
              <h3 className="font-h3 text-h3 mb-3">{t("status.account.ACTIVE")}</h3>
              <p className="font-body-md text-on-surface-variant">{t("home.trustedBy")}</p>
            </div>
            <div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">payments</span>
              <h3 className="font-h3 text-h3 mb-3">{t("payments.successTitle")}</h3>
              <p className="font-body-md text-on-surface-variant">{t("payments.successDescription")}</p>
            </div>
            <div className="bg-surface p-xl rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">gavel</span>
              <h3 className="font-h3 text-h3 mb-3">{t("contracts.title")}</h3>
              <p className="font-body-md text-on-surface-variant">{t("contracts.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-white py-24 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-on-primary-container rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-around items-center gap-10 sm:gap-16 text-center">
            <div>
              <p className="font-display text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-tighter leading-none mb-2">12,000+</p>
              <p className="font-label-caps text-label-caps opacity-70">{t("home.availableTitle")}</p>
            </div>
            <div className="h-16 w-px bg-white/20 hidden md:block"></div>
            <div>
              <p className="font-display text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-tighter leading-none mb-2">50+</p>
              <p className="font-label-caps text-label-caps opacity-70">{t("storage.storageCaves")}</p>
            </div>
            <div className="h-16 w-px bg-white/20 hidden md:block"></div>
            <div>
              <p className="font-display text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-tighter leading-none mb-2">99.9%</p>
              <p className="font-label-caps text-label-caps opacity-70">{t("home.featuredTitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xxl bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="font-h1 text-h1 text-primary text-center mb-16">
            {t("home.featuredDescription")} <span className="italic">{t("home.availableDescription")}</span>
          </h2>
          <div className="space-y-4">
            <div className="border-b border-outline-variant/30 pb-6">
              <button className="w-full flex justify-between items-center text-left group" type="button">
                <span className="font-h3 text-body-lg text-primary">
                  {t("payments.successTitle")}
                </span>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">
                  expand_more
                </span>
              </button>
              <div className="mt-4 text-on-surface-variant font-body-md">
                {t("payments.successDescription")}
              </div>
            </div>
            <div className="border-b border-outline-variant/30 py-6">
              <button className="w-full flex justify-between items-center text-left group" type="button">
                <span className="font-h3 text-body-lg text-primary">{t("payments.cancelTitle")}</span>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">
                  expand_more
                </span>
              </button>
            </div>
            <div className="border-b border-outline-variant/30 py-6">
              <button className="w-full flex justify-between items-center text-left group" type="button">
                <span className="font-h3 text-body-lg text-primary">{t("home.ctaTitle")}</span>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">
                  expand_more
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
