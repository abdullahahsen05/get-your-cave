"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/components/ui/UserAvatar";

type ListingDetail = {
  id: string;
  title: string;
  description: string;
  storageType: string;
  city: string;
  address: string;
  availability: string;
  latitude: number | null;
  longitude: number | null;
  pricePerMonth: string;
  sizeSqFt: number | null;
  ratingAverage: number;
  ratingCount: number;
  amenityNames: string[];
  imageUrl: string | null;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  owner: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    city: string | null;
    responseRate: number | null;
    verificationStatus: string;
  };
  securityDeposit: string;
  insuranceFee: string;
};

type Props = {
  listingId?: string;
};

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "OWNER" | "RENTER";
};

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDvOaq7w-wrMJTbpSflULdtVljsC7lPIQ-P_cOGDlmvmn0F-KWt9QJDgMY8isuu3BzCGvHS3nINmRP-Wvd8C1S_jiKBCjYKxBSsg_nT985iIqaWJtZBX8MfXpKuEH83_BwQ5_WDWF8TcFhxkNjkDvdsfVEswUa3UYhsBccvvVjdnTCrvWGroYVu7XP_80UhZeqyn-4PwcKaXRcdgsA5hRCXS5zHXdeEsTCxikgslZt5O34mV1ubp1lCQClnEWiFqErOPzBgTuxqDlA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDSFxERFxhCmvO_5DTcAE5yQr23z_XbX0R3Q3goZVT1D22dI5oktXZ3KYJOKlZwqDDIGJEk9jBt6WQtru4X4NUJcdHanvzmh1eGfvwg9fYB7TETbzlKlB-8F5YyV1M0ARPjm4CV5qAYXd46udsHMAVd4xvhHTDEjOiPJgCE-QYoAA_olEzXmDLmDx8VytGJ9QTSpfF5XdSyas_b3SDxxlgFRgbhw7xCF-PTUmllJdHApXhurbTQjmjT84e2DZ0PN0IJ2gAbuqNLgeg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBw7OtqXpeeS7Za_AX9FXVKblgSXKm4uvwdDjzks-eCoSk8sdjJohT8ZSKsaEjHv74cEl62qjO-HELBOw3Ez5dkkr431O-QQY1gwQYqKjCV5Ubp9HUW-1NPrJREVeFNOGUfJHyOjfuhLs7WLszKru1tT36vD2nMULm9feAp-a2Nm1BRrcz_PGCsFgDhq_tQjtMswRpl7GZq2-MI62VLRj_LX3GacmOz-2dg1vqxkw7obM4V6qJRrW3FrXJkvdReyfjIgQ8zj0_E7HM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC0UjhpjVHjswTHB655fOm2QyB8fYwn1cZvpJwk5Agq3Alcq0b-46dDx4Mrt3gAxcRADRuv0dJhWkjz0sW9W4DsLYxFZKjSBQQjdUyYF-EKOvFVk6_KWwty-6uoQLxWhEiizsUmYajfmWzWJ-zELdI4miZ8ufz3hQfInqURHEB05FJRkjWB3MVEz4dwmC36yY8OfLfi0pzkQSIgEUTuHy1eZ2YT_cb7VXg5PG5K0D_2tUKVnhbytiiAq6vvo3BzRIvfURck0LhPjsE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBgyUWS7TI7LHwxZoCWpuuxqf-QSm3j5mL8H9QSLpBe-sXb1ZWMh5XcFsKTdcmss5J1dzbSW01dkBxBnS1HxfFXPL_sscFTueR2xtHczwZ-_ps0maGikUXfTNjPG9M4xJofahViTvf4_Cjl3TuoTWvI7byfaRtRdIhqf0LR2NoUNWLLTMMSrYTnj1f5wWuKFmseA3C9eE8LRaf5oQgjy3zl322EQvKyNGS2FAMraQYOjIhv_XmwvhcE9WF9yBiTBPxDvuq_KzvMArw",
];

const ListingMap = dynamic(() => import("@/components/maps/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container animate-pulse" />
  ),
});

