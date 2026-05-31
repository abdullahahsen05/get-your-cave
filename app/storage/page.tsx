"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { StorageType } from "@prisma/client";
import { haversineDistance } from "@/lib/geo";
import { formatStorageTypeLabel } from "@/lib/storage-types";
import { formatSquareMeters, resolveAreaInSquareMeters } from "@/lib/units";

type ListingCard = {
  id: string;
  title: string;
  city: string;
  address: string;
  storageType: StorageType;
  status: string;
  availability: string;
  pricePerMonth: string;
  sizeM2: number | null;
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

type GeocodeSuggestion = {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  city: string | null;
};

type GeocodeResponse = GeocodeSuggestion & {
  error?: string;
};

type SearchMode = "all" | "address" | "postalCode" | "city" | "geolocation";
type SortMode = "recommended" | "nearest" | "priceLowHigh" | "sizeLargest";

type BrowseFilters = {
  searchMode: SearchMode;
  query: string;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  storageType: StorageType | "";
  radiusKm: string;
  latitude: string;
  longitude: string;
  amenityNames: string[];
};

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDlVrURlNSg8iNTE9GnvU2o749hEm4jvya_479eNJNEJuNxUGk326cH62rq6vsHGIFdviZFAypKjio5NUT03Qde9CSstZbrXPTmlKWG5wAQXy2y_QCA_kqlFlF_vcVS98caXI4B4kRi4DoOhBWRb2qYlkcfa3xAmA8yDRyWth2RqopXRtvlioOa2xgHDPpQG-r1SkjwF0mKLtPF9EJNSTtHYx9-svR9yNa0_kEEsgIncvy-Cg56WpW2T-MPs2_P_MISm2CjJCiFwTo";

const ListingsMap = dynamic(() => import("@/components/maps/ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-[28px] border border-outline-variant/50 bg-surface-container animate-pulse" />
  ),
});

const emptyFilters: BrowseFilters = {
  searchMode: "all",
  query: "",
  minPrice: "",
  maxPrice: "",
  minSize: "",
  maxSize: "",
  storageType: "",
  radiusKm: "10",
  latitude: "",
  longitude: "",
  amenityNames: [],
};

const searchModeOptions = [
  { value: "all", labelKey: "storage.searchModeAll", placeholderKey: "storage.searchPlaceholder" },
  { value: "address", labelKey: "storage.searchModeAddress", placeholderKey: "storage.searchAddressPlaceholder" },
  { value: "postalCode", labelKey: "storage.searchModePostalCode", placeholderKey: "storage.searchPostalCodePlaceholder" },
  { value: "city", labelKey: "storage.searchModeCity", placeholderKey: "storage.searchCityPlaceholder" },
  { value: "geolocation", labelKey: "storage.searchModeGeolocation", placeholderKey: "storage.searchGeolocationPlaceholder" },
] as const;

const storageTypeOptions = [
  { value: StorageType.BASEMENT, labelKey: "createListing.storageTypes.cellarCave" },
  { value: StorageType.LOCKER, labelKey: "createListing.storageTypes.box" },
  { value: StorageType.LOFT, labelKey: "createListing.storageTypes.closet" },
  { value: StorageType.WAREHOUSE, labelKey: "createListing.storageTypes.storageRoom" },
  { value: StorageType.OTHER, labelKey: "createListing.storageTypes.otherStorageSpaces" },
] as const;

const amenityFilterOptions: { key: string; labelKey: string; amenityNames: string[] }[] = [
  {
    key: "security",
    labelKey: "storage.filterSecurity",
    amenityNames: ["Security Camera", "Alarm System"],
  },
  {
    key: "access247",
    labelKey: "storage.filter247",
    amenityNames: ["24/7 Access"],
  },
  {
    key: "elevator",
    labelKey: "storage.filterElevator",
    amenityNames: ["Elevator"],
  },
  {
    key: "ventilation",
    labelKey: "storage.filterVentilation",
    amenityNames: ["Ventilation", "Climate Control", "Climate Controlled"],
  },
  {
    key: "humidity",
    labelKey: "storage.filterHumidity",
    amenityNames: ["Humidity Control", "Climate Control", "Climate Controlled"],
  },
];

