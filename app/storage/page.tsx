"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { StorageType } from "@prisma/client";

type ListingCard = {
  id: string;
  title: string;
  city: string;
  address: string;
  storageType: StorageType;
  pricePerMonth: string;
  sizeSqFt: number | null;
  ratingAverage: number;
  ratingCount: number;
  imageUrl: string | null;
  amenityNames: string[];
  latitude: number | null;
  longitude: number | null;
};

type ListingsResponse = {
  listings: ListingCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDlVrURlNSg8iNTE9GnvU2o749hEm4jvya_479eNJNEJuNxUGk326cH62rq6vsHGIFdviZFAypKjio5NUT03Qde9CSstZbrXPTmlKWG5wAQXy2y_QCA_kqlFlF_vcVS98caXI4B4kRi4DoOhBWRb2qYlkcfa3xAmA8yDRyWth2RqopXRtvlioOa2xgHDPpQG-r1SkjwF0mKLtPF9EJNSTtHYx9-svR9yNa0_kEEsgIncvy-Cg56WpW2T-MPs2_P_MISm2CjJCiFwTo";

const ListingsMap = dynamic(() => import("@/components/maps/ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-2xl border border-outline-variant/60 bg-surface-container animate-pulse" />
  ),
});

function formatStorageType(value: StorageType) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAmenityLabel(value: string, t: (key: string) => string) {
  const translated = t(value);
  if (translated !== value) {
    return translated;
  }

  if (value === "Security Camera") return t("createListing.amenities.securityCamera");
  if (value === "24/7 Access") return t("createListing.amenities.access247");
  if (value === "Climate Control" || value === "Climate Controlled") {
    return t("createListing.amenities.climateControl");
  }
  if (value === "Private Entry") return t("createListing.amenities.privateEntry");
  if (value === "Gated") return t("createListing.amenities.gated");
  if (value === "Loading Dock") return t("createListing.amenities.loadingDock");

  return value;
}

