"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { StorageType } from "@prisma/client";

import { haversineDistance } from "@/lib/geo";

type ListingCard = {
  id: string;
  title: string;
  city: string;
  address: string;
  storageType: StorageType;
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

type SortMode = "recommended" | "nearest" | "priceLowHigh" | "sizeLargest";

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

const SQUARE_FEET_TO_SQUARE_METERS = 0.09290304;

const searchModeOptions: Array<{
  value: SearchMode;
  labelKey: string;
  placeholderKey: string;
}> = [
  { value: "all", labelKey: "storage.searchModeAll", placeholderKey: "storage.searchPlaceholder" },
  { value: "address", labelKey: "storage.searchModeAddress", placeholderKey: "storage.searchAddressPlaceholder" },
  { value: "postalCode", labelKey: "storage.searchModePostalCode", placeholderKey: "storage.searchPostalCodePlaceholder" },
  { value: "city", labelKey: "storage.searchModeCity", placeholderKey: "storage.searchCityPlaceholder" },
  { value: "geolocation", labelKey: "storage.searchModeGeolocation", placeholderKey: "storage.searchGeolocationPlaceholder" },
];

const amenityFilterOptions = [
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
    amenityNames: ["Climate Control", "Climate Controlled"],
  },
  {
    key: "humidity",
    labelKey: "storage.filterHumidity",
    amenityNames: ["Climate Control", "Climate Controlled"],
  },
] as const;

const storageTypeOptions = [
  { value: StorageType.GARAGE, labelKey: "storage.typeGarage" },
  { value: StorageType.ROOM, labelKey: "storage.typeRoom" },
  { value: StorageType.WAREHOUSE, labelKey: "storage.typeWarehouse" },
  { value: StorageType.BASEMENT, labelKey: "storage.typeBasement" },
] as const;