function formatListingStatusLabel(value: string, t: (key: string) => string) {
  const translated = t(`status.listing.${value}`);
  return translated === `status.listing.${value}` ? value : translated;
}

function formatListingAvailabilityLabel(value: string, t: (key: string) => string) {
  const translated = t(`status.availability.${value}`);
  return translated === `status.availability.${value}` ? value : translated;
}

function formatAmenityLabel(value: string, t: (key: string) => string) {
  const translated = t(value);
  if (translated !== value) return translated;

  if (value === "Security Camera") return t("createListing.amenities.securityCamera");
  if (value === "Alarm System") return t("createListing.amenities.alarmSystem");
  if (value === "24/7 Access") return t("createListing.amenities.access247");
  if (value === "Elevator") return t("createListing.amenities.elevator");
  if (value === "Ventilation") return t("createListing.amenities.ventilation");
  if (value === "Humidity Control") return t("createListing.amenities.humidityControl");
  if (value === "Climate Control" || value === "Climate Controlled") {
    return t("createListing.amenities.humidityControl");
  }
  if (value === "Private Entry") return t("createListing.amenities.privateEntry");
  if (value === "Gated") return t("createListing.amenities.gated");
  if (value === "Loading Dock") return t("createListing.amenities.loadingDock");

  return value;
}

