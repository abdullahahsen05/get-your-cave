"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Car,
  Check,
  ChevronRight,
  Globe,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Warehouse,
} from "lucide-react";

import { getBrowserStoredLocale, setBrowserLocale } from "@/lib/i18n";

type HowMode = "find" | "rent";

const featuredImages = [
  "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1776286287566-19327c13932a?auto=format&fit=crop&w=600&q=70",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=70",
] as const;

const categoryIcons = [Package, Warehouse, Sparkles, Car] as const;

const heroBullets = [
  "landing.hero.bullet1",
  "landing.hero.bullet2",
  "landing.hero.bullet3",
] as const;

const listingData = [
  {
    image: featuredImages[0],
    badge: "landing.featured.cards.card1.badge",
    title: "landing.featured.cards.card1.title",
    location: "landing.featured.cards.card1.location",
    price: "landing.featured.cards.card1.price",
    size: "landing.featured.cards.card1.size",
    type: "landing.featured.cards.card1.type",
    amenity: "landing.featured.cards.card1.amenity",
    icon: ShieldCheck,
  },
  {
    image: featuredImages[1],
    badge: "landing.featured.cards.card2.badge",
    title: "landing.featured.cards.card2.title",
    location: "landing.featured.cards.card2.location",
    price: "landing.featured.cards.card2.price",
    size: "landing.featured.cards.card2.size",
    type: "landing.featured.cards.card2.type",
    amenity: "landing.featured.cards.card2.amenity",
    icon: BadgeCheck,
  },
  {
    image: featuredImages[2],
    badge: "landing.featured.cards.card3.badge",
    title: "landing.featured.cards.card3.title",
    location: "landing.featured.cards.card3.location",
    price: "landing.featured.cards.card3.price",
    size: "landing.featured.cards.card3.size",
    type: "landing.featured.cards.card3.type",
    amenity: "landing.featured.cards.card3.amenity",
    icon: Star,
  },
  {
    image: featuredImages[3],
    badge: "landing.featured.cards.card4.badge",
    title: "landing.featured.cards.card4.title",
    location: "landing.featured.cards.card4.location",
    price: "landing.featured.cards.card4.price",
    size: "landing.featured.cards.card4.size",
    type: "landing.featured.cards.card4.type",
    amenity: "landing.featured.cards.card4.amenity",
    icon: Building2,
  },
  {
    image: featuredImages[4],
    badge: "landing.featured.cards.card5.badge",
    title: "landing.featured.cards.card5.title",
    location: "landing.featured.cards.card5.location",
    price: "landing.featured.cards.card5.price",
    size: "landing.featured.cards.card5.size",
    type: "landing.featured.cards.card5.type",
    amenity: "landing.featured.cards.card5.amenity",
    icon: Sparkles,
  },
  {
    image: featuredImages[5],
    badge: "landing.featured.cards.card6.badge",
    title: "landing.featured.cards.card6.title",
    location: "landing.featured.cards.card6.location",
    price: "landing.featured.cards.card6.price",
    size: "landing.featured.cards.card6.size",
    type: "landing.featured.cards.card6.type",
    amenity: "landing.featured.cards.card6.amenity",
    icon: Globe,
  },
] as const;

const rateMap: Record<string, number> = {
  cave: 7.5,
  box: 8.5,
  grand: 7.5,
  garage: 8,
};