function formatArea(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value)} m²`;
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
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>({
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
  });
  const [appliedFilters, setAppliedFilters] = useState<BrowseFilters>({
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
  });
  const [page, setPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        draftFilters.searchMode !== "all" ||
          draftFilters.query.trim() ||
          draftFilters.minPrice.trim() ||
          draftFilters.maxPrice.trim() ||
          draftFilters.minSize.trim() ||
          draftFilters.maxSize.trim() ||
          draftFilters.storageType ||
          draftFilters.radiusKm !== "10" ||
          draftFilters.latitude.trim() ||
          draftFilters.longitude.trim() ||
          draftFilters.amenityNames.length,
      ),
    [draftFilters],
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "12");
    const query = appliedFilters.query.trim();

    if (query && appliedFilters.searchMode !== "geolocation") {
      if (appliedFilters.searchMode === "address") {
        params.set("address", query);
      } else if (appliedFilters.searchMode === "postalCode") {
        params.set("postalCode", query);
      } else if (appliedFilters.searchMode === "city") {
        params.set("city", query);
      } else {
        params.set("location", query);
      }
    }

    if (appliedFilters.storageType) {
      params.set("storageType", appliedFilters.storageType);
    }

    if (appliedFilters.minPrice.trim()) {
      params.set("minPrice", appliedFilters.minPrice.trim());
    }

    if (appliedFilters.maxPrice.trim()) {
      params.set("maxPrice", appliedFilters.maxPrice.trim());
    }

    if (appliedFilters.minSize.trim()) {
      params.set("minSize", appliedFilters.minSize.trim());
    }

    if (appliedFilters.maxSize.trim()) {
      params.set("maxSize", appliedFilters.maxSize.trim());
    }

    if (appliedFilters.searchMode === "geolocation") {
      if (appliedFilters.latitude.trim()) {
        params.set("latitude", appliedFilters.latitude.trim());
      }

      if (appliedFilters.longitude.trim()) {
        params.set("longitude", appliedFilters.longitude.trim());
      }

      if (appliedFilters.radiusKm.trim()) {
        params.set("radiusKm", appliedFilters.radiusKm.trim());
      }
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
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}&suggest=1`,
          { headers: { Accept: "application/json" } },
        );

        const data = (await response.json()) as
          | { suggestions?: GeocodeSuggestion[]; error?: string }
          | undefined;

        if (!response.ok || !data?.suggestions) {
          throw new Error(data?.error ?? t("storage.geoLookupFailed"));
        }

        if (!cancelled) {
          setSuggestions(data.suggestions);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
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
  const activeSearchModeConfig =
    searchModeOptions.find((option) => option.value === draftFilters.searchMode) ??
    searchModeOptions[0];

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
  }, [appliedFilters.latitude, appliedFilters.longitude, appliedFilters.searchMode]);

  const sortedListings = useMemo(() => {
    const withDistance = listings.map((listing) => {
      const latitude = listing.latitude;
      const longitude = listing.longitude;

      if (!searchOrigin || latitude === null || longitude === null) {
        return { listing, distanceKm: null };
      }

      return {
        listing,
        distanceKm: haversineDistance(
          searchOrigin.latitude,
          searchOrigin.longitude,
          latitude,
          longitude,
        ),
      };
    });

    const sorted = [...withDistance];

    if (sortMode === "nearest") {
      sorted.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
    } else if (sortMode === "priceLowHigh") {
      sorted.sort(
        (a, b) => Number(a.listing.pricePerMonth) - Number(b.listing.pricePerMonth),
      );
    } else if (sortMode === "sizeLargest") {
      sorted.sort((a, b) => {
        const aSize = a.listing.sizeM2 ?? (a.listing.sizeSqFt ?? 0) * SQUARE_FEET_TO_SQUARE_METERS;
        const bSize = b.listing.sizeM2 ?? (b.listing.sizeSqFt ?? 0) * SQUARE_FEET_TO_SQUARE_METERS;
        return bSize - aSize;
      });
    }

    return sorted;
  }, [listings, searchOrigin, sortMode]);

  function updateDraft<K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleAmenityFilter(optionKeys: string[]) {
    setDraftFilters((current) => {
      const isEnabled = optionKeys.every((amenityName) => current.amenityNames.includes(amenityName));

      return {
        ...current,
        amenityNames: isEnabled
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

    if (draftFilters.searchMode === "geolocation" && query) {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" },
        });

        const data = (await response.json()) as GeocodeResponse;

        if (!response.ok || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
          throw new Error(data.error ?? t("storage.geoLookupFailed"));
        }

        latitude = String(data.latitude);
        longitude = String(data.longitude);
        query = data.displayName;
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
      `/api/geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    const data = (await response.json().catch(() => null)) as GeocodeResponse | null;

    if (!response.ok || !data) {
      throw new Error(t("storage.geoLookupFailed"));
    }

    return data;
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
          const data = await resolvePlaceName(position.coords.latitude, position.coords.longitude);
          const nextFilters: BrowseFilters = {
            ...draftFilters,
            searchMode: "geolocation",
            query: data.displayName,
            latitude: String(data.latitude),
            longitude: String(data.longitude),
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
    const resetFilters: BrowseFilters = {
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

    setDraftFilters(resetFilters);
    setAppliedFilters(resetFilters);
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
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:mt-32 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-outline-variant/60 bg-surface p-4 shadow-[0_18px_60px_-24px_rgba(17,24,39,0.18)] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center">
            <label className="flex min-h-14 items-center rounded-2xl bg-surface-container-lowest px-4">
              <span className="sr-only">{t("storage.searchType")}</span>
              <span
                className="material-symbols-outlined mr-3 text-secondary/60"
                data-icon="tune"
              >
                tune
              </span>
              <select
                className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                value={draftFilters.searchMode}
                onChange={(event) => {
                  const nextMode = event.target.value as SearchMode;
                  setDraftFilters((current) => ({
                    ...current,
                    searchMode: nextMode,
                  }));
                }}
              >
                {searchModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <div className="relative flex min-h-14 items-center rounded-2xl bg-surface-container-lowest px-4">
              <span className="material-symbols-outlined mr-3 text-secondary/60" data-icon="search">
                search
              </span>
              <input
                className="w-full border-none bg-transparent font-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-0"
                placeholder={t(activeSearchModeConfig.placeholderKey)}
                type="text"
                value={draftFilters.query}
                onChange={(event) =>
                  updateDraft("query", event.target.value)
                }
              />
              {suggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
                  {suggestions.map((suggestion, index) => (
                    <button
                      className="flex w-full flex-col gap-1 border-b border-outline-variant/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary-container/20"
                      key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.displayName}-${index}`}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <span className="text-body-sm font-semibold text-primary">
                        {suggestion.displayName}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {suggestion.city ?? suggestion.address}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-nowrap items-center justify-end gap-2">
              <label className="flex min-h-14 flex-1 items-center rounded-2xl bg-surface-container-lowest px-4">
                <span className="sr-only">{t("storage.distance")}</span>
                <span className="material-symbols-outlined mr-3 text-secondary/60" data-icon="near_me">
                  near_me
                </span>
                <select
                  className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
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
                className="flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-white shadow-md transition-all hover:bg-[#d9590f] active:scale-95"
                type="button"
                onClick={handleApplyFilters}
              >
                <span className="material-symbols-outlined" data-icon="search">
                  search
                </span>
                <span className="font-bold">{t("common.search")}</span>
              </button>

              <button
                className="flex min-h-14 w-12 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low text-primary transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={currentLocationLoading}
                title={t("storage.useCurrentLocation")}
                onClick={() => {
                  void handleUseCurrentLocation();
                }}
              >
                <span className="material-symbols-outlined" data-icon="my_location">
                  {currentLocationLoading ? "progress_activity" : "my_location"}
                </span>
              </button>

              <button
                className={`flex min-h-14 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  hasActiveFilters
                    ? "border-secondary/35 bg-secondary-container/20 text-secondary hover:border-secondary/60 hover:text-secondary"
                    : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-secondary hover:text-secondary"
                }`}
                type="button"
                title={t("common.reset")}
                onClick={handleResetFilters}
              >
                <span className="material-symbols-outlined" data-icon="refresh">
                  refresh
                </span>
              </button>
            </div>
          </div>
          {suggestionsLoading ? (
            <p className="mt-3 text-xs text-on-surface-variant">{t("common.loading")}</p>
          ) : null}

          {draftFilters.searchMode === "geolocation" ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3">
                <span className="material-symbols-outlined text-secondary/60" data-icon="pin_drop">
                  pin_drop
                </span>
                <input
                  className="w-full border-none bg-transparent font-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-0"
                  placeholder={t("storage.searchGeolocationPlaceholder")}
                  type="text"
                  value={draftFilters.query}
                  onChange={(event) => updateDraft("query", event.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-3">
                  <span className="material-symbols-outlined text-secondary/60" data-icon="location_on">
                    location_on
                  </span>
                  <input
                    className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                    placeholder={t("storage.latitudeLabel")}
                    type="text"
                    value={draftFilters.latitude}
                    onChange={(event) => updateDraft("latitude", event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-3">
                  <span className="material-symbols-outlined text-secondary/60" data-icon="explore">
                    explore
                  </span>
                  <input
                    className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                    placeholder={t("storage.longitudeLabel")}
                    type="text"
                    value={draftFilters.longitude}
                    onChange={(event) => updateDraft("longitude", event.target.value)}
                  />
                </label>
              </div>

              <button
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-body-sm font-bold text-primary transition-colors hover:border-secondary hover:text-secondary"
                type="button"
                onClick={() => {
                  void handleUseCurrentLocation();
                }}
              >
                {t("storage.useCurrentLocation")}
              </button>
            </div>
          ) : null}
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
              {appliedFilters.query ||
                (appliedFilters.searchMode === "geolocation" && appliedFilters.latitude && appliedFilters.longitude
                  ? `${appliedFilters.latitude.slice(0, 6)}, ${appliedFilters.longitude.slice(0, 6)}`
                  : t("storage.region"))}
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
            <select
              className="bg-transparent border-none focus:ring-0 font-bold text-body-sm text-primary appearance-none cursor-pointer pr-4"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="recommended">{t("storage.sortRecommended")}</option>
              <option value="nearest">{t("storage.sortNearest")}</option>
              <option value="priceLowHigh">{t("storage.sortPriceLowHigh")}</option>
              <option value="sizeLargest">{t("storage.sortSizeLargest")}</option>
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
              <label className="font-bold text-[13px] text-on-surface mb-4 block">
                {t("storage.priceRange")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                  inputMode="decimal"
                  placeholder={t("storage.priceMin")}
                  type="text"
                  value={draftFilters.minPrice}
                  onChange={(event) => updateDraft("minPrice", event.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                  inputMode="decimal"
                  placeholder={t("storage.priceMax")}
                  type="text"
                  value={draftFilters.maxPrice}
                  onChange={(event) => updateDraft("maxPrice", event.target.value)}
                />
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.unitSize")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                  placeholder={t("storage.sizeMin")}
                  type="text"
                  value={draftFilters.minSize}
                  onChange={(event) => updateDraft("minSize", event.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 text-body-sm outline-none transition-colors focus:border-secondary"
                  placeholder={t("storage.sizeMax")}
                  type="text"
                  value={draftFilters.maxSize}
                  onChange={(event) => updateDraft("maxSize", event.target.value)}
                />
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.storageType")}
              </label>
              <div className="flex flex-wrap gap-2">
                {storageTypeOptions.map(({ value, labelKey }) => (
                  <button
                    className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition-all ${
                      draftFilters.storageType === value
                      ? "border-2 border-secondary text-secondary font-bold bg-secondary-container/15"
                        : "border border-outline-variant/40 text-on-surface-variant font-medium hover:border-secondary"
                    }`}
                    key={value}
                    type="button"
                    onClick={() => {
                      updateDraft(
                        "storageType",
                        draftFilters.storageType === value ? "" : (value as StorageType),
                      );
                    }}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                {t("storage.filters")}
              </label>
              <div className="space-y-3">
                {amenityFilterOptions.map((option) => {
                  const isSelected = option.amenityNames.every((amenityName) =>
                    draftFilters.amenityNames.includes(amenityName),
                  );

                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-body-sm transition-colors ${
                        isSelected
                          ? "border-secondary bg-secondary-container/15 text-secondary"
                          : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-secondary"
                      }`}
                      key={option.key}
                      type="button"
                      onClick={() => toggleAmenityFilter([...option.amenityNames])}
                    >
                      <span>{t(option.labelKey)}</span>
                      <span className="material-symbols-outlined text-[18px]">
                        {isSelected ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3">
                  <span className="material-symbols-outlined text-secondary/60" data-icon="location_on">
                    location_on
                  </span>
                  <input
                    className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                    placeholder={t("storage.latitudeLabel")}
                    type="text"
                    value={draftFilters.latitude}
                    onChange={(event) => updateDraft("latitude", event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3">
                  <span className="material-symbols-outlined text-secondary/60" data-icon="explore">
                    explore
                  </span>
                  <input
                    className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                    placeholder={t("storage.longitudeLabel")}
                    type="text"
                    value={draftFilters.longitude}
                    onChange={(event) => updateDraft("longitude", event.target.value)}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3">
                <span className="material-symbols-outlined text-secondary/60" data-icon="my_location">
                  my_location
                </span>
                <select
                  className="w-full border-none bg-transparent font-body-md text-on-surface outline-none focus:ring-0"
                  value={draftFilters.radiusKm}
                  onChange={(event) => updateDraft("radiusKm", event.target.value)}
                >
                  <option value="1">{t("storage.within1")}</option>
                  <option value="5">{t("storage.within5")}</option>
                  <option value="10">{t("storage.within10")}</option>
                  <option value="25">{t("storage.within25")}</option>
                  <option value="50">Within 50 km</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3">
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
                onClick={handleResetFilters}
              >
                {t("storage.clearFilters")}
              </button>
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
            {sortedListings.map(({ listing, distanceKm }) => (
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
                  {distanceKm !== null ? (
                    <div className="absolute bottom-4 right-4 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg">
                      {distanceKm < 1
                        ? `${Math.round(distanceKm * 1000)} m`
                        : `${distanceKm.toFixed(1)} km`}
                    </div>
                  ) : null}
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
                      {formatArea(listing.sizeM2 ?? (listing.sizeSqFt !== null ? listing.sizeSqFt * SQUARE_FEET_TO_SQUARE_METERS : null))}
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
                        €
                        {new Intl.NumberFormat(undefined, {
                          maximumFractionDigits: 0,
                        }).format(Number(listing.pricePerMonth))}
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