export default function BrowseStoragePage() {
  const { t } = useTranslation();
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [storageType, setStorageType] = useState<StorageType | "">("");
  const [sizePreset, setSizePreset] = useState("");
  const [page, setPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "12");
    if (location.trim()) {
      params.set("location", location.trim());
    }
    if (city.trim()) {
      params.set("city", city.trim());
    }
    if (storageType) {
      params.set("storageType", storageType);
    }
    if (sizePreset === "SMALL") {
      params.set("maxSize", "50");
    }
    if (sizePreset === "MEDIUM") {
      params.set("minSize", "50");
      params.set("maxSize", "150");
    }
    if (sizePreset === "LARGE") {
      params.set("minSize", "150");
    }
    return params.toString();
  }, [city, location, page, sizePreset, storageType]);

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/listings?${queryString}`, {
          headers: { Accept: "application/json" },
        });

        const json = (await response.json()) as ListingsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(json.error ?? t("errors.unableToLoadListings"));
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData({ listings: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 1 } });
          setError(loadError instanceof Error ? loadError.message : t("errors.unableToLoadListings"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [queryString, t]);

  const listings = useMemo(() => data?.listings ?? [], [data]);
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const mapListings = useMemo(
    () => listings.filter((listing) => listing.latitude !== null && listing.longitude !== null),
    [listings],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface font-body-md antialiased selection:bg-secondary-container">
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:mt-32 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-[28px] border border-outline-variant/60 bg-surface p-4 shadow-[0_18px_60px_-24px_rgba(17,24,39,0.18)] lg:flex-row lg:items-center lg:gap-0 lg:p-2">
          <div className="flex min-h-14 min-w-0 flex-1 items-center rounded-2xl bg-surface-container-lowest px-4 lg:bg-transparent lg:px-5">
            <span
              className="material-symbols-outlined text-secondary/60 mr-3"
              data-icon="location_on"
            >
              location_on
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
              placeholder={t("storage.searchPlaceholder")}
              type="text"
              value={location}
              onChange={(event) => {
                setPage(1);
                setLocation(event.target.value);
                setCity(event.target.value);
              }}
            />
          </div>
          <div className="hidden h-8 w-px bg-outline-variant/30 lg:block"></div>
          <div className="flex min-h-14 min-w-0 flex-1 items-center rounded-2xl bg-surface-container-lowest px-4 lg:bg-transparent lg:px-5">
            <span
              className="material-symbols-outlined text-secondary/60 mr-3"
              data-icon="straighten"
            >
              straighten
            </span>
            <select
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface appearance-none cursor-pointer"
              value={sizePreset}
              onChange={(event) => {
                setPage(1);
                setSizePreset(event.target.value);
              }}
            >
              <option value="">{t("storage.anySize")}</option>
              <option value="SMALL">{t("storage.sizeSmall")}</option>
              <option value="MEDIUM">{t("storage.sizeMedium")}</option>
              <option value="LARGE">{t("storage.sizeLarge")}</option>
            </select>
          </div>
          <div className="hidden h-8 w-px bg-outline-variant/30 lg:block"></div>
          <div className="flex min-h-14 min-w-0 flex-1 items-center rounded-2xl bg-surface-container-lowest px-4 lg:bg-transparent lg:px-5">
            <span
              className="material-symbols-outlined text-secondary/60 mr-3"
              data-icon="calendar_month"
            >
              calendar_month
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
              placeholder={t("storage.moveInDate")}
              type="text"
            />
          </div>
          <button
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-8 text-white shadow-md transition-all hover:bg-[#d9590f] active:scale-95 lg:w-auto lg:min-w-[220px]"
            type="button"
            onClick={() => setPage(1)}
          >
            <span className="material-symbols-outlined" data-icon="search">
              search
            </span>
            <span className="font-bold">{t("common.search")}</span>
          </button>
        </div>
      </section>

      {error ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-lg border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
            {error}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-12 mb-8 flex max-w-7xl flex-col gap-5 border-b border-outline-variant/20 px-4 pb-6 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <h2 className="flex flex-col gap-3 font-h1 text-h2 text-primary sm:flex-row sm:items-center">
            {loading ? t("common.loading") : t("storage.storageCavesWithCount", { count: total })}
            <span className="w-fit rounded-full bg-surface-container px-3 py-1 text-body-sm font-normal text-on-surface-variant italic-emphasis">
              {location || city || t("storage.region")}
            </span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <button
            className="flex items-center gap-2 text-secondary font-bold text-body-sm hover:underline"
            type="button"
            onClick={() => setShowMap((current) => !current)}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="map">
              map
            </span>
            {showMap ? t("common.hideMap") : t("common.showMap")}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-label-caps text-on-surface-variant">{t("common.sortBy")}</span>
            <select className="bg-transparent border-none focus:ring-0 font-bold text-body-sm text-primary appearance-none cursor-pointer pr-4">
              <option>{t("storage.sortRecommended")}</option>
              <option>{t("storage.sortPriceLowHigh")}</option>
              <option>{t("storage.sortSizeLargest")}</option>
            </select>
          </div>
        </div>
      </section>

      {showMap ? (
        <section className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-h3 text-h3 text-primary">{t("storage.mapView")}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("storage.approvedListings")}
              </p>
            </div>
            <button
              className="text-primary font-bold text-body-sm hover:underline"
              type="button"
              onClick={() => setShowMap(false)}
            >
              {t("common.collapse")}
            </button>
          </div>
          <ListingsMap listings={mapListings} />
        </section>
      ) : null}

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-4 pb-28 sm:px-6 md:pb-8 lg:flex-row lg:px-8">
        <aside className="w-full flex-shrink-0 space-y-6 lg:w-[300px]">
          <div className="rounded-[24px] border border-outline-variant/60 bg-surface-container-low p-5 shadow-[0_10px_40px_-28px_rgba(17,24,39,0.18)] sm:p-6 lg:sticky lg:top-28">
            <h3 className="font-label-caps text-label-caps text-primary mb-6 tracking-widest uppercase">
              {t("storage.refineSearch")}
            </h3>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.priceRange")}
              </label>
              <div className="relative w-full h-1 bg-surface-container-high rounded-full mt-4 mb-3">
                <div className="absolute h-full w-2/3 bg-secondary rounded-full left-1/4"></div>
                <div className="absolute -top-1.5 left-1/4 w-4 h-4 bg-secondary rounded-full shadow-md border-2 border-white"></div>
                <div className="absolute -top-1.5 left-[91%] w-4 h-4 bg-secondary rounded-full shadow-md border-2 border-white"></div>
              </div>
              <div className="flex justify-between text-[13px] font-semibold text-on-surface-variant">
                <span>{t("storage.priceRangeMin")}</span>
                <span>{t("storage.priceRangeMax")}</span>
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.unitSize")}
              </label>
              <div className="space-y-4">
                {[
                  ["SMALL", t("storage.rangeSmall")],
                  ["MEDIUM", t("storage.rangeMedium")],
                  ["LARGE", t("storage.rangeLarge")],
                ].map(([value, label]) => (
                  <label className="flex items-center gap-3 cursor-pointer group" key={value}>
                    <input
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed transition-colors"
                      type="radio"
                      checked={sizePreset === value}
                      onChange={() => {
                        setPage(1);
                        setSizePreset(value);
                      }}
                    />
                    <span className="text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.storageType")}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  [StorageType.GARAGE, t("storage.typeGarage")],
                  [StorageType.ROOM, t("storage.typeRoom")],
                  [StorageType.WAREHOUSE, t("storage.typeWarehouse")],
                  [StorageType.BASEMENT, t("storage.typeBasement")],
                ].map(([value, label]) => (
                  <button
                    className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition-all ${
                      storageType === value
                      ? "border-2 border-secondary text-secondary font-bold bg-secondary-container/15"
                        : "border border-outline-variant/40 text-on-surface-variant font-medium hover:border-secondary"
                    }`}
                    key={value}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setStorageType((current) => (current === value ? "" : (value as StorageType)));
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.distance")}
              </label>
              <select className="w-full bg-surface border border-outline-variant/30 rounded-lg p-2.5 text-body-sm focus:border-secondary focus:ring-0">
                <option>{t("storage.within5")}</option>
                <option value="Within 10 miles">{t("storage.within10")}</option>
                <option>{t("storage.within25")}</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {!loading && !error && listings.length === 0 ? (
            <div className="mb-6 rounded-lg border border-outline-variant/60 bg-surface px-6 py-8 text-center text-on-surface-variant">
              <p className="font-semibold text-primary">{t("storage.noResultsTitle")}</p>
              <p className="mt-2 text-sm">{t("storage.noResultsDescription")}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Link
                href={`/storage/${listing.id}`}
                key={listing.id}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface card-shadow card-hover transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={listing.imageUrl ?? fallbackImage}
                    alt={listing.title}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      {formatStorageType(listing.storageType)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-surface/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-secondary text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {listing.ratingAverage.toFixed(1) || "0.0"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h4 className="mb-1 line-clamp-2 font-h3 text-h3 leading-tight text-primary">
                    {listing.title}
                  </h4>
                  <p className="mb-6 flex items-center gap-1 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">
                      location_on
                    </span>
                    {listing.city}
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-outline-variant/20 pt-4 sm:flex sm:items-center sm:gap-4">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        square_foot
                      </span>
                      {listing.sizeSqFt ?? "—"} {t("storage.sqFt")}
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        verified
                      </span>
                      {listing.amenityNames[0]
                        ? formatAmenityLabel(listing.amenityNames[0], t)
                        : t("storage.verified")}
                    </div>
                    <div className="col-span-2 text-left sm:ml-auto sm:text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        {t("app.storage.page.text.text.33403ca3")}{listing.pricePerMonth}
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        {t("listing.monthly")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center py-16 sm:py-20">
            <nav className="flex items-center gap-3 sm:gap-4">
              <button
                className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-secondary text-on-surface-variant hover:text-secondary transition-all bg-surface shadow-sm disabled:opacity-40"
                disabled={page <= 1}
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                <span className="material-symbols-outlined" data-icon="chevron_left">
                  chevron_left
                </span>
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 4) }, (_, index) => {
                  const currentPage = index + 1;
                  return (
                    <button
                      className={`w-12 h-12 rounded-full font-extrabold text-body-md transition-all ${
                        page === currentPage
                          ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                          : "bg-surface border border-outline-variant/40 flex items-center justify-center hover:border-secondary text-on-surface-variant font-bold"
                      }`}
                      key={currentPage}
                      type="button"
                      onClick={() => setPage(currentPage)}
                    >
                      {currentPage}
                    </button>
                  );
                })}
              </div>
              <button
                className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-secondary text-on-surface-variant hover:text-secondary transition-all bg-surface shadow-sm disabled:opacity-40"
                disabled={page >= totalPages}
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              >
                <span className="material-symbols-outlined" data-icon="chevron_right">
                  chevron_right
                </span>
              </button>
            </nav>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[32px] border-t border-outline-variant/20 bg-surface/90 px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(17,24,39,0.05)] backdrop-blur-xl md:hidden">
        <a
          className="flex flex-col items-center justify-center text-secondary bg-secondary-container/20 rounded-full px-5 py-1.5"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="search">
            search
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            {t("storage.mobileExplore")}
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/60"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="favorite">
            favorite
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            {t("common.save")}
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/60"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="person">
            person
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            {t("nav.dashboard")}
          </span>
        </a>
      </nav>
    </div>
  );
}