function formatStorageType(value: string, t: (key: string) => string) {
  if (value === "GARAGE") return t("createListing.storageTypes.garage");
  if (value === "BASEMENT") return t("createListing.storageTypes.basement");
  if (value === "ROOM") return t("createListing.storageTypes.room");
  if (value === "WAREHOUSE") return t("createListing.storageTypes.warehouse");

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

export default function ListingDetailPage({ listingId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeListingId, setActiveListingId] = useState<string | null>(listingId ?? null);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingDuration, setBookingDuration] = useState("1");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const bookingDurationMonths = Math.max(1, Number(bookingDuration) || 1);
  const totalAmount = `€${(Number(listing?.pricePerMonth ?? 0) * bookingDurationMonths).toFixed(2)}`;

  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      setLoading(true);

      try {
        let targetId = activeListingId;

        if (!targetId) {
          const collectionResponse = await fetch("/api/listings?limit=1", {
            headers: { Accept: "application/json" },
          });
          const collectionData = (await collectionResponse.json()) as {
            listings?: Array<{ id: string }>;
          };
          targetId = collectionData.listings?.[0]?.id ?? null;
          if (!targetId) {
            if (!cancelled) {
              setListing(null);
            }
            return;
          }
          if (!cancelled) {
            setActiveListingId(targetId);
          }
        }

        const response = await fetch(`/api/listings/${targetId}`, {
          headers: { Accept: "application/json" },
        });

        const data = (await response.json()) as { listing?: ListingDetail; error?: string };

        if (!response.ok) {
          throw new Error(t("listingDetail.loadError"));
        }

        if (!cancelled) {
          setListing(data.listing ?? null);
        }
      } catch {
        if (!cancelled) {
          setListing(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [activeListingId, t]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setSessionLoading(true);

      try {
        const response = await fetch("/api/auth/session", {
          headers: { Accept: "application/json" },
        });
        const data = (await response.json()) as {
          user?: SessionUser | null;
        };

        if (!cancelled) {
          setSessionUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const galleryImages = useMemo(() => {
    if (!listing) {
      return fallbackImages;
    }

    return listing.images.length
      ? listing.images.map((image) => image.url)
      : [listing.imageUrl ?? fallbackImages[0], ...fallbackImages.slice(1)];
  }, [listing]);

  if (loading) {
    return (
      <main className="bg-background text-on-surface font-body-md selection:bg-secondary-container min-h-screen pt-28 sm:pt-32 pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-10 w-96 rounded-full bg-surface-container animate-pulse" />
          <div className="h-[420px] rounded-2xl bg-surface-container animate-pulse" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-full bg-surface-container animate-pulse" />
              <div className="h-4 w-1/2 rounded-full bg-surface-container animate-pulse" />
              <div className="h-64 rounded-2xl bg-surface-container animate-pulse" />
            </div>
            <div className="h-[520px] rounded-2xl bg-surface-container animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="bg-background text-on-surface font-body-md selection:bg-secondary-container min-h-screen pt-28 sm:pt-32 pb-xxl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-outline-variant/60 bg-surface p-8">
            <h1 className="font-h1 text-h1 text-primary">{t("listingDetail.notFoundTitle")}</h1>
            <p className="text-body-md text-on-surface-variant mt-2">
              {t("listingDetail.notFoundDescription")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const primaryImage = galleryImages[0] ?? fallbackImages[0];
  const secondaryImages = galleryImages.slice(1, 5);
  const hasCoordinates =
    typeof listing.latitude === "number" && typeof listing.longitude === "number";
  const isBookable = listing.availability === "AVAILABLE";

  const canBook = sessionUser?.role === "RENTER" && isBookable;
  const canStartConversation = sessionUser?.role === "RENTER";
  const loginHref = `/login?next=${encodeURIComponent(`/storage/${listing.id}`)}`;
  const signupHref = `/signup?next=${encodeURIComponent(`/storage/${listing.id}`)}`;

  async function handleBookingSubmit() {
    if (!canBook) {
      if (!sessionUser) {
        router.push(loginHref);
      }
      return;
    }

    const currentListing = listing;
    if (!currentListing) {
      return;
    }

    setBookingMessage(null);
    setBookingError(null);
    setIsBooking(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          listingId: currentListing.id,
          startDate: bookingStartDate,
          durationMonths: Number(bookingDuration) || 1,
          renterNote: bookingNote.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        booking?: { bookingNumber?: string; status?: string };
        error?: string;
      };

      if (!response.ok || !data.booking?.bookingNumber) {
        setBookingError(t("listingDetail.bookingError"));
        return;
      }

      const statusKey = data.booking.status ? `status.booking.${data.booking.status}` : "status.booking.PENDING";
      setBookingMessage(
        t("listingDetail.bookingSubmitted", {
          bookingNumber: data.booking.bookingNumber,
          status: t(statusKey),
        }),
      );
      setBookingStartDate("");
      setBookingDuration("1");
      setBookingNote("");
      router.refresh();
    } catch {
      setBookingError(t("listingDetail.bookingError"));
    } finally {
      setIsBooking(false);
    }
  }

  async function handleContactOwner() {
    if (!sessionUser) {
      router.push(loginHref);
      return;
    }

    if (sessionUser.role !== "RENTER") {
      return;
    }

    const currentListing = listing;
    if (!currentListing) {
      return;
    }

    setBookingError(null);
    setBookingMessage(null);
    setConversationError(null);
    setIsStartingConversation(true);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          listingId: currentListing.id,
        }),
      });

      const data = (await response.json()) as {
        conversation?: { id: string };
        error?: string;
      };

      if (!response.ok || !data.conversation?.id) {
        setConversationError(t("listingDetail.conversationError"));
        return;
      }

      router.push(`/messaging?conversation=${data.conversation.id}`);
    } catch {
      setConversationError(t("listingDetail.conversationError"));
    } finally {
      setIsStartingConversation(false);
    }
  }

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-secondary-container min-h-screen">
      <main className="pt-28 sm:pt-32 pb-24 sm:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-h1 text-[34px] leading-[1.05] text-primary sm:text-h1 mb-3">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-bold text-on-surface">
                  {listing.ratingAverage.toFixed(2)}
                </span>
                <span>{t("listingDetail.reviewsLabel", { count: listing.ratingCount })}</span>
              </div>
              <span className="text-surface-dim">•</span>
              <span className="underline font-medium cursor-pointer">
                {listing.city}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
          <button className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 font-label-caps text-label-caps transition-colors hover:bg-secondary-container/20 sm:flex-none" type="button">
              <span className="material-symbols-outlined text-md">ios_share</span>
              {t("listingDetail.share")}
            </button>
          <button className="flex items-center gap-2 font-label-caps text-label-caps hover:bg-secondary-container/20 transition-colors p-2 rounded-lg" type="button">
              <span className="material-symbols-outlined text-md">favorite</span>
              {t("listingDetail.save")}
            </button>
          </div>
        </div>

        <div className="mb-10 grid h-auto grid-cols-1 gap-2 overflow-hidden rounded-[22px] sm:grid-cols-4 sm:grid-rows-2 lg:mb-14 lg:h-[520px]">
          <div className="group relative min-h-[260px] overflow-hidden bg-surface-container sm:col-span-2 sm:row-span-2 sm:min-h-0">
            <img
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={primaryImage}
              alt={listing.title}
            />
          </div>
          {secondaryImages.map((image) => (
            <div className="group relative hidden min-h-[254px] overflow-hidden bg-surface-container sm:block" key={image}>
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                src={image}
                alt={listing.title}
              />
            </div>
          ))}
        </div>

        {hasCoordinates ? (
          <section className="mb-xl">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-h3 text-h3 text-primary">{t("listingDetail.locationMap")}</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {listing.city} • {listing.address}
                </p>
              </div>
            </div>
            <ListingMap
              address={listing.address}
              city={listing.city}
              latitude={listing.latitude}
              longitude={listing.longitude}
              title={listing.title}
            />
          </section>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-xl">
          <div className="space-y-10 sm:space-y-12">
            <section className="border-b border-outline-variant/60 pb-8">
              <div className="flex items-start justify-between gap-5 sm:gap-6">
                <div>
            <h2 className="font-h2 text-[26px] leading-tight text-primary sm:text-h2 mb-2">
                    {formatStorageType(listing.storageType, t)} in {listing.city}
                  </h2>
                  <p className="text-body-md text-on-surface-variant italic-emphasis italic opacity-80">
                    {listing.sizeSqFt ?? "—"} {t("listingDetail.sqFt")} • {listing.address}
                  </p>
                </div>
                <UserAvatar
                  avatarUrl={listing.owner.avatarUrl}
                  className="h-14 w-14 border-2 border-secondary-container sm:h-16 sm:w-16"
                  name={listing.owner.fullName}
                  size="lg"
                />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-3 sm:gap-5">
              {(listing.amenityNames.slice(0, 3).length
                ? listing.amenityNames.slice(0, 3)
                : [t("listingDetail.secureAccess"), t("listingDetail.climateControl"), t("listingDetail.access247")]
              ).map((amenity) => (
                <div className="flex gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4" key={amenity}>
                  <span className="material-symbols-outlined text-secondary text-3xl">
                    verified_user
                  </span>
                  <div>
                    <h4 className="font-bold text-body-md">{formatAmenityLabel(amenity, t)}</h4>
                    <p className="text-body-sm text-on-surface-variant">
                      {t("listingDetail.trustedFeature")}
                    </p>
                  </div>
                </div>
              ))}
            </section>

            <section className="border-t border-outline-variant/60 pt-10">
              <h3 className="font-h3 text-h3 text-primary mb-4">{t("listingDetail.aboutThisSpace")}</h3>
              <div className="max-w-3xl space-y-4 text-body-lg leading-relaxed text-on-surface-variant">
                <p>{listing.description}</p>
                <button className="font-bold text-primary underline underline-offset-4 flex items-center gap-1 mt-4" type="button">
                  {t("listingDetail.showMore")}
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </section>

            <section className="flex flex-col items-center gap-6 rounded-[24px] border border-outline-variant/60 bg-surface-container-low p-6 text-center sm:p-8 md:flex-row md:text-left">
              <UserAvatar
                avatarUrl={listing.owner.avatarUrl}
                className="h-24 w-24 ring-4 ring-white sm:h-28 sm:w-28"
                name={listing.owner.fullName}
                size="xl"
              />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-h2 text-h2 text-primary">
                  {t("listingDetail.meetHost", { name: listing.owner.fullName })}
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-md">
                  {listing.owner.bio ?? listing.owner.city ?? t("listingDetail.verifiedOwner")}
                </p>
                <div className="mb-6 flex flex-wrap justify-center gap-4 md:justify-start">
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    {t("listingDetail.reviewsCount", { count: listing.ratingCount })}
                  </span>
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    {t("listingDetail.identityVerified")}
                  </span>
                </div>
                {sessionLoading ? (
                  <button
                    className="bg-secondary text-white px-xl py-3 rounded-full font-bold transition-all opacity-70"
                    type="button"
                    disabled
                  >
                    {t("common.loading")}
                  </button>
                ) : sessionUser ? (
                  canStartConversation ? (
                    <button
                      className="rounded-full bg-secondary px-8 py-3 font-bold text-white transition-all hover:bg-[#d9590f] active:scale-95 disabled:opacity-70"
                      type="button"
                      disabled={isStartingConversation}
                      onClick={() => {
                        void handleContactOwner();
                      }}
                    >
                      {isStartingConversation ? t("listingDetail.startingChat") : t("listingDetail.contactOwner")}
                    </button>
                  ) : (
                    <button
                      className="bg-secondary text-white px-xl py-3 rounded-full font-bold transition-all opacity-70 cursor-not-allowed"
                      type="button"
                      disabled
                    >
                      {t("listingDetail.contactOwner")}
                    </button>
                  )
                ) : (
                  <button
                  className="bg-secondary text-white px-xl py-3 rounded-full font-bold transition-all hover:bg-[#d9590f] active:scale-95"
                    type="button"
                    onClick={() => router.push(loginHref)}
                  >
                    {t("listingDetail.loginToContactOwner")}
                  </button>
                )}
                {conversationError ? (
                  <p className="text-sm text-error">{conversationError}</p>
                ) : null}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-28 rounded-[24px] border border-outline-variant/60 bg-surface p-5 shadow-[0_18px_50px_rgba(17,24,39,0.06)] sm:p-6 lg:top-32">
                <div className="mb-6 flex items-baseline justify-between gap-4">
                <span className="font-h2 text-h2 text-primary">
                  €{listing.pricePerMonth}
                  <span className="text-body-md font-normal text-on-surface-variant">{t("listingDetail.perMonth")}</span>
                </span>
                <span className="text-body-sm font-semibold underline">{t("listingDetail.details")}</span>
              </div>
              <div className="mb-6 overflow-hidden rounded-2xl border border-outline-variant/60">
                <div className="grid grid-cols-2 border-b border-outline-variant/60">
                  <div className="p-3 border-r border-outline-variant/60 cursor-pointer hover:bg-secondary-container/10 transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{t("listingDetail.moveIn")}</p>
                    <p className="text-sm font-medium">{t("listingDetail.anytime")}</p>
                  </div>
                  <div className="p-3 cursor-pointer hover:bg-secondary-container/10 transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{t("listingDetail.durationMonths")}</p>
                    <p className="text-sm font-medium">{bookingDurationMonths} {t("listingDetail.months")}</p>
                  </div>
                </div>
                <div className="p-3 cursor-pointer hover:bg-secondary-container/10 transition-colors">
                  <p className="font-label-caps text-[10px] text-on-surface-variant">{t("listingDetail.unitSize")}</p>
                  <p className="text-sm font-medium">{listing.sizeSqFt ?? "—"} {t("listingDetail.sqFt")}</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-secondary-container/40 bg-secondary-container/10 p-4 text-sm text-primary">
                <p className="font-semibold">
                  {t("listingDetail.totalAmount", {
                    total: totalAmount,
                    months: bookingDurationMonths,
                  })}
                </p>
              </div>

              {sessionLoading ? (
                <button
                  className="w-full bg-secondary text-white py-4 rounded-full font-bold text-body-lg mb-lg scale-100 opacity-70 transition-all"
                  type="button"
                  disabled
                >
                  {t("common.loading")}
                </button>
              ) : !isBookable ? (
                <div className="mb-lg space-y-3">
                  <button
                    className="w-full bg-secondary text-white py-4 rounded-full font-bold text-body-lg scale-100 opacity-70 transition-all cursor-not-allowed"
                    type="button"
                    disabled
                  >
                    {t("listing.unavailable")}
                  </button>
                  <p className="text-xs text-on-surface-variant text-center">
                    {t("listing.unavailable")}
                  </p>
                </div>
              ) : canBook ? (
                <div className="space-y-4 mb-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                        {t("listingDetail.moveInDate")}
                      </span>
                      <input
                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:border-primary focus:ring-0"
                        type="date"
                        value={bookingStartDate}
                        onChange={(event) => setBookingStartDate(event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                        {t("listingDetail.durationMonths")}
                      </span>
                      <input
                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:border-primary focus:ring-0"
                        min={1}
                        step={1}
                        type="number"
                        value={bookingDuration}
                        onChange={(event) => setBookingDuration(event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                        {t("listingDetail.note")}
                      </span>
                      <textarea
                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:border-primary focus:ring-0 resize-none"
                        rows={3}
                        placeholder={t("listingDetail.notePlaceholder")}
                        value={bookingNote}
                        onChange={(event) => setBookingNote(event.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    className="w-full rounded-full bg-secondary py-4 text-body-lg font-bold text-white transition-all hover:bg-[#d9590f] active:scale-95 disabled:opacity-70"
                    type="button"
                    disabled={isBooking || !bookingStartDate}
                    onClick={() => {
                      void handleBookingSubmit();
                    }}
                  >
                    {isBooking ? t("listingDetail.requesting") : t("listingDetail.bookNow")}
                  </button>
                </div>
              ) : sessionUser ? (
                <div className="mb-lg">
                  <button
                    className="w-full bg-secondary text-white py-4 rounded-full font-bold text-body-lg scale-100 opacity-70 transition-all cursor-not-allowed"
                    type="button"
                    disabled
                  >
                    {t("listingDetail.rentersOnly")}
                  </button>
                </div>
              ) : (
                <div className="mb-lg space-y-3">
                  <button
                    className="w-full bg-secondary text-white py-4 rounded-full font-bold text-body-lg scale-100 hover:bg-[#d9590f] active:scale-95 transition-all"
                    type="button"
                    onClick={() => router.push(loginHref)}
                  >
                    {t("listingDetail.loginToBook")}
                  </button>
                  <button
                    className="w-full border border-outline-variant text-primary py-3 rounded-full font-bold text-body-md hover:bg-secondary-container/20 transition-all"
                    type="button"
                    onClick={() => router.push(signupHref)}
                  >
                    {t("listingDetail.signUpToBook")}
                  </button>
                </div>
              )}

              <p className="text-center text-body-sm text-on-surface-variant italic-emphasis mb-lg">
                {t("listingDetail.noChargeYet")}
              </p>
              {bookingMessage ? (
                <div className="mb-4 rounded-lg border border-secondary/30 bg-secondary-container/20 px-4 py-3 text-sm text-primary">
                  {bookingMessage}
                </div>
              ) : null}
              {bookingError ? (
                <div className="mb-4 rounded-lg border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
                  {bookingError}
                </div>
              ) : null}
              <div className="space-y-3">
                <div className="flex justify-between text-body-md">
                  <span className="underline">{t("listingDetail.securityDeposit")}</span>
                  <span>€{listing.securityDeposit}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">{t("listingDetail.caveInsurance")}</span>
                  <span>€{listing.insuranceFee}</span>
                </div>
                <div className="border-t border-outline-variant/60 pt-3 mt-4 flex justify-between font-bold text-primary text-body-lg">
                  <span>{t("listingDetail.totalMonthly")}</span>
                  <span>€{Number(listing.pricePerMonth).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-4 rounded-[24px] border border-secondary/20 bg-secondary-container/20 p-5">
              <span className="material-symbols-outlined text-secondary">verified</span>
              <div>
                <p className="font-bold text-primary text-sm">{t("listingDetail.protectedByCaveShield")}</p>
                <p className="text-xs text-on-surface-variant">
                  {t("listingDetail.protectionDescription")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
