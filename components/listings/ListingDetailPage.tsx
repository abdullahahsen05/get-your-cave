"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ListingDetail = {
  id: string;
  title: string;
  description: string;
  storageType: string;
  city: string;
  address: string;
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
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[#EBEBE8] bg-surface-container animate-pulse" />
  ),
});

function formatStorageType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ListingDetailPage({ listingId }: Props) {
  const router = useRouter();
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
          throw new Error(data.error ?? "Unable to load listing.");
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
  }, [activeListingId]);

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
      <main className="bg-background text-on-surface font-body-md selection:bg-secondary-container min-h-screen pt-28 sm:pt-32 pb-xxl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-10 w-96 rounded-full bg-surface-container animate-pulse" />
          <div className="h-[420px] rounded-2xl bg-surface-container animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-xl">
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
          <div className="rounded-2xl border border-outline-variant/30 bg-white p-8">
            <h1 className="font-h1 text-h1 text-primary">Listing not found</h1>
            <p className="text-body-md text-on-surface-variant mt-2">
              The listing you requested is unavailable.
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

  const canBook = sessionUser?.role === "RENTER";
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
        setBookingError(data.error ?? "Unable to create booking right now.");
        return;
      }

      setBookingMessage(
        `Booking request ${data.booking.bookingNumber} submitted as ${data.booking.status ?? "PENDING"}.`,
      );
      setBookingStartDate("");
      setBookingDuration("1");
      setBookingNote("");
      router.refresh();
    } catch {
      setBookingError("Unable to create booking right now.");
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
        setConversationError(data.error ?? "Unable to start a conversation right now.");
        return;
      }

      router.push(`/messaging?conversation=${data.conversation.id}`);
    } catch {
      setConversationError("Unable to start a conversation right now.");
    } finally {
      setIsStartingConversation(false);
    }
  }

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-secondary-container min-h-screen">
      <main className="pt-28 sm:pt-32 pb-xxl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
          <div>
            <h1 className="font-h1 text-h1 text-primary mb-2">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="font-bold text-on-surface">
                  {listing.ratingAverage.toFixed(2)}
                </span>
                <span>({listing.ratingCount} reviews)</span>
              </div>
              <span className="text-surface-dim">•</span>
              <span className="underline font-medium cursor-pointer">
                {listing.city}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 font-label-caps text-label-caps hover:bg-surface-container transition-colors p-2 rounded-lg" type="button">
              <span className="material-symbols-outlined text-md">ios_share</span>
              SHARE
            </button>
            <button className="flex items-center gap-2 font-label-caps text-label-caps hover:bg-surface-container transition-colors p-2 rounded-lg" type="button">
              <span className="material-symbols-outlined text-md">favorite</span>
              SAVE
            </button>
          </div>
        </div>

        <div className="hero-grid mb-xl rounded-lg overflow-hidden">
          <div className="relative overflow-hidden group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={primaryImage}
              alt={listing.title}
            />
          </div>
          {secondaryImages.map((image) => (
            <div className="relative overflow-hidden group" key={image}>
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-h3 text-h3 text-primary">Location map</h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {listing.city}, {listing.address}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-xl">
          <div className="space-y-xl">
            <section className="border-b border-stone-200 pb-lg">
              <div className="flex justify-between items-start gap-6">
                <div>
            <h2 className="font-h2 text-h2 text-primary mb-2">
                    {formatStorageType(listing.storageType)} in {listing.city}
                  </h2>
                  <p className="text-body-md text-on-surface-variant italic-emphasis italic opacity-80">
                    {listing.sizeSqFt ?? "—"} sq ft • {listing.address}
                  </p>
                </div>
                <img
                  className="w-14 h-14 rounded-full object-cover border-2 border-secondary-container"
                  alt={listing.owner.fullName}
                  src={
                    listing.owner.avatarUrl ??
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAF7wUT1k9ZCAva5NgXcX8YJPvnMbhq-c6QeGKdpV3RSSiC6HlKMjzVW5v81zLTOTC-cyuM_VcCISM5sRIE88krwbGdHjZK3U1kcvpadgGhSJS0ulfN4p9sBUcPBQKZCyg9s_AVwMcoEtW07Q5fRCTpZ5MtgQC5tkYYCyJYBdAyNqpdWSENoMMXRZVaL38imcD1OTqh1q-8ylvF24Lk1NFIYfAh9vILuo2LpzpB7njG6ZSX_CfgKO5vL5mGcpFupaPmDj8fKXcNDBA"
                  }
                />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-lg py-sm">
              {(listing.amenityNames.slice(0, 3).length
                ? listing.amenityNames.slice(0, 3)
                : ["Secure Access", "Climate Control", "24/7 Access"]
              ).map((amenity) => (
                <div className="flex gap-4" key={amenity}>
                  <span className="material-symbols-outlined text-primary text-3xl">
                    verified_user
                  </span>
                  <div>
                    <h4 className="font-bold text-body-md">{amenity}</h4>
                    <p className="text-body-sm text-on-surface-variant">
                      Trusted feature available in this listing.
                    </p>
                  </div>
                </div>
              ))}
            </section>

            <section className="border-t border-stone-200 pt-xl">
              <h3 className="font-h3 text-h3 text-primary mb-md">About this space</h3>
              <div className="space-y-md text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
                <p>{listing.description}</p>
                <button className="font-bold text-primary underline underline-offset-4 flex items-center gap-1 mt-4" type="button">
                  Show more
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </section>

            <section className="bg-surface-container-low rounded-lg p-6 sm:p-xl flex flex-col md:flex-row items-center gap-xl border border-stone-100">
              <img
                className="w-24 h-24 rounded-full object-cover"
                alt={listing.owner.fullName}
                src={
                  listing.owner.avatarUrl ??
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8rmQ1WK92woRLRREM3LZAAZdKtGfGochBPq3oSmjMWGyUOfMqZWcn58WIidw9stv6tSr-bCGYYBv9tryVz0rC6sxbOGCBydbuJ1FevN2H9E5mip1CcVVNEoBLXagzcZYukfKXBAxLMEeR3_JYx6yqhkgA0dT_yYwVQblH9_xLZllUU9fR9deruLhtBStZghNRf4mIGSBbhuGAQOkZQ7pznwbL5ISJq7mNL5yiuljve5L1ivfVxgJq2nvFVIv16Ifce_9xL_6HNCM"
                }
              />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-h2 text-h2 text-primary">
                  Meet your host, {listing.owner.fullName}
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-md">
                  {listing.owner.bio ?? listing.owner.city ?? "Verified owner on GetYourCave"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-lg">
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    {listing.ratingCount} Reviews
                  </span>
                  <span className="flex items-center gap-1 text-body-sm font-semibold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    Identity verified
                  </span>
                </div>
                {sessionLoading ? (
                  <button
                    className="bg-primary text-white px-xl py-3 rounded-full font-bold transition-all opacity-70"
                    type="button"
                    disabled
                  >
                    Loading...
                  </button>
                ) : sessionUser ? (
                  canStartConversation ? (
                    <button
                      className="bg-primary text-white px-xl py-3 rounded-full font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                      type="button"
                      disabled={isStartingConversation}
                      onClick={() => {
                        void handleContactOwner();
                      }}
                    >
                      {isStartingConversation ? "Starting chat..." : "Contact Owner"}
                    </button>
                  ) : (
                    <button
                      className="bg-primary text-white px-xl py-3 rounded-full font-bold transition-all opacity-70 cursor-not-allowed"
                      type="button"
                      disabled
                    >
                      Contact Owner
                    </button>
                  )
                ) : (
                  <button
                    className="bg-primary text-white px-xl py-3 rounded-full font-bold transition-all hover:opacity-90 active:scale-95"
                    type="button"
                    onClick={() => router.push(loginHref)}
                  >
                    Log in to Contact Owner
                  </button>
                )}
                {conversationError ? (
                  <p className="text-sm text-error">{conversationError}</p>
                ) : null}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-32 bg-white rounded-lg p-lg border border-stone-200 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
              <div className="flex justify-between items-baseline mb-lg">
                <span className="font-h2 text-h2 text-primary">
                  ${listing.pricePerMonth}
                  <span className="text-body-md font-normal text-on-surface-variant">/ month</span>
                </span>
                <span className="text-body-sm font-semibold underline">Details</span>
              </div>
              <div className="border border-stone-200 rounded-lg overflow-hidden mb-lg">
                <div className="grid grid-cols-2 border-b border-stone-200">
                  <div className="p-3 border-r border-stone-200 cursor-pointer hover:bg-surface-container-low transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">MOVE-IN</p>
                    <p className="text-sm font-medium">Anytime</p>
                  </div>
                  <div className="p-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                    <p className="font-label-caps text-[10px] text-on-surface-variant">DURATION</p>
                    <p className="text-sm font-medium">Monthly</p>
                  </div>
                </div>
                <div className="p-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                  <p className="font-label-caps text-[10px] text-on-surface-variant">UNIT SIZE</p>
                  <p className="text-sm font-medium">{listing.sizeSqFt ?? "—"} sq ft</p>
                </div>
              </div>

              {sessionLoading ? (
                <button
                  className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg mb-lg scale-100 opacity-70 transition-all"
                  type="button"
                  disabled
                >
                  Loading...
                </button>
              ) : canBook ? (
                <div className="space-y-4 mb-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                        Move-in Date
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
                        Duration
                      </span>
                      <select
                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:border-primary focus:ring-0"
                        value={bookingDuration}
                        onChange={(event) => setBookingDuration(event.target.value)}
                      >
                        <option value="1">1 month</option>
                        <option value="2">2 months</option>
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                        Note
                      </span>
                      <textarea
                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:border-primary focus:ring-0 resize-none"
                        rows={3}
                        placeholder="Add a short message for the owner"
                        value={bookingNote}
                        onChange={(event) => setBookingNote(event.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg scale-100 hover:opacity-95 active:scale-95 transition-all disabled:opacity-70"
                    type="button"
                    disabled={isBooking || !bookingStartDate}
                    onClick={() => {
                      void handleBookingSubmit();
                    }}
                  >
                    {isBooking ? "Requesting..." : "Book Now"}
                  </button>
                </div>
              ) : sessionUser ? (
                <div className="mb-lg">
                  <button
                    className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg scale-100 opacity-70 transition-all cursor-not-allowed"
                    type="button"
                    disabled
                  >
                    Renters Only
                  </button>
                </div>
              ) : (
                <div className="mb-lg space-y-3">
                  <button
                    className="w-full bg-primary text-white py-4 rounded-full font-bold text-body-lg scale-100 hover:opacity-95 active:scale-95 transition-all"
                    type="button"
                    onClick={() => router.push(loginHref)}
                  >
                    Log in to Book
                  </button>
                  <button
                    className="w-full border border-outline-variant text-primary py-3 rounded-full font-bold text-body-md hover:bg-surface-container transition-all"
                    type="button"
                    onClick={() => router.push(signupHref)}
                  >
                    Sign up to Book
                  </button>
                </div>
              )}

              <p className="text-center text-body-sm text-on-surface-variant italic-emphasis mb-lg">
                You won&apos;t be charged yet
              </p>
              {bookingMessage ? (
                <div className="mb-4 rounded-lg border border-secondary/30 bg-secondary-container/20 px-4 py-3 text-sm text-primary">
                  {bookingMessage}
                </div>
              ) : null}
              {bookingError ? (
                <div className="mb-4 rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
                  {bookingError}
                </div>
              ) : null}
              <div className="space-y-3">
                <div className="flex justify-between text-body-md">
                  <span className="underline">Monthly rate x 1</span>
                  <span>${listing.pricePerMonth}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">Platform commission</span>
                  <span>
                    ${(
                      Number(listing.pricePerMonth) * 0.12
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">Security deposit</span>
                  <span>${listing.securityDeposit}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="underline">Cave insurance</span>
                  <span>${listing.insuranceFee}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 mt-4 flex justify-between font-bold text-primary text-body-lg">
                  <span>Total (monthly)</span>
                  <span>
                    ${(
                      Number(listing.pricePerMonth) +
                      Number(listing.insuranceFee)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-lg p-lg bg-secondary-container/20 rounded-lg border border-secondary-container/30 flex gap-4 items-start">
              <span className="material-symbols-outlined text-secondary">verified</span>
              <div>
                <p className="font-bold text-primary text-sm">Protected by CaveShield</p>
                <p className="text-xs text-on-surface-variant">
                  Every rental is covered by our $100k asset protection guarantee.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
