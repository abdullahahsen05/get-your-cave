"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { listingPublishSchema } from "@/lib/validations/listing";
import { StorageType } from "@prisma/client";

const steps = [
  { labelKey: "createListing.steps.basicDetails", icon: "info" },
  { labelKey: "createListing.steps.photos", icon: "image" },
  { labelKey: "createListing.steps.pricing", icon: "payments" },
  { labelKey: "createListing.steps.location", icon: "location_on" },
  { labelKey: "createListing.steps.amenities", icon: "verified_user" },
];

const storageTypes = [
  { value: StorageType.GARAGE, labelKey: "createListing.storageTypes.garage", icon: "garage" },
  { value: StorageType.BASEMENT, labelKey: "createListing.storageTypes.basement", icon: "house_siding" },
  { value: StorageType.ROOM, labelKey: "createListing.storageTypes.room", icon: "meeting_room" },
  { value: StorageType.WAREHOUSE, labelKey: "createListing.storageTypes.warehouse", icon: "warehouse" },
] as const;

const amenityOptions = [
  { icon: "videocam", label: "createListing.amenities.securityCamera" },
  { icon: "schedule", label: "createListing.amenities.access247" },
  { icon: "ac_unit", label: "createListing.amenities.climateControl" },
  { icon: "key", label: "createListing.amenities.privateEntry" },
  { icon: "fence", label: "createListing.amenities.gated" },
  { icon: "local_shipping", label: "createListing.amenities.loadingDock" },
];

const LocationPickerMap = dynamic(
  () => import("@/components/maps/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] bg-surface-container rounded-lg animate-pulse border border-outline-variant/30" />
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
  sizeSqFt: string;
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
  sizeSqFt: "",
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
    sizeSqFt: listing.sizeSqFt ? String(listing.sizeSqFt) : "",
    amenityNames: listing.amenityNames,
    imageUrls: listing.images.map((image) => image.url),
    primaryImageIndex: primaryIndex,
  };
}