export default function BrowseStoragePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(() => ({
    ...emptyFilters,
    query: initialQuery,
  }));
  const [appliedFilters, setAppliedFilters] = useState<BrowseFilters>(() => ({
    ...emptyFilters,
    query: initialQuery,
  }));

  const [page, setPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);

  const activeSearchModeConfig =
    searchModeOptions.find((option) => option.value === draftFilters.searchMode) ??
    searchModeOptions[0];

  useEffect(() => {
    setDraftFilters((current) => ({
      ...current,
      query: initialQuery,
    }));
    setAppliedFilters((current) => ({
      ...current,
      query: initialQuery,
    }));
    setPage(1);
  }, [initialQuery]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "12");

    const query = appliedFilters.query.trim();

    if (query && appliedFilters.searchMode !== "geolocation") {
      if (appliedFilters.searchMode === "address") params.set("address", query);
      else if (appliedFilters.searchMode === "postalCode") params.set("postalCode", query);
      else if (appliedFilters.searchMode === "city") params.set("city", query);
      else params.set("location", query);
    }

    if (appliedFilters.storageType) params.set("storageType", appliedFilters.storageType);
    if (appliedFilters.minPrice.trim()) params.set("minPrice", appliedFilters.minPrice.trim());
    if (appliedFilters.maxPrice.trim()) params.set("maxPrice", appliedFilters.maxPrice.trim());
    if (appliedFilters.minSize.trim()) params.set("minSize", appliedFilters.minSize.trim());
    if (appliedFilters.maxSize.trim()) params.set("maxSize", appliedFilters.maxSize.trim());

    if (appliedFilters.searchMode === "geolocation") {
      if (appliedFilters.latitude.trim()) params.set("latitude", appliedFilters.latitude.trim());
      if (appliedFilters.longitude.trim()) params.set("longitude", appliedFilters.longitude.trim());
      if (appliedFilters.radiusKm.trim()) params.set("radiusKm", appliedFilters.radiusKm.trim());
    }

    if (appliedFilters.amenityNames.length) {
      params.set("amenities", appliedFilters.amenityNames.join(","));
    }

    return params.toString();
  }, [appliedFilters, page]);

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

        if (!cancelled) setData(json);
      } catch (loadError) {
        if (!cancelled) {
          setData({
            listings: [],
            pagination: {
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 1,
            },
          });
          setError(loadError instanceof Error ? loadError.message : t("errors.unableToLoadListings"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadListings();

    return () => {
      cancelled = true;
    };
  }, [queryString, t]);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      const query = draftFilters.query.trim();

      if (draftFilters.searchMode === "geolocation" || query.length < 3) {
        setSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);

      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&suggest=1`, {
          headers: { Accept: "application/json" },
        });

        const json = (await response.json()) as {
          suggestions?: GeocodeSuggestion[];
          error?: string;
        };

        if (!response.ok || !json.suggestions) {
          throw new Error(json.error ?? t("storage.geoLookupFailed"));
        }

        if (!cancelled) setSuggestions(json.suggestions);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadSuggestions();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [draftFilters.query, draftFilters.searchMode, t]);

  const listings = useMemo(() => data?.listings ?? [], [data]);
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const mapListings = useMemo(
    () => listings.filter((listing) => listing.latitude !== null && listing.longitude !== null),
    [listings],
  );

  const searchOrigin = useMemo(() => {
    const latitude = Number(appliedFilters.latitude);
    const longitude = Number(appliedFilters.longitude);

    if (
      appliedFilters.searchMode === "geolocation" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return { latitude, longitude };
    }

    return null;
  }, [appliedFilters]);

  const sortedListings = useMemo(() => {
    const withDistance = listings.map((listing) => {
      if (!searchOrigin || listing.latitude === null || listing.longitude === null) {
        return { listing, distanceKm: null };
      }

      return {
        listing,
        distanceKm: haversineDistance(
          searchOrigin.latitude,
          searchOrigin.longitude,
          listing.latitude,
          listing.longitude,
        ),
      };
    });

    const sorted = [...withDistance];

    if (sortMode === "nearest") {
      sorted.sort(
        (a, b) =>
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
          (b.distanceKm ?? Number.POSITIVE_INFINITY),
      );
    }

    if (sortMode === "priceLowHigh") {
      sorted.sort((a, b) => Number(a.listing.pricePerMonth) - Number(b.listing.pricePerMonth));
    }

    if (sortMode === "sizeLargest") {
      sorted.sort((a, b) => {
        const aSize = resolveAreaInSquareMeters(a.listing.sizeM2, a.listing.sizeSqFt) ?? 0;
        const bSize = resolveAreaInSquareMeters(b.listing.sizeM2, b.listing.sizeSqFt) ?? 0;

        return bSize - aSize;
      });
    }

    return sorted;
  }, [listings, searchOrigin, sortMode]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (appliedFilters.query.trim()) {
      chips.push({
        key: "query",
        label: appliedFilters.query,
        onRemove: () => {
          setDraftFilters((current) => ({ ...current, query: "", latitude: "", longitude: "" }));
          setAppliedFilters((current) => ({ ...current, query: "", latitude: "", longitude: "" }));
          setPage(1);
        },
      });
    }

    if (appliedFilters.storageType) {
      chips.push({
        key: "storageType",
        label: formatStorageTypeLabel(appliedFilters.storageType, t),
        onRemove: () => {
          setDraftFilters((current) => ({ ...current, storageType: "" }));
          setAppliedFilters((current) => ({ ...current, storageType: "" }));
          setPage(1);
        },
      });
    }

    if (appliedFilters.minPrice || appliedFilters.maxPrice) {
      chips.push({
        key: "price",
        label: `€${appliedFilters.minPrice || "0"} - €${appliedFilters.maxPrice || "∞"}`,
        onRemove: () => {
          setDraftFilters((current) => ({ ...current, minPrice: "", maxPrice: "" }));
          setAppliedFilters((current) => ({ ...current, minPrice: "", maxPrice: "" }));
          setPage(1);
        },
      });
    }

    if (appliedFilters.minSize || appliedFilters.maxSize) {
      chips.push({
        key: "size",
        label: `${appliedFilters.minSize || "0"} - ${appliedFilters.maxSize || "∞"} m²`,
        onRemove: () => {
          setDraftFilters((current) => ({ ...current, minSize: "", maxSize: "" }));
          setAppliedFilters((current) => ({ ...current, minSize: "", maxSize: "" }));
          setPage(1);
        },
      });
    }

    amenityFilterOptions.forEach((option) => {
      const selected = option.amenityNames.every((amenityName) =>
        appliedFilters.amenityNames.includes(amenityName),
      );

      if (selected) {
        chips.push({
          key: option.key,
          label: t(option.labelKey),
          onRemove: () => {
            setDraftFilters((current) => ({
              ...current,
              amenityNames: current.amenityNames.filter(
                (amenityName: string) => !option.amenityNames.includes(amenityName),
              ),
            }));
            setAppliedFilters((current) => ({
              ...current,
              amenityNames: current.amenityNames.filter(
                (amenityName: string) => !option.amenityNames.includes(amenityName),
              ),
            }));
            setPage(1);
          },
        });
      }
    });

    return chips;
  }, [appliedFilters, t]);

  function updateDraft<K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleAmenityFilter(optionKeys: string[]) {
    setDraftFilters((current) => {
      const enabled = optionKeys.every((amenityName) =>
        current.amenityNames.includes(amenityName),
      );

      return {
        ...current,
        amenityNames: enabled
          ? current.amenityNames.filter((amenityName) => !optionKeys.includes(amenityName))
          : Array.from(new Set([...current.amenityNames, ...optionKeys])),
      };
    });
  }

  async function handleApplyFilters() {
    setPage(1);
    setError(null);

    let latitude = draftFilters.latitude.trim();
    let longitude = draftFilters.longitude.trim();
    let query = draftFilters.query.trim();

    if (draftFilters.searchMode === "geolocation" && query && (!latitude || !longitude)) {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" },
        });

        const json = (await response.json()) as GeocodeResponse;

        if (!response.ok || typeof json.latitude !== "number" || typeof json.longitude !== "number") {
          throw new Error(json.error ?? t("storage.geoLookupFailed"));
        }

        latitude = String(json.latitude);
        longitude = String(json.longitude);
        query = json.displayName;
      } catch (lookupError) {
        setError(lookupError instanceof Error ? lookupError.message : t("storage.geoLookupFailed"));
        return;
      }
    }

    setAppliedFilters({
      ...draftFilters,
      query,
      latitude,
      longitude,
    });
  }

  async function resolvePlaceName(latitude: number, longitude: number) {
    const response = await fetch(
      `/api/geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(
        String(longitude),
      )}`,
      { headers: { Accept: "application/json" } },
    );

    const json = (await response.json().catch(() => null)) as GeocodeResponse | null;

    if (!response.ok || !json) {
      throw new Error(t("storage.geoLookupFailed"));
    }

    return json;
  }

  async function handleUseCurrentLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError(t("storage.geoUnsupported"));
      return;
    }

    setCurrentLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const json = await resolvePlaceName(
            position.coords.latitude,
            position.coords.longitude,
          );

          const nextFilters: BrowseFilters = {
            ...draftFilters,
            searchMode: "geolocation",
            query: json.displayName,
            latitude: String(json.latitude),
            longitude: String(json.longitude),
          };

          setDraftFilters(nextFilters);
          setAppliedFilters(nextFilters);
          setPage(1);
        } catch (lookupError) {
          setError(lookupError instanceof Error ? lookupError.message : t("storage.geoLookupFailed"));
        } finally {
          setCurrentLocationLoading(false);
        }
      },
      () => {
        setCurrentLocationLoading(false);
        setError(t("storage.locationUnavailable"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function handleResetFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  function applySuggestion(suggestion: GeocodeSuggestion) {
    setDraftFilters((current) => ({
      ...current,
      query: suggestion.displayName,
      latitude: String(suggestion.latitude),
      longitude: String(suggestion.longitude),
      searchMode: current.searchMode === "all" ? "geolocation" : current.searchMode,
    }));
    setSuggestions([]);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface font-body-md antialiased selection:bg-secondary-container">
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:mt-32 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-outline-variant/50 bg-surface p-4 shadow-[0_24px_80px_-40px_rgba(17,24,39,0.25)] sm:p-6">
          <div className="mb-5">
            <p className="mb-2 text-label-caps text-on-surface-variant">
              {t("storage.refineSearch")}
            </p>
            <h1 className="font-h1 text-h2 text-primary">
              {t("storage.storageCavesWithCount", {
                count: loading ? 0 : total,
              })}
            </h1>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative flex items-center gap-4 rounded-[28px] border border-outline-variant/40 bg-surface-container-lowest px-6 py-4 min-h-[64px] transition-colors focus-within:border-secondary">
        

              <input
                className="w-full border-none bg-transparent text-body-lg text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-0"
                placeholder={t(activeSearchModeConfig.placeholderKey)}
                type="text"
                value={draftFilters.query}
                onChange={(event) => updateDraft("query", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleApplyFilters();
                }}
              />



              {suggestions.length > 0 ? (
                <div className="absolute left-4 right-4 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-[0_20px_50px_rgba(17,24,39,0.16)]">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                      className="flex w-full flex-col gap-1 border-b border-outline-variant/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary-container/20"
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <span className="text-body-sm font-semibold text-primary">{suggestion.displayName}</span>
                      <span className="text-xs text-on-surface-variant">{suggestion.city ?? suggestion.address}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              className="w-full min-h-[64px] rounded-[32px] bg-secondary px-8 text-body-lg font-bold text-white shadow-[0_12px_30px_-10px_rgba(217,89,15,0.35)] flex items-center justify-center transition-transform hover:bg-[#d9590f] active:scale-[0.98]"
              type="button"
              onClick={handleApplyFilters}
            >
              {t("common.search")}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 items-center gap-3 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                tune
              </span>
              <select
                className="border-none bg-transparent text-body-sm font-semibold text-primary outline-none focus:ring-0"
                value={draftFilters.searchMode}
                onChange={(event) =>
                  updateDraft("searchMode", event.target.value as SearchMode)
                }
              >
                {searchModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-11 items-center gap-3 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                near_me
              </span>
              <select
                className="border-none bg-transparent text-body-sm font-semibold text-primary outline-none focus:ring-0"
                value={draftFilters.radiusKm}
                onChange={(event) => updateDraft("radiusKm", event.target.value)}
              >
                <option value="1">{t("storage.within1")}</option>
                <option value="5">{t("storage.within5")}</option>
                <option value="10">{t("storage.within10")}</option>
                <option value="25">{t("storage.within25")}</option>
                <option value="50">{t("storage.within50")}</option>
              </select>
            </label>

            <button
              className="flex min-h-11 items-center gap-3 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 text-body-sm font-semibold text-primary transition-colors hover:border-secondary hover:text-secondary disabled:opacity-60"
              type="button"
              disabled={currentLocationLoading}
              onClick={() => void handleUseCurrentLocation()}
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                {currentLocationLoading ? "progress_activity" : "my_location"}
              </span>
              {t("storage.useCurrentLocation")}
            </button>

            {activeFilterChips.length > 0 ? (
              <button
                className="ml-auto min-h-11 rounded-full border border-outline-variant/40 px-4 text-body-sm font-bold text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
                type="button"
                onClick={handleResetFilters}
              >
                {t("storage.clearFilters")}
              </button>
            ) : null}
          </div>

          {suggestionsLoading ? (
            <p className="mt-3 text-xs text-on-surface-variant">{t("common.loading")}</p>
          ) : null}

          {activeFilterChips.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant/20 pt-5">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  className="flex items-center gap-2 rounded-full bg-secondary-container/20 px-3 py-1.5 text-xs font-bold text-secondary transition-colors hover:bg-secondary-container/35"
                  type="button"
                  onClick={chip.onRemove}
                >
                  {chip.label}
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm font-medium text-[#8f3d12]">
            {error}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-b border-outline-variant/20 px-4 pb-6 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <p className="mb-2 text-body-sm text-on-surface-variant">
            {appliedFilters.query || t("storage.region")}
          </p>
          <h2 className="font-h2 text-h2 text-primary">
            {loading
              ? t("common.loading")
              : t("storage.storageCavesWithCount", { count: total })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="flex min-h-11 items-center gap-2 rounded-full border border-outline-variant/40 px-4 text-body-sm font-bold text-primary transition-colors hover:border-secondary hover:text-secondary"
            type="button"
            onClick={() => setShowMap((current) => !current)}
          >
            <span className="material-symbols-outlined text-[20px]">map</span>
            {showMap ? t("common.hideMap") : t("common.showMap")}
          </button>

          <label className="flex min-h-11 items-center gap-2 rounded-full border border-outline-variant/40 px-4">
            <span className="text-label-caps text-on-surface-variant">
              {t("common.sortBy")}
            </span>
            <select
              className="border-none bg-transparent text-body-sm font-bold text-primary outline-none focus:ring-0"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="recommended">{t("storage.sortRecommended")}</option>
              <option value="nearest">{t("storage.sortNearest")}</option>
              <option value="priceLowHigh">{t("storage.sortPriceLowHigh")}</option>
              <option value="sizeLargest">{t("storage.sortSizeLargest")}</option>
            </select>
          </label>
        </div>
      </section>

      {showMap ? (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-outline-variant/50 bg-surface p-3 shadow-[0_18px_60px_-35px_rgba(17,24,39,0.2)]">
            <ListingsMap listings={mapListings} />
          </div>
        </section>
      ) : null}

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 pb-28 sm:px-6 md:pb-10 lg:flex-row lg:px-8">
        <aside className="w-full flex-shrink-0 lg:w-[300px]">
          <div className="rounded-[28px] border border-outline-variant/50 bg-surface p-5 shadow-[0_16px_50px_-35px_rgba(17,24,39,0.25)] lg:sticky lg:top-28">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-h3 text-h3 text-primary">
                {t("storage.refineSearch")}
              </h3>
              <button
                className="text-body-sm font-bold text-secondary hover:underline"
                type="button"
                onClick={handleResetFilters}
              >
                {t("common.reset")}
              </button>
            </div>

            <div className="space-y-7">
              <div>
                <label className="mb-3 block text-body-sm font-bold text-primary">
                  {t("storage.priceRange")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                    inputMode="decimal"
                    placeholder={t("storage.priceMin")}
                    type="text"
                    value={draftFilters.minPrice}
                    onChange={(event) => updateDraft("minPrice", event.target.value)}
                  />
                  <input
                    className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                    inputMode="decimal"
                    placeholder={t("storage.priceMax")}
                    type="text"
                    value={draftFilters.maxPrice}
                    onChange={(event) => updateDraft("maxPrice", event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-bold text-primary">
                  {t("storage.unitSize")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                    placeholder={t("storage.sizeMin")}
                    type="text"
                    value={draftFilters.minSize}
                    onChange={(event) => updateDraft("minSize", event.target.value)}
                  />
                  <input
                    className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                    placeholder={t("storage.sizeMax")}
                    type="text"
                    value={draftFilters.maxSize}
                    onChange={(event) => updateDraft("maxSize", event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-bold text-primary">
                  {t("storage.storageType")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {storageTypeOptions.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                        draftFilters.storageType === value
                          ? "border-secondary bg-secondary-container/20 text-secondary"
                          : "border-outline-variant/40 text-on-surface-variant hover:border-secondary hover:text-secondary"
                      }`}
                      type="button"
                      onClick={() =>
                        updateDraft(
                          "storageType",
                          draftFilters.storageType === value ? "" : value,
                        )
                      }
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-bold text-primary">
                  {t("storage.filters")}
                </label>
                <div className="space-y-2">
                  {amenityFilterOptions.map((option) => {
                    const selected = option.amenityNames.every((amenityName) =>
                      draftFilters.amenityNames.includes(amenityName),
                    );

                    return (
                      <button
                        key={option.key}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-body-sm font-semibold transition-colors ${
                          selected
                            ? "border-secondary bg-secondary-container/20 text-secondary"
                            : "border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-secondary"
                        }`}
                        type="button"
                        onClick={() => toggleAmenityFilter([...option.amenityNames])}
                      >
                        <span>{t(option.labelKey)}</span>
                        <span className="material-symbols-outlined text-[18px]">
                          {selected ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-5">
                <button
                  className="rounded-2xl bg-secondary px-4 py-3 text-body-sm font-bold text-white transition-colors hover:bg-[#d9590f]"
                  type="button"
                  onClick={handleApplyFilters}
                >
                  {t("common.search")}
                </button>
                <button
                  className="rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 text-body-sm font-bold text-primary transition-colors hover:border-secondary hover:text-secondary"
                  type="button"
                  onClick={() => void handleUseCurrentLocation()}
                  disabled={currentLocationLoading}
                >
                  {currentLocationLoading
                    ? t("common.loading")
                    : t("storage.useCurrentLocation")}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {!loading && !error && listings.length === 0 ? (
            <div className="rounded-[28px] border border-outline-variant/50 bg-surface px-6 py-12 text-center">
              <p className="font-h3 text-h3 text-primary">{t("storage.noResultsTitle")}</p>
              <p className="mx-auto mt-2 max-w-md text-body-sm text-on-surface-variant">
                {t("storage.noResultsDescription")}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedListings.map(({ listing, distanceKm }) => {
              const area = resolveAreaInSquareMeters(listing.sizeM2, listing.sizeSqFt);

              const firstAmenity = listing.amenityNames[0];

              return (
                <Link
                  key={listing.id}
                  href={`/storage/${listing.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-outline-variant/50 bg-surface shadow-[0_14px_45px_-35px_rgba(17,24,39,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_-35px_rgba(17,24,39,0.35)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
                    <img
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={listing.imageUrl ?? fallbackImage}
                      alt={listing.title}
                    />

                    <div className="absolute left-4 top-4">
                      <span className="rounded-full bg-surface/95 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                        {formatStorageTypeLabel(listing.storageType, t)}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 flex flex-col gap-2">
                      <span className="rounded-full bg-secondary-container/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container shadow-sm backdrop-blur">
                        {formatListingStatusLabel(listing.status, t)}
                      </span>
                      <span className="rounded-full bg-surface/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm backdrop-blur">
                        {formatListingAvailabilityLabel(listing.availability, t)}
                      </span>
                    </div>

                    {distanceKm !== null ? (
                      <div className="absolute bottom-4 right-4 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
                        {distanceKm < 1
                          ? `${Math.round(distanceKm * 1000)} m`
                          : `${distanceKm.toFixed(1)} km`}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-4">
                      <h4 className="line-clamp-2 font-h3 text-h3 leading-tight text-primary">
                        {listing.title}
                      </h4>

                      <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[17px]">
                          location_on
                        </span>
                        {listing.city}
                      </p>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                        {formatSquareMeters(area)}
                      </span>

                      {firstAmenity ? (
                        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                          {formatAmenityLabel(firstAmenity, t)}
                        </span>
                      ) : null}

                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                        ★ {listing.ratingAverage.toFixed(1)}{" "}
                        {listing.ratingCount ? `(${listing.ratingCount})` : ""}
                      </span>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-outline-variant/20 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant">
                          {t("listing.monthly")}
                        </p>
                        <p className="text-body-lg font-extrabold text-primary">
                          €
                          {new Intl.NumberFormat(undefined, {
                            maximumFractionDigits: 0,
                          }).format(Number(listing.pricePerMonth))}
                        </p>
                      </div>

                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container/20 text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">
                          arrow_forward
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex justify-center py-14">
              <nav className="flex items-center gap-3 rounded-full border border-outline-variant/40 bg-surface p-2 shadow-sm">
                <button
                  className="rounded-full px-4 py-2 text-body-sm font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1}
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  {t("common.previous") || "Previous"}
                </button>

                <span className="px-3 text-body-sm font-semibold text-on-surface-variant">
                  {page} / {totalPages}
                </span>

                <button
                  className="rounded-full bg-secondary px-4 py-2 text-body-sm font-bold text-white transition-colors hover:bg-[#d9590f] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page >= totalPages}
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                >
                  {t("common.next") || "Next"}
                </button>
              </nav>
            </div>
          ) : null}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[32px] border-t border-outline-variant/20 bg-surface/90 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_30px_rgba(17,24,39,0.08)] backdrop-blur-xl md:hidden">
        <a
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container/20 px-5 py-1.5 text-secondary"
          href="#"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("storage.mobileExplore")}
          </span>
        </a>

        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/60"
          href="#"
        >
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("common.save")}
          </span>
        </a>

        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/60"
          href="#"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("nav.dashboard")}
          </span>
        </a>
      </nav>
    </div>
  );
}
