"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StorageType } from "@prisma/client";

type ListingCard = {
  id: string;
  title: string;
  city: string;
  storageType: StorageType;
  pricePerMonth: string;
  sizeSqFt: number | null;
  ratingAverage: number;
  ratingCount: number;
  imageUrl: string | null;
  amenityNames: string[];
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

function formatStorageType(value: StorageType) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BrowseStoragePage() {
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [storageType, setStorageType] = useState<StorageType | "">("");
  const [sizePreset, setSizePreset] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

      try {
        const response = await fetch(`/api/listings?${queryString}`, {
          headers: { Accept: "application/json" },
        });

        const json = (await response.json()) as ListingsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(json.error ?? "Unable to load listings.");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setData({ listings: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 1 } });
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
  }, [queryString]);

  const listings = data?.listings ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed min-h-screen">
      <section className="mt-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-white border border-outline-variant/40 rounded-xl px-2 py-2 flex flex-wrap md:flex-nowrap items-center gap-2 shadow-[0_10px_40px_-10px_rgba(0,38,39,0.12)]">
          <div className="flex items-center flex-1 min-w-[200px] pl-6 h-14">
            <span
              className="material-symbols-outlined text-primary-container/60 mr-3"
              data-icon="location_on"
            >
              location_on
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
              placeholder="Where do you need storage?"
              type="text"
              value={location}
              onChange={(event) => {
                setPage(1);
                setLocation(event.target.value);
                setCity(event.target.value);
              }}
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30 mx-2"></div>
          <div className="flex items-center flex-1 min-w-[150px] px-4 h-14">
            <span
              className="material-symbols-outlined text-primary-container/60 mr-3"
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
              <option value="">Any Size</option>
              <option value="SMALL">Small (5x5 ft)</option>
              <option value="MEDIUM">Medium (10x10 ft)</option>
              <option value="LARGE">Large (20x20 ft)</option>
            </select>
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30 mx-2"></div>
          <div className="flex items-center flex-1 min-w-[150px] px-4 h-14">
            <span
              className="material-symbols-outlined text-primary-container/60 mr-3"
              data-icon="calendar_month"
            >
              calendar_month
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
              placeholder="Move-in date"
              type="text"
            />
          </div>
          <button
            className="bg-primary text-white h-14 px-8 rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-primary-container active:scale-95 shadow-md"
            type="button"
            onClick={() => setPage(1)}
          >
            <span className="material-symbols-outlined" data-icon="search">
              search
            </span>
            <span className="font-bold">Search</span>
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-outline-variant/20 pb-6">
        <div>
          <h2 className="font-h1 text-h2 text-primary-container flex items-center gap-3">
            {loading ? "Loading..." : `${total} Storage Caves`}
            <span className="text-body-sm font-normal text-on-surface-variant px-3 py-1 bg-surface-container rounded-full italic-emphasis">
              {location || city || "Greater San Francisco Area"}
            </span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <button className="flex items-center gap-2 text-primary font-bold text-body-sm hover:underline" type="button">
            <span className="material-symbols-outlined text-[20px]" data-icon="map">
              map
            </span>
            Show Map
          </button>
          <div className="flex items-center gap-2">
            <span className="text-label-caps text-on-surface-variant">
              Sort by:
            </span>
            <select className="bg-transparent border-none focus:ring-0 font-bold text-body-sm text-primary appearance-none cursor-pointer pr-4">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Size: Largest</option>
            </select>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-gutter">
        <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-10">
          <div className="bg-surface-container-low/40 p-6 rounded-lg border border-outline-variant/20 lg:sticky lg:top-24">
            <h3 className="font-label-caps text-label-caps text-primary mb-6 tracking-widest uppercase">
              Refine Search
            </h3>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                Price Range (Monthly)
              </label>
              <div className="relative w-full h-1 bg-surface-container-high rounded-full mt-4 mb-3">
                <div className="absolute h-full w-2/3 bg-secondary rounded-full left-1/4"></div>
                <div className="absolute -top-1.5 left-1/4 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-white"></div>
                <div className="absolute -top-1.5 left-[91%] w-4 h-4 bg-primary rounded-full shadow-md border-2 border-white"></div>
              </div>
              <div className="flex justify-between text-[13px] font-semibold text-on-surface-variant">
                <span>$50</span>
                <span>$1,200+</span>
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-outline-variant/20">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                Unit Size
              </label>
              <div className="space-y-4">
                {[
                  ["SMALL", "Small (up to 50 sq ft)"],
                  ["MEDIUM", "Medium (50 - 150 sq ft)"],
                  ["LARGE", "Large (150 - 300 sq ft)"],
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
                Storage Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  [StorageType.GARAGE, "Garage"],
                  [StorageType.ROOM, "Loft"],
                  [StorageType.WAREHOUSE, "Warehouse"],
                  [StorageType.BASEMENT, "Basement"],
                ].map(([value, label]) => (
                  <button
                    className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider transition-all ${
                      storageType === value
                        ? "border-2 border-primary text-primary font-bold bg-primary/5"
                        : "border border-outline-variant/40 text-on-surface-variant font-medium hover:border-primary"
                    }`}
                    key={value}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setStorageType(value as StorageType);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="font-bold text-[13px] text-on-surface mb-5 block">
                Distance
              </label>
              <select className="w-full bg-white border border-outline-variant/30 rounded-lg p-2.5 text-body-sm focus:border-primary focus:ring-0">
                <option>Within 5 miles</option>
                <option value="Within 10 miles">Within 10 miles</option>
                <option>Within 25 miles</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                href={`/storage/${listing.id}`}
                key={listing.id}
                className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 card-shadow card-hover transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
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
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[16px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {listing.ratingAverage.toFixed(1) || "0.0"}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="font-h3 text-h3 text-primary leading-tight mb-1">
                    {listing.title}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-6">
                    <span className="material-symbols-outlined text-[16px]">
                      location_on
                    </span>
                    {listing.city}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20 mt-auto">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        square_foot
                      </span>
                      {listing.sizeSqFt ?? "—"} sq ft
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        verified
                      </span>
                      {listing.amenityNames[0] ?? "Verified"}
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-extrabold text-primary text-body-lg">
                        ${listing.pricePerMonth}
                      </span>
                      <span className="text-on-surface-variant font-medium text-xs">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="py-20 flex justify-center">
            <nav className="flex items-center gap-4">
              <button
                className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant hover:text-primary transition-all bg-white shadow-sm disabled:opacity-40"
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
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant font-bold"
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
                className="w-12 h-12 rounded-full border border-outline-variant/40 flex items-center justify-center hover:border-primary text-on-surface-variant hover:text-primary transition-all bg-white shadow-sm disabled:opacity-40"
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

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 md:hidden bg-white/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
        <a
          className="flex flex-col items-center justify-center text-primary bg-primary/5 rounded-full px-5 py-1.5"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="search">
            search
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            Explore
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/50"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="favorite">
            favorite
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            Saved
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-on-surface-variant/50"
          href="#"
        >
          <span className="material-symbols-outlined" data-icon="person">
            person
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold">
            Profile
          </span>
        </a>
      </nav>
    </div>
  );
}