export default function ListYourCavePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [listingIdFromUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("listingId");
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setLocationErrorMessage(
        t("createListing.location.geoUnsupported"),
      );
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

  function toggleAmenity(label: string) {
    setErrorMessage(null);
    setFormState((current) => {
      const hasAmenity = current.amenityNames.includes(label);
      return {
        ...current,
        amenityNames: hasAmenity
          ? current.amenityNames.filter((item) => item !== label)
          : [...current.amenityNames, label],
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
      sizeSqFt: formState.sizeSqFt ? Number(formState.sizeSqFt) : undefined,
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

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md text-body-md antialiased pt-28 sm:pt-32 pb-24 sm:pb-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <div className="flex flex-col gap-4 mb-4 px-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">
                {t("createListing.stepProgress", {
                  current: step + 1,
                  total: steps.length,
                  label: t(steps[step].labelKey),
                })}
              </span>
              <span className="font-label-caps text-label-caps text-secondary">
                {t("createListing.percentComplete", { value: Math.round(progress) })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {steps.map((item, index) => {
                const isActive = index === step;
                const isComplete = index < step;

                return (
                  <button
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-2 py-2 text-center transition-all hover:border-primary disabled:cursor-default min-h-[68px] sm:min-h-0"
                    disabled={index > step || isSubmitting}
                    key={item.labelKey}
                    onClick={() => setStep(index)}
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isActive || isComplete
                          ? "text-primary"
                          : "text-on-surface-variant/50"
                      }`}
                    >
                      {isComplete ? "check_circle" : item.icon}
                    </span>
                    <span
                      className={`hidden sm:inline font-label-caps text-[10px] uppercase ${
                        isActive || isComplete
                          ? "text-primary"
                          : "text-on-surface-variant/50"
                      }`}
                    >
                      {t(item.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 md:p-12 shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/30">
          {isLoadingExisting ? (
            <div className="space-y-4">
              <div className="h-8 w-48 rounded-full bg-surface-container animate-pulse" />
              <div className="h-4 w-72 rounded-full bg-surface-container animate-pulse" />
              <div className="h-48 rounded-2xl bg-surface-container animate-pulse" />
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
                  sizeSqFt={formState.sizeSqFt}
                  onAddressChange={(value) => updateField("address", value)}
                  onCityChange={(value) => updateField("city", value)}
                  onLatitudeChange={(value) => updateField("latitude", value)}
                  onLongitudeChange={(value) => updateField("longitude", value)}
                  onPostalCodeChange={(value) => updateField("postalCode", value)}
                  onSizeChange={(value) => updateField("sizeSqFt", value)}
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
            <div className="mt-8 rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 px-0 sm:px-4">
          <button
            className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors flex items-center gap-2 uppercase disabled:opacity-40 disabled:hover:text-on-surface-variant"
            disabled={isFirstStep || isSubmitting}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t("common.back")}
          </button>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            <button
              className="flex-1 md:flex-none border border-outline text-primary px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-surface-container transition-all uppercase"
              disabled={isSubmitting}
              onClick={() => persistListing("DRAFT")}
              type="button"
            >
              {t("common.saveDraft")}
            </button>
            <button
              className="flex-1 md:flex-none bg-primary text-white px-12 py-3 rounded-full font-label-caps text-label-caps hover:opacity-90 transition-all uppercase shadow-lg shadow-primary/10 disabled:opacity-60"
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
        </section>

        <form id="create-listing-form" onSubmit={handleSubmit} className="hidden" />
      </div>
    </main>
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
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          {t("createListing.basicDetails.title")}
        </h2>
        <p className="text-on-surface-variant font-body-md text-body-md">
          {t("createListing.basicDetails.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            {t("createListing.basicDetails.titleLabel")}
          </label>
          <input
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-lg font-h3 transition-colors outline-none"
            placeholder={t("createListing.basicDetails.titlePlaceholder")}
            type="text"
            value={formState.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            {t("createListing.basicDetails.descriptionLabel")}
          </label>
          <textarea
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-md transition-colors outline-none resize-none"
            placeholder={t("createListing.basicDetails.descriptionPlaceholder")}
            rows={4}
            value={formState.description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            {t("createListing.basicDetails.storageTypeLabel")}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <input className="peer hidden" name="type" type="radio" checked={checked} onChange={onSelect} />
      <div className="p-6 border border-outline-variant rounded-md flex flex-col items-center gap-2 peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-primary transition-all text-center">
        <span className="material-symbols-outlined text-h1">{icon}</span>
        <span className="font-label-caps text-label-caps">{label}</span>
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
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">{t("createListing.visual.title")}</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          {t("createListing.visual.description")}
        </p>
      </div>

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

      <div className="w-full border-2 border-dashed border-outline-variant rounded-lg bg-surface-container-low flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 gap-2 hover:bg-surface-container transition-colors cursor-pointer group">
        <span className="material-symbols-outlined text-display text-primary/40 group-hover:text-primary transition-colors">
          image
        </span>
        <div className="text-center">
          <p className="font-h3 text-h3 text-primary">
            {t("createListing.visual.uploadTitle")}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("createListing.visual.uploadHint")}
          </p>
        </div>
        <button
          className="mt-4 border border-primary text-primary px-8 py-2 rounded-full font-label-caps text-label-caps hover:bg-primary hover:text-white transition-all uppercase"
          type="button"
          onClick={onFileClick}
        >
          {t("createListing.visual.browseFiles")}
        </button>
      </div>

      <div className="flex items-center gap-1 px-1">
        <span className="material-symbols-outlined text-error text-[20px]">error</span>
        <p className="text-body-sm font-semibold text-error">
          {t("createListing.visual.minImages")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
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
        <div className="aspect-video rounded-md border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container-low/50">
          <span className="material-symbols-outlined text-outline-variant">add</span>
        </div>
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
    <div className="group relative aspect-video rounded-md overflow-hidden bg-surface-container border border-outline-variant">
      <img alt={t("createListing.visual.previewAlt")} className="w-full h-full object-cover" src={src} />
      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-between items-start">
          <span className="material-symbols-outlined text-white cursor-move">
            drag_indicator
          </span>
          <button className="text-white hover:text-error transition-colors" type="button" disabled={disableActions} onClick={onDelete}>
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
        <button
          className={`flex items-center gap-1 text-white self-start px-2 py-1 rounded text-[10px] font-label-caps uppercase ${
            primary
              ? "bg-primary/60 backdrop-blur-sm"
              : "hover:bg-white/20 transition-colors border border-white/50"
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
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">{t("createListing.pricing.title")}</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          {t("createListing.pricing.description")}
        </p>
      </div>

      <div className="max-w-xs relative">
          <span className="absolute left-4 top-[34px] -translate-y-1/2 text-h2 text-on-surface-variant font-light">
          €
        </span>
        <input
          className="w-full bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 pl-10 pr-4 py-4 text-display font-display transition-colors outline-none appearance-none"
          placeholder={t("createListing.pricing.placeholder")}
          type="number"
          value={pricePerMonth}
          onChange={(event) => onPriceChange(event.target.value)}
        />

        <div className="mt-4 flex items-start gap-2 p-4 bg-secondary-container/20 rounded-md">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-sm text-on-secondary-container">
            {t("createListing.pricing.helper")}
          </p>
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
  sizeSqFt,
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
  sizeSqFt: string;
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
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">{t("createListing.location.title")}</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          {t("createListing.location.description")}
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            disabled={isFindingLocation || isUsingCurrentLocation}
            type="button"
            onClick={onFindOnMap}
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            {isFindingLocation ? t("createListing.location.finding") : t("createListing.location.findOnMap")}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container disabled:opacity-60"
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
          <div className="rounded-lg border border-secondary/20 bg-secondary-container/20 px-4 py-3 text-sm text-primary">
            {locationStatusMessage}
          </div>
        ) : null}

        {locationErrorMessage ? (
          <div className="rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
            {locationErrorMessage}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
              {t("createListing.location.addressLabel")}
            </label>
            <input
              className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
              placeholder={t("createListing.location.addressPlaceholder")}
              type="text"
              value={address}
              onChange={(event) => onAddressChange(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                {t("createListing.location.cityLabel")}
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder={t("createListing.location.cityPlaceholder")}
                type="text"
                value={city}
                onChange={(event) => onCityChange(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                {t("createListing.location.zipLabel")}
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder={t("createListing.location.zipPlaceholder")}
                type="text"
                value={postalCode}
                onChange={(event) => onPostalCodeChange(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
              {t("createListing.location.sizeLabel")}
            </label>
            <input
              className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
              placeholder={t("createListing.location.sizePlaceholder")}
              type="number"
              value={sizeSqFt}
              onChange={(event) => onSizeChange(event.target.value)}
            />
          </div>

          <button
            className="inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                  {t("createListing.location.latitudeLabel")}
                </label>
                <input
                  className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                  placeholder={t("createListing.location.latitudePlaceholder")}
                  step="any"
                  type="number"
                  value={latitude}
                  onChange={(event) => onLatitudeChange(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                  {t("createListing.location.longitudeLabel")}
                </label>
                <input
                  className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                  placeholder={t("createListing.location.longitudePlaceholder")}
                  step="any"
                  type="number"
                  value={longitude}
                  onChange={(event) => onLongitudeChange(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              {t("createListing.location.manualHint")}
            </div>
          )}
        </div>

        <div className="w-full h-full min-h-[320px] rounded-lg overflow-hidden">
          <LocationPickerMap
            address={address}
            city={city}
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={onLatitudeChange}
            onLongitudeChange={onLongitudeChange}
          />
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
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          {t("createListing.amenities.title")}
        </h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          {t("createListing.amenities.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {amenityOptions.map((item) => (
          <AmenityOption
            icon={item.icon}
            label={t(item.label)}
            key={item.label}
            checked={selectedAmenities.includes(item.label)}
            onToggle={() => onToggleAmenity(item.label)}
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
    <label className="group flex items-center gap-4 p-6 border border-outline-variant rounded-md cursor-pointer hover:border-secondary transition-all">
      <input className="peer hidden" type="checkbox" checked={checked} onChange={onToggle} />
      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-body-sm text-body-sm font-semibold text-primary">
          {label}
        </p>
      </div>
      <div className="w-5 h-5 rounded border border-outline-variant peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-colors">
        <span className="material-symbols-outlined text-white text-[14px] hidden peer-checked:block">
          check
        </span>
      </div>
    </label>
  );
}