function calcRevenue(type: string, surface: number, multiplier: string) {
  const gross = (rateMap[type] ?? 7.5) * surface * Number(multiplier);
  return Math.max(15, Math.round(gross * 0.92));
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<HowMode>("find");
  const [surface, setSurface] = useState(6);
  const [cityMultiplier, setCityMultiplier] = useState("1.9");
  const [spaceType, setSpaceType] = useState("cave");

  const revenue = calcRevenue(spaceType, surface, cityMultiplier);

  useEffect(() => {
    const storedLocale = getBrowserStoredLocale();
    if (!storedLocale && i18n.language !== "fr") {
      setBrowserLocale("fr");
      void i18n.changeLanguage("fr");
    }
  }, [i18n]);

  const howCards =
    mode === "find"
      ? [
          {
            step: "1",
            title: t("landing.how.find.step1.title"),
            description: t("landing.how.find.step1.description"),
          },
          {
            step: "2",
            title: t("landing.how.find.step2.title"),
            description: t("landing.how.find.step2.description"),
          },
          {
            step: "3",
            title: t("landing.how.find.step3.title"),
            description: t("landing.how.find.step3.description"),
          },
        ]
      : [
          {
            step: "1",
            title: t("landing.how.rent.step1.title"),
            description: t("landing.how.rent.step1.description"),
          },
          {
            step: "2",
            title: t("landing.how.rent.step2.title"),
            description: t("landing.how.rent.step2.description"),
          },
          {
            step: "3",
            title: t("landing.how.rent.step3.title"),
            description: t("landing.how.rent.step3.description"),
          },
        ];

  const categories = [
    {
      icon: categoryIcons[0],
      title: t("landing.categories.card1.title"),
      meta: t("landing.categories.card1.meta"),
    },
    {
      icon: categoryIcons[1],
      title: t("landing.categories.card2.title"),
      meta: t("landing.categories.card2.meta"),
    },
    {
      icon: categoryIcons[2],
      title: t("landing.categories.card3.title"),
      meta: t("landing.categories.card3.meta"),
    },
    {
      icon: categoryIcons[3],
      title: t("landing.categories.card4.title"),
      meta: t("landing.categories.card4.meta"),
    },
  ] as const;

  const testimonials = [
    {
      initials: "ML",
      quote: t("landing.testimonials.quote1.quote"),
      name: t("landing.testimonials.quote1.name"),
      role: t("landing.testimonials.quote1.role"),
    },
    {
      initials: "TB",
      quote: t("landing.testimonials.quote2.quote"),
      name: t("landing.testimonials.quote2.name"),
      role: t("landing.testimonials.quote2.role"),
    },
    {
      initials: "SD",
      quote: t("landing.testimonials.quote3.quote"),
      name: t("landing.testimonials.quote3.name"),
      role: t("landing.testimonials.quote3.role"),
    },
  ] as const;

  return (
    <main className="overflow-x-hidden bg-background text-on-surface">
      <section className="bg-[#1d2330] text-white">
        <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 sm:py-20 lg:px-6 lg:py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-[50px]">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#F26A1B]/15 px-4 py-2 text-[13px] font-semibold text-[#ffb27d]">
                {t("landing.hero.badge")}
              </span>
              <h1 className="max-w-[560px] text-[46px] font-extrabold leading-[1.08] tracking-[-0.5px] text-white sm:text-[56px] lg:text-[58px]">
                {t("landing.hero.titlePrefix")} <span className="text-[#F26A1B]">{t("landing.hero.titleAccent")}</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[17px] leading-8 text-[#c4cbd8]">
                {t("landing.hero.description")}
              </p>
              <ul className="mt-6 flex flex-col gap-2">
                {heroBullets.map((key) => (
                  <li className="flex items-center gap-3 text-[15px] text-[#dde2ec]" key={key}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#F26A1B]">
                      <Check className="h-3 w-3" />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>

              <form className="mt-8 flex max-w-[520px] flex-col gap-3 rounded-[14px] bg-white p-2 shadow-[0_10px_30px_rgba(20,25,40,.08)] sm:flex-row">
                <div className="flex flex-1 items-center gap-2 px-4 py-3 text-[#212733]">
                  <Search className="h-4 w-4 text-[#6b7280]" />
                  <input
                    aria-label={t("landing.hero.searchPlaceholder")}
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#8a8f98]"
                    placeholder={t("landing.hero.searchPlaceholder")}
                    type="text"
                  />
                </div>
                <button
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#F26A1B] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#d9590f]"
                  type="submit"
                >
                  {t("landing.hero.searchAction")}
                </button>
              </form>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] shadow-[0_30px_60px_rgba(0,0,0,.4)]">
                <img
                  alt={t("landing.hero.imageAlt")}
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=900&q=80"
                />
                <div className="absolute left-4 bottom-4 flex items-center gap-3 rounded-[12px] bg-white px-4 py-3 text-[#212733] shadow-[0_10px_30px_rgba(20,25,40,.15)]">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#FDEEE4] text-[#F26A1B]">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[14px] font-bold">{t("landing.hero.badgeTitle")}</div>
                    <div className="text-[12px] text-[#5b6573]">{t("landing.hero.badgeSubtitle")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F26A1B] text-white">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 text-center sm:grid-cols-4">
          {[
            ["landing.stats.one.value", "landing.stats.one.label"],
            ["landing.stats.two.value", "landing.stats.two.label"],
            ["landing.stats.three.value", "landing.stats.three.label"],
            ["landing.stats.four.value", "landing.stats.four.label"],
          ].map(([valueKey, labelKey], index) => (
            <div
              className={`px-6 py-8 ${index < 3 ? "sm:border-r sm:border-white/25" : ""}`}
              key={valueKey}
            >
              <div className="text-[34px] font-extrabold leading-none">{t(valueKey)}</div>
              <div className="mt-2 text-[14px] opacity-90">{t(labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20 lg:py-[70px]" id="how-it-works">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6">
          <span className="mb-2 block text-center text-[13px] font-bold uppercase tracking-[1.5px] text-[#F26A1B]">
            {t("landing.how.eyebrow")}
          </span>
          <h2 className="text-center text-[32px] font-extrabold tracking-[-0.4px] text-[#212733]">
            {t("landing.how.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-center text-[16px] text-[#5b6573]">
            {t("landing.how.subtitle")}
          </p>

          <div className="mt-7 flex justify-center">
            <div className="flex gap-2 rounded-full">
              <button
                className={`rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors ${
                  mode === "find"
                    ? "border-[#F26A1B] bg-[#F26A1B] text-white"
                    : "border-[#e7e9ee] bg-white text-[#212733]"
                }`}
                type="button"
                onClick={() => setMode("find")}
              >
                {t("landing.how.tabs.find")}
              </button>
              <button
                className={`rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors ${
                  mode === "rent"
                    ? "border-[#F26A1B] bg-[#F26A1B] text-white"
                    : "border-[#e7e9ee] bg-white text-[#212733]"
                }`}
                type="button"
                onClick={() => setMode("rent")}
              >
                {t("landing.how.tabs.rent")}
              </button>
            </div>
          </div>

          <div className="mt-11 grid grid-cols-1 gap-6 md:grid-cols-3">
            {howCards.map((card) => (
              <div
                className="rounded-[14px] bg-white px-3 py-0 text-center"
                key={card.step}
              >
                <div className="mx-auto mb-4 mt-0 grid h-11 w-11 place-items-center rounded-full bg-[#F26A1B] text-[18px] font-extrabold text-white">
                  {card.step}
                </div>
                <h3 className="mb-2 text-[18px] font-semibold text-[#212733]">{card.title}</h3>
                <p className="text-[14px] leading-6 text-[#5b6573]">{card.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <section className="bg-[#f5f6f8] py-16 sm:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6">
          <span className="mb-2 block text-[13px] font-bold uppercase tracking-[1.5px] text-[#F26A1B]">
            {t("landing.featured.eyebrow")}
          </span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[32px] font-extrabold tracking-[-0.4px] text-[#212733]">
                {t("landing.featured.title")}
              </h2>
              <p className="mt-2 text-[16px] text-[#5b6573]">{t("landing.featured.subtitle")}</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listingData.map((listing) => {
              const Icon = listing.icon;
              return (
                <article
                  className="group flex flex-col overflow-hidden rounded-[14px] border border-[#e7e9ee] bg-white shadow-[0_4px_14px_rgba(20,25,40,0.06)] transition-transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(20,25,40,0.08)]"
                  key={listing.title}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f6f8]">
                    <img
                      alt={t(listing.title)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      loading="lazy"
                      src={listing.image}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-[#F26A1B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                      {t(listing.badge)}
                    </span>
                    <button
                      aria-label={t("landing.featured.save")}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#5b6573] shadow-sm transition-colors hover:text-[#F26A1B]"
                      type="button"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[16px] font-semibold leading-6 text-[#212733]">
                          {t(listing.title)}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-[13px] text-[#5b6573]">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {t(listing.location)}
                        </p>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f6f8] text-[#212733]">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#e7e9ee] bg-[#f5f6f8] px-3 py-1 text-[12px] font-semibold text-[#444e5c]">
                        {t(listing.type)}
                      </span>
                      <span className="rounded-full border border-[#e7e9ee] bg-[#f5f6f8] px-3 py-1 text-[12px] font-semibold text-[#444e5c]">
                        {t(listing.size)}
                      </span>
                      <span className="rounded-full border border-[#e7e9ee] bg-[#f5f6f8] px-3 py-1 text-[12px] font-semibold text-[#444e5c]">
                        {t(listing.amenity)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                      <div>
                        <div className="text-[20px] font-extrabold tracking-[-0.03em] text-[#F26A1B]">
                          {t(listing.price)}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                          {t("landing.featured.perMonth")}
                        </div>
                      </div>
                      <Link
                        className="inline-flex items-center gap-2 rounded-full border border-[#e7e9ee] px-4 py-2 text-[14px] font-semibold text-[#212733] transition-colors hover:border-[#F26A1B] hover:text-[#F26A1B]"
                        href="/storage"
                      >
                        {t("landing.featured.details")}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6 text-center">
          <h2 className="text-[32px] font-extrabold tracking-[-0.4px] text-[#212733]">
            {t("landing.categories.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[16px] text-[#5b6573]">
            {t("landing.categories.subtitle")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <article
                  className="rounded-[14px] border border-[#e7e9ee] bg-white px-6 py-7 shadow-[0_4px_14px_rgba(20,25,40,0.05)] transition-transform hover:-translate-y-1 hover:border-[#F26A1B]"
                  key={category.title}
                >
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[14px] bg-[#FDEEE4] text-[#F26A1B]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#212733]">{category.title}</h3>
                  <p className="mt-2 text-[13px] text-[#5b6573]">{category.meta}</p>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e7e9ee] px-4 py-2 text-[14px] font-semibold text-[#212733] transition-colors hover:border-[#F26A1B] hover:text-[#F26A1B]"
                    href="/storage"
                  >
                    {t("landing.categories.action")}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6f8] py-16 sm:py-20 lg:py-[80px]">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-6 lg:gap-12">
          <div>
            <span className="mb-3 block text-[13px] font-bold uppercase tracking-[1.5px] text-[#F26A1B]">
              {t("landing.simulator.eyebrow")}
            </span>
            <h2 className="max-w-[560px] text-[30px] font-extrabold tracking-[-0.4px] text-[#212733] sm:text-[36px]">
              {t("landing.simulator.title")}
            </h2>
            <p className="mt-3 max-w-[560px] text-[16px] leading-7 text-[#5b6573]">
              {t("landing.simulator.description")}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                t("landing.simulator.bullets.one"),
                t("landing.simulator.bullets.two"),
                t("landing.simulator.bullets.three"),
                t("landing.simulator.bullets.four"),
              ].map((bullet) => (
                <li className="flex items-start gap-3 text-[15px] text-[#212733]" key={bullet}>
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#F26A1B] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[#5b6573]">{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              className="mt-7 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#212733] px-8 text-[15px] font-semibold text-white transition-colors hover:opacity-90"
              href="/create-listing"
            >
              {t("landing.simulator.action")}
            </Link>
          </div>

          <div className="rounded-[14px] bg-white p-5 shadow-[0_8px_26px_rgba(20,25,40,0.04)] sm:p-6">
            <h3 className="mb-5 text-[16px] font-semibold text-[#212733]">
              {t("landing.simulator.cardTitle")}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-[13px] font-semibold text-[#212733]">
                <span>{t("landing.simulator.fields.spaceType")}</span>
                <select
                  className="w-full rounded-[10px] border border-[#e7e9ee] bg-white px-3 py-2.5 text-[14px] outline-none"
                  value={spaceType}
                  onChange={(event) => setSpaceType(event.target.value)}
                >
                  <option value="cave">{t("landing.simulator.options.cave")}</option>
                  <option value="box">{t("landing.simulator.options.box")}</option>
                  <option value="grand">{t("landing.simulator.options.grand")}</option>
                  <option value="garage">{t("landing.simulator.options.garage")}</option>
                </select>
              </label>
              <label className="space-y-2 text-[13px] font-semibold text-[#212733]">
                <span>{t("landing.simulator.fields.city")}</span>
                <select
                  className="w-full rounded-[10px] border border-[#e7e9ee] bg-white px-3 py-2.5 text-[14px] outline-none"
                  value={cityMultiplier}
                  onChange={(event) => setCityMultiplier(event.target.value)}
                >
                  <option value="1.9">{t("landing.simulator.options.paris")}</option>
                  <option value="1.5">{t("landing.simulator.options.idf")}</option>
                  <option value="1.2">{t("landing.simulator.options.lyon")}</option>
                  <option value="1.2">{t("landing.simulator.options.marseille")}</option>
                  <option value="1">{t("landing.simulator.options.other")}</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block space-y-2 text-[13px] font-semibold text-[#212733]">
              <span>
                {t("landing.simulator.fields.surface")}{" "}
                <span className="text-[#F26A1B]">{surface} m²</span>
              </span>
              <input
                className="w-full accent-[#F26A1B]"
                max={30}
                min={1}
                type="range"
                value={surface}
                onChange={(event) => setSurface(Number(event.target.value))}
              />
            </label>

            <div className="mt-3 rounded-[14px] bg-[#F26A1B] px-5 py-5 text-center text-white">
              <span className="block text-[13px] opacity-90">{t("landing.simulator.result.label")}</span>
              <div className="mt-1 text-[38px] font-extrabold leading-none">
                {revenue}€
                <span className="ml-2 text-[18px] font-semibold">{t("landing.simulator.result.perMonth")}</span>
              </div>
              <div className="mt-1 text-[12px] opacity-85">{t("landing.simulator.result.note")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6 text-center">
          <span className="mb-2 block text-[13px] font-bold uppercase tracking-[1.5px] text-[#F26A1B]">
            {t("landing.testimonials.eyebrow")}
          </span>
          <h2 className="text-[32px] font-extrabold tracking-[-0.4px] text-[#212733]">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[16px] text-[#5b6573]">
            {t("landing.testimonials.subtitle")}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                className="rounded-[20px] border border-[#e7e9ee] bg-white p-7 text-left shadow-[0_4px_14px_rgba(20,25,40,0.05)]"
                key={testimonial.name}
              >
                <div className="mb-10 flex items-center gap-1 text-[#F26A1B]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      className="h-4 w-4 fill-[#F26A1B] text-[#F26A1B]"
                      key={`${testimonial.name}-${index}`}
                    />
                  ))}
                </div>
                <p className="text-[14px] leading-[1.55] text-[#2d3443]">{testimonial.quote}</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FDEEE4] text-[13px] font-bold text-[#F26A1B]">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#212733]">{testimonial.name}</div>
                    <div className="text-[13px] text-[#5b6573]">{testimonial.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background pb-16 pt-0 sm:pb-20 lg:pb-[80px]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-6">
          <div className="rounded-[24px] bg-[#181d28] px-6 py-12 text-center text-white sm:px-10 sm:py-14">
            <h2 className="text-[30px] font-extrabold tracking-[-0.4px] sm:text-[34px]">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-7 text-[#c4cbd8]">
              {t("landing.cta.description")}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#F26A1B] px-8 text-[15px] font-semibold text-white transition-colors hover:bg-[#d9590f]"
                href="/storage"
              >
                {t("landing.cta.primaryAction")}
              </Link>
              <Link
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/95 px-8 text-[15px] font-semibold text-[#212733] transition-colors hover:bg-white"
                href="/create-listing"
              >
                {t("landing.cta.secondaryAction")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
