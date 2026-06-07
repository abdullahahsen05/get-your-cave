"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { listingPublishSchema } from "@/lib/validations/listing";
import { StorageType } from "@prisma/client";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { getDashboardPath } from "@/lib/auth-routing";

const steps = [
  { labelKey: "createListing.steps.basicDetails", icon: "info" },
  { labelKey: "createListing.steps.photos", icon: "image" },
  { labelKey: "createListing.steps.pricing", icon: "payments" },
  { labelKey: "createListing.steps.location", icon: "location_on" },
  { labelKey: "createListing.steps.amenities", icon: "verified_user" },
];

const storageTypes = [
  { value: StorageType.BASEMENT, labelKey: "createListing.storageTypes.cellarCave", icon: "home_storage" },
  { value: StorageType.LOCKER, labelKey: "createListing.storageTypes.box", icon: "inventory_2" },
  { value: StorageType.LOFT, labelKey: "createListing.storageTypes.closet", icon: "door_sliding" },
  { value: StorageType.WAREHOUSE, labelKey: "createListing.storageTypes.storageRoom", icon: "warehouse" },
  { value: StorageType.OTHER, labelKey: "createListing.storageTypes.otherStorageSpaces", icon: "more_horiz" },
] as const;

const amenityOptions = [
  { value: "Security Camera", icon: "videocam", labelKey: "createListing.amenities.securityCamera" },
  { value: "Alarm System", icon: "notifications_active", labelKey: "createListing.amenities.alarmSystem" },
  { value: "24/7 Access", icon: "schedule", labelKey: "createListing.amenities.access247" },
  { value: "Elevator", icon: "elevator", labelKey: "createListing.amenities.elevator" },
  { value: "Ventilation", icon: "air", labelKey: "createListing.amenities.ventilation" },
  { value: "Humidity Control", icon: "water_drop", labelKey: "createListing.amenities.humidityControl" },
  { value: "Private Entry", icon: "key", labelKey: "createListing.amenities.privateEntry" },
  { value: "Gated", icon: "fence", labelKey: "createListing.amenities.gated" },
  { value: "Loading Dock", icon: "local_shipping", labelKey: "createListing.amenities.loadingDock" },
] as const;

const LocationPickerMap = dynamic(
  () => import("@/components/maps/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[320px] sm:min-h-[380px] xl:min-h-[520px] rounded-[28px] animate-pulse border border-outline-variant/60 bg-surface-container" />
    ),
  },
);

const samplePreviewImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIt43UPBLz2tRqo29v3dPp2m-WCMHLfSSPMGPV35p09S3hXFFsHiVUOsgwTd6f7q7a5W6ZiTVPyRuWN9eFDt_hcifHnoYTkdbYQGLGsCElvtU4BwwVceeme3_Ncmy8PibvBevgM7ZToBItC4kMUKeRQIvGzb07E8gd_H3a6Wp6TqbcBAWMmcvn6JVJTVR03G2vFyeudFQIRMDnxV4W96hyIOvSWR8dcjsMnQYFGmkcBUNq824x3fAkyZjpht9tR-_RPVuw6DQpFc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIt43UPBLz2tRqo29v3dPp2m-WCMHLfSSPMGPV35p09S3hXFFsHiVUOsgwTd6f7q7a5W6ZiTVPyRuWN9eFDt_hcifHnoYTkdbYQGLGsCElvtU4BwwVceeme3_Ncmy8PibvBevgM7ZToBItC4kMUKeRQIvGzb07E8gd_H3a6Wp6TqbcBAWMmcvn6JVJTVR03G2vFyeudFQIRMDnxV4W96hyIOvSWR8dcjsMnQYFGmkcBUNq824x3fAkyZjpht9tR-_RPVuw6DQpFc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIt43UPBLz2tRqo29v3dPp2m-WCMHLfSSPMGPV35p09S3hXFFsHiVUOsgwTd6f7q7a5W6ZiTVPyRuWN9eFDt_hcifHnoYTkdbYQGLGsCElvtU4BwwVceeme3_Ncmy8PibvBevgM7ZToBItC4kMUKeRQIvGzb07E8gd_H3a6Wp6TqbcBAWMmcvn6JVJTVR03G2vFyeudFQIRMDnxV4W96hyIOvSWR8dcjsMnQYFGmkcBUNq824x3fAkyZjpht9tR-_RPVuw6DQpFc",
];

type FormState = {
  title: string;
  description: string;
  storageType: StorageType | "";
  pricePerMonth: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  sizeM2: string;
  amenityNames: string[];
  imageUrls: string[];
  primaryImageIndex: number;
};

type GeocodeResponse = {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  city: string | null;
};

function isGeocodeResponse(value: unknown): value is GeocodeResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GeocodeResponse>;

  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.address === "string" &&
    (typeof candidate.city === "string" || candidate.city === null)
  );
}

const initialState: FormState = {
  title: "",
  description: "",
  storageType: "",
  pricePerMonth: "",
  address: "",
  city: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  sizeM2: "",
  amenityNames: [],
  imageUrls: [],
  primaryImageIndex: 0,
};

function toDataUrl(file: File, readErrorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(readErrorMessage));
    };
    reader.onerror = () => reject(new Error(readErrorMessage));
    reader.readAsDataURL(file);
  });
}

function reorderImages(imageUrls: string[], primaryImageIndex: number) {
  if (!imageUrls.length) {
    return [];
  }

  const clampedIndex = Math.max(0, Math.min(primaryImageIndex, imageUrls.length - 1));
  const primary = imageUrls[clampedIndex];
  return [primary, ...imageUrls.filter((_, index) => index !== clampedIndex)];
}

function parseCoordinateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function validateCoordinatePair(
  latitude: string,
  longitude: string,
  translate: (key: string) => string,
) {
  const hasLatitude = latitude.trim().length > 0;
  const hasLongitude = longitude.trim().length > 0;

  if (hasLatitude !== hasLongitude) {
    return translate("createListing.errors.bothCoordinates");
  }

  if (!hasLatitude) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
    return translate("createListing.errors.latitudeRange");
  }

  if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    return translate("createListing.errors.longitudeRange");
  }

  return null;
}

function formatGeocodeQuery(formState: {
  address: string;
  city: string;
  postalCode: string;
}) {
  return [formState.address, formState.city, formState.postalCode]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

function parseListingToState(listing: {
  title: string;
  description: string;
  storageType: StorageType;
  pricePerMonth: string;
  address: string;
  city: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  sizeM2: number | null;
  sizeSqFt: number | null;
  amenityNames: string[];
  images: Array<{ url: string; isPrimary: boolean }>;
}): FormState {
  const primaryIndex = Math.max(
    0,
    listing.images.findIndex((image) => image.isPrimary),
  );

  return {
    title: listing.title,
    description: listing.description,
    storageType: listing.storageType,
    pricePerMonth: listing.pricePerMonth,
    address: listing.address,
    city: listing.city,
    postalCode: listing.postalCode ?? "",
    latitude: listing.latitude !== null ? String(listing.latitude) : "",
    longitude: listing.longitude !== null ? String(listing.longitude) : "",
    sizeM2:
      listing.sizeM2 !== null
        ? formatAreaInput(listing.sizeM2)
        : listing.sizeSqFt !== null
          ? formatAreaInput(squareFeetToSquareMeters(listing.sizeSqFt))
          : "",
    amenityNames: listing.amenityNames,
    imageUrls: listing.images.map((image) => image.url),
    primaryImageIndex: primaryIndex,
  };
}

function formatMoney(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(parsed);
}

const SQUARE_FEET_TO_SQUARE_METERS = 0.09290304;

function squareFeetToSquareMeters(value: number) {
  return value * SQUARE_FEET_TO_SQUARE_METERS;
}

function formatAreaInput(value: number) {
  return Number(value.toFixed(2)).toString();
}

function formatAreaDisplay(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(parsed)} m²`;
}

function getStorageTypeLabel(storageType: FormState["storageType"], t: (key: string) => string) {
  const match = storageTypes.find((item) => item.value === storageType);
  return match ? t(match.labelKey) : t("createListing.storageTypes.otherStorageSpaces");
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-background/60 px-4 py-3">
      <span className="font-label-caps text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-primary break-words">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-h2 text-h2 text-primary">
        {title}
      </h2>
      <p className="max-w-2xl text-on-surface-variant font-body-md text-body-md">
        {description}
      </p>
    </div>
  );
}

function ListingPageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, isLoading: sessionLoading } = useNotifications();

  // Derive access state directly from the provider — no extra API call needed.
  // NotificationsProvider is already seeded with the server-rendered user from the layout,
  // so on first render this is instant and correct.
  const sessionStatus: "loading" | "unauthenticated" | "wrong-role" | "allowed" =
    sessionLoading && !user
      ? "loading"
      : !user
        ? "unauthenticated"
        : user.role !== "OWNER"
          ? "wrong-role"
          : "allowed";

  // Redirect unauthenticated users or wrong-role users (client-side, no server redirect available).
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      window.location.assign("/login");
    } else if (sessionStatus === "wrong-role" && user) {
      window.location.assign(getDashboardPath(user.role as "ADMIN" | "OWNER" | "RENTER"));
    }
  }, [sessionStatus, user]);

  const searchParams = useSearchParams();
  const listingIdFromUrl = searchParams.get("listingId");
  const [listingId, setListingId] = useState<string | null>(listingIdFromUrl);
  const [formState, setFormState] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [isLoadingExisting, setIsLoadingExisting] = useState(Boolean(listingIdFromUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const displayImages = formState.imageUrls.length ? formState.imageUrls : samplePreviewImages;
  const usingUploadedImages = formState.imageUrls.length > 0;
  const currentStep = steps[step];
  const pricePreview = formatMoney(formState.pricePerMonth);

  useEffect(() => {
    if (!listingIdFromUrl) {
      return;
    }

    let cancelled = false;

    async function loadListing() {
      setIsLoadingExisting(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/listings/${listingIdFromUrl}`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          listing?: {
            title: string;
            description: string;
            storageType: StorageType;
            pricePerMonth: string;
            address: string;
            city: string;
            postalCode: string | null;
            latitude: number | null;
            longitude: number | null;
            sizeM2: number | null;
            sizeSqFt: number | null;
            amenityNames: string[];
            images: Array<{ url: string; isPrimary: boolean }>;
          };
        };

        if (!cancelled && data.listing) {
          setListingId(listingIdFromUrl);
          setFormState(parseListingToState(data.listing));
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(t("createListing.errors.loadDraft"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExisting(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [listingIdFromUrl, t]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setErrorMessage(null);
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setLocationCoordinates(
    latitude: number,
    longitude: number,
    message?: string,
  ) {
    setLocationErrorMessage(null);
    setLocationStatusMessage(message ?? null);
    setFormState((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  }

  function applyGeocodeResponse(response: GeocodeResponse) {
    setLocationErrorMessage(null);
    setLocationStatusMessage(t("createListing.location.foundLocation", { name: response.displayName }));
    setFormState((current) => ({
      ...current,
      address: current.address.trim() ? current.address : response.address,
      city: current.city.trim() ? current.city : response.city ?? current.city,
      latitude: response.latitude.toFixed(6),
      longitude: response.longitude.toFixed(6),
    }));
  }

  async function geocodeLocation() {
    const query = formatGeocodeQuery(formState);

    if (!query) {
      setLocationErrorMessage(t("createListing.location.enterQuery"));
      setLocationStatusMessage(null);
      return;
    }

    setIsFindingLocation(true);
    setLocationErrorMessage(null);
    setLocationStatusMessage(t("createListing.location.searching"));

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !isGeocodeResponse(data)) {
        throw new Error(
          data && typeof data === "object" && "error" in data
            ? String(data.error ?? t("createListing.location.noResults"))
            : t("createListing.location.noResults"),
        );
      }

      applyGeocodeResponse(data);
    } catch (error) {
      setLocationErrorMessage(
        error instanceof Error ? error.message : t("createListing.location.noResults"),
      );
      setLocationStatusMessage(null);
    } finally {
      setIsFindingLocation(false);
    }
  }

  async function handleUseCurrentLocation() {
    setLocationErrorMessage(null);
    setLocationStatusMessage(null);

    if (!isGeolocationSupported()) {
      setLocationErrorMessage(t("createListing.location.geoUnsupported"));
      return;
    }

    setIsUsingCurrentLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 10_000,
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setLocationCoordinates(latitude, longitude, t("createListing.location.currentCaptured"));

      try {
        const reverseResponse = await fetch(
          `/api/geocode?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
          {
            headers: { Accept: "application/json" },
          },
        );

        const reverseData = await reverseResponse.json().catch(() => null);

        if (reverseResponse.ok && isGeocodeResponse(reverseData)) {
          setFormState((current) => ({
            ...current,
            address: current.address.trim() ? current.address : reverseData.address,
            city: current.city.trim() ? current.city : reverseData.city ?? current.city,
          }));
          setLocationStatusMessage(
            t("createListing.location.currentCapturedNear", { name: reverseData.displayName }),
          );
        }
      } catch {
        setLocationStatusMessage(t("createListing.location.currentCaptured"));
      }
    } catch (error) {
      const geolocationError = error as { code?: number; message?: string } | null;
      const isPermissionDenied = geolocationError?.code === 1;
      const message = isPermissionDenied
        ? t("createListing.location.permissionDenied")
        : error instanceof Error
          ? error.message
          : t("createListing.location.locationUnavailable");

      setLocationErrorMessage(message);
      setLocationStatusMessage(null);
    } finally {
      setIsUsingCurrentLocation(false);
    }
  }

  function toggleAmenity(value: string) {
    setErrorMessage(null);
    setFormState((current) => {
      const hasAmenity = current.amenityNames.includes(value);
      return {
        ...current,
        amenityNames: hasAmenity
          ? current.amenityNames.filter((item) => item !== value)
          : [...current.amenityNames, value],
      };
    });
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const urls = await Promise.all(
      files.map((file) => toDataUrl(file, t("createListing.errors.unableToReadFile"))),
    );

    setErrorMessage(null);
    setFormState((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, ...urls],
      primaryImageIndex: current.imageUrls.length ? current.primaryImageIndex : 0,
    }));
  }

  function validateCurrentStep(currentStep: number) {
    if (currentStep === 0) {
      if (!formState.title.trim()) {
        return t("createListing.errors.title");
      }

      if (formState.description.trim().length < 20) {
        return t("createListing.errors.description");
      }

      if (!formState.storageType) {
        return t("createListing.errors.storageType");
      }
    }

    if (currentStep === 2) {
      const price = Number(formState.pricePerMonth);
      if (!Number.isFinite(price) || price <= 0) {
        return t("createListing.errors.price");
      }
    }

    if (currentStep === 3) {
      if (!formState.address.trim()) {
        return t("createListing.errors.address");
      }

      if (!formState.city.trim()) {
        return t("createListing.errors.city");
      }

      const coordinateError = validateCoordinatePair(formState.latitude, formState.longitude, t);
      if (coordinateError) {
        return coordinateError;
      }
    }

    return null;
  }

  function buildPayload(status: "DRAFT" | "PENDING_APPROVAL") {
    return {
      title: formState.title,
      description: formState.description,
      storageType: formState.storageType || undefined,
      pricePerMonth: formState.pricePerMonth ? Number(formState.pricePerMonth) : undefined,
      address: formState.address,
      city: formState.city,
      postalCode: formState.postalCode,
      latitude: parseCoordinateInput(formState.latitude),
      longitude: parseCoordinateInput(formState.longitude),
      sizeM2: formState.sizeM2 ? Number(formState.sizeM2) : undefined,
      amenityNames: formState.amenityNames,
      imageUrls: reorderImages(formState.imageUrls, formState.primaryImageIndex),
      status,
    };
  }

  async function persistListing(status: "DRAFT" | "PENDING_APPROVAL", advanceAfter = false) {
    const stepError = validateCurrentStep(step);
    if (stepError) {
      setErrorMessage(stepError);
      return;
    }

    if (status === "PENDING_APPROVAL") {
      const publishParsed = listingPublishSchema.safeParse(buildPayload(status));
      if (!publishParsed.success) {
        setErrorMessage(publishParsed.error.issues[0]?.message ?? t("createListing.errors.checkFields"));
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const method = listingId ? "PATCH" : "POST";
      const endpoint = listingId ? `/api/listings/${listingId}` : "/api/listings";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildPayload(status)),
      });

      const data = (await response.json()) as {
        listing?: { id?: string };
        error?: string;
      };

      if (!response.ok || !data.listing?.id) {
        setErrorMessage(data.error ?? t("createListing.errors.save"));
        return;
      }

      if (data.listing.id !== listingId) {
        setListingId(data.listing.id);
        router.replace(`/create-listing?listingId=${data.listing.id}`);
      }

      if (advanceAfter) {
        setStep((current) => Math.min(current + 1, steps.length - 1));
      }

      if (status === "PENDING_APPROVAL") {
        router.replace("/owner/dashboard");
        router.refresh();
      }
    } catch {
      setErrorMessage(t("createListing.errors.save"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLastStep) {
      await persistListing("PENDING_APPROVAL");
      return;
    }

    await persistListing("DRAFT", true);
  }

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated" || sessionStatus === "wrong-role") {
    return (
      <main className="min-h-screen bg-background text-on-surface font-body-md text-body-md antialiased pt-24 sm:pt-28 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="h-48 rounded-[32px] bg-surface-container animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md text-body-md antialiased pt-24 sm:pt-28 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/60 bg-surface shadow-[0_16px_54px_rgba(17,24,39,0.06)] backdrop-blur">
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary-container/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
                  <span className="material-symbols-outlined text-[16px]">edit_square</span>
                  {t("createListing.stepProgress", {
                    current: step + 1,
                    total: steps.length,
                    label: t(currentStep.labelKey),
                  })}
                </div>

                <div className="space-y-2">
                  <p className="max-w-3xl text-on-surface-variant font-body-md text-body-md">
                    {t("createListing.percentComplete", { value: Math.round(progress) })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {steps.map((item, index) => {
                  const isActive = index === step;
                  const isComplete = index < step;

                  return (
                    <button
                      className={`group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[22px] border px-3 py-3 text-center transition-all ${
                        isActive
                        ? "border-secondary bg-secondary-container/20 text-secondary shadow-[0_12px_28px_rgba(242,106,27,0.12)]"
                          : isComplete
                            ? "border-secondary/35 bg-secondary-container/25 text-secondary hover:border-secondary/55"
                            : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-secondary/30 hover:bg-surface-container-low"
                      } disabled:cursor-default disabled:opacity-80`}
                      disabled={index > step || isSubmitting}
                      key={item.labelKey}
                      onClick={() => setStep(index)}
                      type="button"
                    >
                      <span
                        className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-105 ${
                          isActive || isComplete ? "text-current" : "text-on-surface-variant/60"
                        }`}
                      >
                        {isComplete ? "check_circle" : item.icon}
                      </span>
                      <span
                        className={`font-label-caps text-[10px] uppercase tracking-[0.18em] leading-tight ${
                          isActive || isComplete ? "text-current" : "text-on-surface-variant/70"
                        }`}
                      >
                        {t(item.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label-caps text-[11px] uppercase tracking-[0.24em] text-secondary">
                    {t("createListing.overview.eyebrow")}
                  </p>
                  <h3 className="mt-2 font-h3 text-h3 text-primary">
                    {formState.title.trim() || t("createListing.overview.untitledListing")}
                  </h3>
                </div>
                <div className="rounded-full bg-secondary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                  {step + 1}/{steps.length}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <StatRow
                  label={t("createListing.basicDetails.storageTypeLabel")}
                  value={getStorageTypeLabel(formState.storageType, t)}
                />
                <StatRow
                  label={t("createListing.pricing.title")}
                  value={pricePreview}
                />
                <StatRow
                  label={t("createListing.location.title")}
                  value={formState.city.trim() || formState.address.trim() || t("createListing.overview.locationPending")}
                />
                <StatRow
                  label={t("createListing.overview.photosLabel")}
                  value={t("createListing.overview.countValue", { value: formState.imageUrls.length || 0 })}
                />
                <StatRow
                  label={t("createListing.overview.amenitiesLabel")}
                  value={t("createListing.overview.countValue", { value: formState.amenityNames.length || 0 })}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10">
            <div className="h-1 overflow-hidden rounded-full bg-outline-variant/20">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[32px] border border-outline-variant/60 bg-surface p-5 shadow-[0_10px_40px_rgba(17,24,39,0.05)] sm:p-8 lg:p-10">
            {isLoadingExisting ? (
              <div className="space-y-5">
                <div className="h-8 w-56 rounded-full bg-surface-container animate-pulse" />
                <div className="h-4 w-80 max-w-full rounded-full bg-surface-container animate-pulse" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-44 rounded-[28px] bg-surface-container animate-pulse" />
                  <div className="h-44 rounded-[28px] bg-surface-container animate-pulse" />
                </div>
                <div className="h-56 rounded-[28px] bg-surface-container animate-pulse" />
              </div>
            ) : (
              <>
                {step === 0 && (
                  <BasicDetailsStep
                    formState={formState}
                    onTitleChange={(value) => updateField("title", value)}
                    onDescriptionChange={(value) => updateField("description", value)}
                    onStorageTypeChange={(value) => updateField("storageType", value)}
                  />
                )}
                {step === 1 && (
                  <VisualDocumentationStep
                    displayImages={displayImages}
                    onFileClick={() => fileInputRef.current?.click()}
                    onFileChange={handleFileSelection}
                    onDeleteImage={(index) =>
                      setFormState((current) => {
                        const nextImages = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
                        return {
                          ...current,
                          imageUrls: nextImages,
                          primaryImageIndex: Math.max(0, Math.min(current.primaryImageIndex, nextImages.length - 1)),
                        };
                      })
                    }
                    onSetPrimary={(index) =>
                      setFormState((current) => ({
                        ...current,
                        primaryImageIndex: index,
                      }))
                    }
                    usingUploadedImages={usingUploadedImages}
                    fileInputRef={fileInputRef}
                  />
                )}
                {step === 2 && (
                  <PricingStep
                    pricePerMonth={formState.pricePerMonth}
                    onPriceChange={(value) => updateField("pricePerMonth", value)}
                  />
                )}
                {step === 3 && (
                  <LocationStep
                    address={formState.address}
                    city={formState.city}
                    postalCode={formState.postalCode}
                    latitude={formState.latitude}
                    longitude={formState.longitude}
                    sizeM2={formState.sizeM2}
                    onAddressChange={(value) => updateField("address", value)}
                    onCityChange={(value) => updateField("city", value)}
                    onLatitudeChange={(value) => updateField("latitude", value)}
                    onLongitudeChange={(value) => updateField("longitude", value)}
                    onPostalCodeChange={(value) => updateField("postalCode", value)}
                    onSizeChange={(value) => updateField("sizeM2", value)}
                    onFindOnMap={() => {
                      void geocodeLocation();
                    }}
                    onUseCurrentLocation={() => {
                      void handleUseCurrentLocation();
                    }}
                    isFindingLocation={isFindingLocation}
                    isUsingCurrentLocation={isUsingCurrentLocation}
                    locationErrorMessage={locationErrorMessage}
                    locationStatusMessage={locationStatusMessage}
                    onToggleManualCoordinates={() => setShowManualCoordinates((current) => !current)}
                    showManualCoordinates={showManualCoordinates}
                  />
                )}
                {step === 4 && (
                  <AmenitiesStep
                    selectedAmenities={formState.amenityNames}
                    onToggleAmenity={toggleAmenity}
                  />
                )}
              </>
            )}

            {errorMessage ? (
            <div className="mt-8 rounded-[22px] border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
                {errorMessage}
              </div>
            ) : null}
          </section>

        <aside className="space-y-6 xl:sticky xl:top-32 self-start">
            <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-5 shadow-[0_10px_40px_rgba(17,24,39,0.05)] sm:p-6">
              <p className="font-label-caps text-[11px] uppercase tracking-[0.24em] text-secondary">
                {t(currentStep.labelKey)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="font-h3 text-h3 text-primary">
                  {t("createListing.stepProgress", {
                    current: step + 1,
                    total: steps.length,
                    label: t(currentStep.labelKey),
                  })}
                </h3>
                <span className="rounded-full bg-secondary-container/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <StatRow
                  label={t("createListing.basicDetails.titleLabel")}
                  value={formState.title.trim() || "—"}
                />
                <StatRow
                  label={t("createListing.basicDetails.descriptionLabel")}
                  value={formState.description.trim() ? `${formState.description.trim().slice(0, 60)}${formState.description.trim().length > 60 ? "…" : ""}` : "—"}
                />
                <StatRow
                  label={t("createListing.location.addressLabel")}
                  value={formState.address.trim() || "—"}
                />
                <StatRow
                  label={t("createListing.location.cityLabel")}
                  value={formState.city.trim() || "—"}
                />
                <StatRow
                  label={t("createListing.location.sizeLabel")}
                  value={formatAreaDisplay(formState.sizeM2)}
                />
                <StatRow
                  label={t("createListing.overview.photosLabel")}
                  value={t("createListing.overview.countValue", { value: formState.imageUrls.length || 0 })}
                />
                <StatRow
                  label={t("createListing.overview.amenitiesLabel")}
                  value={t("createListing.overview.countValue", { value: formState.amenityNames.length || 0 })}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-secondary/15 bg-secondary-container/15 p-5 shadow-[0_10px_40px_rgba(17,24,39,0.05)] sm:p-6">
              <p className="font-label-caps text-[11px] uppercase tracking-[0.24em] text-secondary">
                {t("createListing.location.title")}
              </p>
              <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                <p>{t("createListing.location.description")}</p>
                <p>{formState.latitude && formState.longitude ? `${formState.latitude}, ${formState.longitude}` : t("createListing.location.manualHint")}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="rounded-[28px] border border-outline-variant/60 bg-surface p-4 shadow-[0_8px_30px_rgba(17,24,39,0.05)] sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-low px-5 py-3 font-label-caps text-label-caps uppercase text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isFirstStep || isSubmitting}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t("common.back")}
            </button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-container-low px-6 py-3 font-label-caps text-label-caps uppercase text-primary transition-all hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                disabled={isSubmitting}
                onClick={() => persistListing("DRAFT")}
                type="button"
              >
                {t("common.saveDraft")}
              </button>
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-secondary px-7 py-3 font-label-caps text-label-caps uppercase text-white shadow-lg shadow-secondary/15 transition-all hover:bg-[#d9590f] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                disabled={isSubmitting}
                type="submit"
                form="create-listing-form"
              >
                {isSubmitting
                  ? t("createListing.saving")
                  : isLastStep
                    ? t("common.submitListing")
                    : t("createListing.nextStep")}
              </button>
            </div>
          </div>
        </section>

        <form id="create-listing-form" onSubmit={handleSubmit} className="hidden" />
      </div>
    </main>
  );
}

export default function ListYourCavePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background text-on-surface font-body-md text-body-md antialiased pt-24 sm:pt-28 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
            <section className="rounded-[32px] border border-outline-variant/60 bg-surface p-8 shadow-[0_16px_54px_rgba(17,24,39,0.06)]">
              <div className="h-8 w-56 rounded-full bg-surface-container animate-pulse" />
              <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-surface-container animate-pulse" />
              <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-[520px] rounded-[28px] bg-surface-container animate-pulse" />
                <div className="h-[520px] rounded-[28px] bg-surface-container animate-pulse" />
              </div>
            </section>
          </div>
        </main>
      }
    >
      <ListingPageContent />
    </Suspense>
  );
}

function BasicDetailsStep({
  formState,
  onTitleChange,
  onDescriptionChange,
  onStorageTypeChange,
}: {
  formState: FormState;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStorageTypeChange: (value: StorageType | "") => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow={t("createListing.steps.basicDetails")}
        title={t("createListing.basicDetails.title")}
        description={t("createListing.basicDetails.description")}
      />

      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
            {t("createListing.basicDetails.titleLabel")}
          </label>
          <input
            className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-lg font-h3 transition-all outline-none placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder={t("createListing.basicDetails.titlePlaceholder")}
            type="text"
            value={formState.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
            {t("createListing.basicDetails.descriptionLabel")}
          </label>
          <textarea
            className="min-h-[180px] rounded-2xl border border-outline-variant/60 bg-background px-4 py-4 text-body-md transition-all outline-none placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
            placeholder={t("createListing.basicDetails.descriptionPlaceholder")}
            rows={5}
            value={formState.description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
            {t("createListing.basicDetails.storageTypeLabel")}
          </label>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {storageTypes.map((item) => (
              <StorageTypeOption
                icon={item.icon}
                label={t(item.labelKey)}
                key={item.value}
                checked={formState.storageType === item.value}
                onSelect={() => onStorageTypeChange(item.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorageTypeOption({
  icon,
  label,
  checked,
  onSelect,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="cursor-pointer">
      <input className="peer sr-only" name="type" type="radio" checked={checked} onChange={onSelect} />
          <div className="flex min-h-[122px] flex-col items-center justify-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-3 py-4 text-center transition-all duration-200 peer-checked:border-secondary peer-checked:bg-secondary-container/20 peer-checked:text-secondary hover:border-secondary/50 hover:shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
        <span className="material-symbols-outlined text-[28px]">
          {icon}
        </span>
        <span className="font-label-caps text-[10px] uppercase tracking-[0.18em] leading-tight">
          {label}
        </span>
      </div>
    </label>
  );
}

function VisualDocumentationStep({
  displayImages,
  onFileClick,
  onFileChange,
  onDeleteImage,
  onSetPrimary,
  usingUploadedImages,
  fileInputRef,
}: {
  displayImages: string[];
  onFileClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteImage: (index: number) => void;
  onSetPrimary: (index: number) => void;
  usingUploadedImages: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow={t("createListing.steps.photos")}
        title={t("createListing.visual.title")}
        description={t("createListing.visual.description")}
      />

      <input
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        type="file"
        onChange={(event) => {
          void onFileChange(event);
        }}
      />

      <button
        className="group relative overflow-hidden rounded-[28px] border border-dashed border-outline-variant/70 bg-gradient-to-br from-surface-container-low via-background to-surface-container-low p-5 text-left transition-all hover:border-secondary/40 hover:shadow-[0_12px_28px_rgba(17,24,39,0.05)] sm:p-6"
        type="button"
        onClick={onFileClick}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center sm:py-10">
            <span className="material-symbols-outlined text-[44px] text-secondary/40 transition-colors group-hover:text-secondary">
            cloud_upload
          </span>
          <div className="space-y-2">
            <p className="font-h3 text-h3 text-primary">
              {t("createListing.visual.uploadTitle")}
            </p>
            <p className="max-w-lg text-body-sm text-on-surface-variant">
              {t("createListing.visual.uploadHint")}
            </p>
          </div>
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-secondary px-6 py-3 font-label-caps text-label-caps uppercase text-secondary transition-all group-hover:bg-secondary group-hover:text-white">
            {t("createListing.visual.browseFiles")}
          </span>
        </div>
      </button>

      <div className="flex items-start gap-3 rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-[#8f3d12]">
        <span className="material-symbols-outlined text-[20px]">error</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{t("createListing.visual.minImages")}</p>
          <p className="text-xs text-[#8f3d12]/80">
            {usingUploadedImages
              ? t("createListing.visual.previewAlt")
              : t("createListing.visual.uploadHint")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {displayImages.slice(0, 3).map((src, index) => (
          <ImagePreview
            key={`${src}-${index}`}
            src={src}
            primary={usingUploadedImages && index === 0}
            onDelete={() => onDeleteImage(index)}
            onSetPrimary={() => onSetPrimary(index)}
            disableActions={!usingUploadedImages && index < 3}
          />
        ))}
        <button
          className="group flex aspect-[4/3] items-center justify-center rounded-[24px] border-2 border-dashed border-outline-variant/60 bg-surface-container-low/60 transition-colors hover:border-secondary/50 hover:bg-surface-container-low"
          type="button"
          onClick={onFileClick}
        >
          <span className="material-symbols-outlined text-[30px] text-outline-variant transition-colors group-hover:text-primary">
            add
          </span>
        </button>
      </div>
    </section>
  );
}

function ImagePreview({
  src,
  primary = false,
  onDelete,
  onSetPrimary,
  disableActions,
}: {
  src: string;
  primary?: boolean;
  onDelete: () => void;
  onSetPrimary: () => void;
  disableActions?: boolean;
}) {
  const { t } = useTranslation();
  return (
      <div className="group relative aspect-[4/3] overflow-hidden rounded-[24px] border border-outline-variant/50 bg-surface-container-low shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
      <img alt={t("createListing.visual.previewAlt")} className="h-full w-full object-cover" src={src} />

      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
        <div className="flex h-full flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex rounded-full bg-black/25 p-2 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
            </span>
            <button
              className="inline-flex rounded-full bg-black/25 p-2 text-white transition-colors hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              aria-label={t("createListing.visual.minImages")}
              disabled={disableActions}
              onClick={onDelete}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>

          <button
            className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-[10px] font-label-caps uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              primary
                ? "bg-secondary/80"
                : "border border-white/20 bg-white/8 hover:bg-white/12"
            }`}
            type="button"
            disabled={disableActions}
            onClick={onSetPrimary}
          >
            <span className="material-symbols-outlined text-[14px]">star</span>
            {primary ? t("createListing.visual.primary") : t("createListing.visual.setPrimary")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingStep({
  pricePerMonth,
  onPriceChange,
}: {
  pricePerMonth: string;
  onPriceChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow={t("createListing.steps.pricing")}
        title={t("createListing.pricing.title")}
        description={t("createListing.pricing.description")}
      />

      <div className="max-w-xl space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            €
          </span>
          <input
            className="min-h-14 w-full rounded-2xl border border-outline-variant/60 bg-background px-16 py-4 text-display font-display transition-all outline-none placeholder:text-on-surface-variant/45 focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none"
            placeholder={t("createListing.pricing.placeholder")}
            type="number"
            value={pricePerMonth}
            onChange={(event) => onPriceChange(event.target.value)}
          />
        </div>

      <div className="rounded-2xl border border-secondary/15 bg-secondary-container/20 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary">info</span>
            <p className="text-body-sm text-on-secondary-container">
              {t("createListing.pricing.helper")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationStep({
  address,
  city,
  postalCode,
  latitude,
  longitude,
  sizeM2,
  onAddressChange,
  onCityChange,
  onLatitudeChange,
  onLongitudeChange,
  onPostalCodeChange,
  onSizeChange,
  onFindOnMap,
  onUseCurrentLocation,
  isFindingLocation,
  isUsingCurrentLocation,
  locationErrorMessage,
  locationStatusMessage,
  showManualCoordinates,
  onToggleManualCoordinates,
}: {
  address: string;
  city: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  sizeM2: string;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onFindOnMap: () => void;
  onUseCurrentLocation: () => void;
  isFindingLocation: boolean;
  isUsingCurrentLocation: boolean;
  locationErrorMessage: string | null;
  locationStatusMessage: string | null;
  showManualCoordinates: boolean;
  onToggleManualCoordinates: () => void;
}) {
  const { t } = useTranslation();
  const [locationSuggestions, setLocationSuggestions] = useState<GeocodeResponse[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const geocodeQuery = useMemo(
    () => formatGeocodeQuery({ address, city, postalCode }),
    [address, city, postalCode],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      const query = geocodeQuery.trim();
      if (query.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}&suggest=1`,
          {
            headers: { Accept: "application/json" },
          },
        );

        const data = (await response.json().catch(() => null)) as
          | { suggestions?: GeocodeResponse[]; error?: string }
          | null;

        if (!response.ok || !data?.suggestions) {
          throw new Error(data?.error ?? t("createListing.location.noResults"));
        }

        if (!cancelled) {
          setLocationSuggestions(data.suggestions);
        }
      } catch {
        if (!cancelled) {
          setLocationSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
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
  }, [geocodeQuery, t]);

  function applySuggestion(suggestion: GeocodeResponse) {
    onAddressChange(suggestion.address);
    onCityChange(suggestion.city ?? city);
    onLatitudeChange(suggestion.latitude.toFixed(6));
    onLongitudeChange(suggestion.longitude.toFixed(6));
    setLocationSuggestions([]);
  }

  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow={t("createListing.steps.location")}
        title={t("createListing.location.title")}
        description={t("createListing.location.description")}
      />

      <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-4 shadow-[0_8px_30px_rgba(17,24,39,0.04)] sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f] disabled:opacity-60"
            disabled={isFindingLocation || isUsingCurrentLocation}
            type="button"
            onClick={onFindOnMap}
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            {isFindingLocation ? t("createListing.location.finding") : t("createListing.location.findOnMap")}
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-low px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary-container disabled:opacity-60"
            disabled={isFindingLocation || isUsingCurrentLocation}
            type="button"
            onClick={onUseCurrentLocation}
          >
            <span className="material-symbols-outlined text-sm">my_location</span>
            {isUsingCurrentLocation
              ? t("createListing.location.usingLocation")
              : t("createListing.location.useCurrentLocation")}
          </button>
        </div>

        {locationStatusMessage ? (
          <div className="mt-4 rounded-2xl border border-secondary/20 bg-secondary-container/20 px-4 py-3 text-sm text-primary">
            {locationStatusMessage}
          </div>
        ) : null}

        {locationErrorMessage ? (
          <div className="mt-4 rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
            {locationErrorMessage}
          </div>
        ) : null}

        {isLoadingSuggestions ? (
          <p className="mt-3 text-xs text-on-surface-variant">{t("common.loading")}</p>
        ) : null}

        {locationSuggestions.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface shadow-[0_12px_30px_rgba(17,24,39,0.08)]">
            {locationSuggestions.map((suggestion, index) => (
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <div className="grid gap-5 rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                {t("createListing.location.addressLabel")}
              </label>
              <input
                className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={t("createListing.location.addressPlaceholder")}
                type="text"
                value={address}
                onChange={(event) => onAddressChange(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                  {t("createListing.location.cityLabel")}
                </label>
                <input
                  className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder={t("createListing.location.cityPlaceholder")}
                  type="text"
                  value={city}
                  onChange={(event) => onCityChange(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                  {t("createListing.location.zipLabel")}
                </label>
                <input
                  className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder={t("createListing.location.zipPlaceholder")}
                  type="text"
                  value={postalCode}
                  onChange={(event) => onPostalCodeChange(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                {t("createListing.location.sizeLabel")}
              </label>
              <input
                className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={t("createListing.location.sizePlaceholder")}
                type="number"
                value={sizeM2}
                onChange={(event) => onSizeChange(event.target.value)}
              />
            </div>

            <button
              className="inline-flex items-center gap-2 self-start text-sm font-bold text-primary underline underline-offset-4"
              type="button"
              onClick={onToggleManualCoordinates}
            >
              <span className="material-symbols-outlined text-sm">
                {showManualCoordinates ? "expand_less" : "expand_more"}
              </span>
              {showManualCoordinates
                ? t("createListing.location.hideManualCoordinates")
                : t("createListing.location.showManualCoordinates")}
            </button>

            {showManualCoordinates ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                    {t("createListing.location.latitudeLabel")}
                  </label>
                  <input
                    className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder={t("createListing.location.latitudePlaceholder")}
                    step="any"
                    type="number"
                    value={latitude}
                    onChange={(event) => onLatitudeChange(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-caps text-[11px] uppercase tracking-[0.24em] text-primary">
                    {t("createListing.location.longitudeLabel")}
                  </label>
                  <input
                    className="min-h-12 rounded-2xl border border-outline-variant/60 bg-background px-4 py-3 text-body-md outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder={t("createListing.location.longitudePlaceholder")}
                    step="any"
                    type="number"
                    value={longitude}
                    onChange={(event) => onLongitudeChange(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                {t("createListing.location.manualHint")}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_8px_30px_rgba(17,24,39,0.04)]">
          <div className="h-[360px] sm:h-[420px] xl:h-[560px]">
            <LocationPickerMap
              address={address}
              city={city}
              onAddressChange={onAddressChange}
              onCityChange={onCityChange}
              latitude={latitude}
              longitude={longitude}
              onLatitudeChange={onLatitudeChange}
              onLongitudeChange={onLongitudeChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AmenitiesStep({
  selectedAmenities,
  onToggleAmenity,
}: {
  selectedAmenities: string[];
  onToggleAmenity: (label: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow={t("createListing.steps.amenities")}
          title={t("createListing.amenities.title")}
          description={t("createListing.amenities.description")}
        />
        <div className="inline-flex min-h-11 items-center self-start rounded-full border border-secondary/20 bg-secondary-container/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
          {t("createListing.overview.selectedCount", { value: selectedAmenities.length })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {amenityOptions.map((item) => (
          <AmenityOption
            icon={item.icon}
            label={t(item.labelKey)}
            key={item.value}
            checked={selectedAmenities.includes(item.value)}
            onToggle={() => onToggleAmenity(item.value)}
          />
        ))}
      </div>
    </section>
  );
}

function AmenityOption({
  icon,
  label,
  checked,
  onToggle,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="group cursor-pointer">
      <input className="peer sr-only" type="checkbox" checked={checked} onChange={onToggle} />
      <div className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-4 transition-all hover:border-secondary/60 hover:shadow-[0_8px_22px_rgba(17,24,39,0.04)] peer-checked:border-secondary peer-checked:bg-secondary-container/25">
        <span className="material-symbols-outlined text-primary transition-transform group-hover:scale-105">
          {icon}
        </span>
        <p className="flex-1 text-body-sm font-semibold text-primary">
          {label}
        </p>
        <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${checked ? "border-secondary bg-secondary text-white" : "border-outline-variant/60 bg-background text-transparent"}`}>
          <span className="material-symbols-outlined text-[16px]">
            check
          </span>
        </div>
      </div>
    </label>
  );
}
