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

import { listingPublishSchema } from "@/lib/validations/listing";
import { StorageType } from "@prisma/client";

const steps = [
  { label: "Basic Details", icon: "info" },
  { label: "Photos", icon: "image" },
  { label: "Pricing", icon: "payments" },
  { label: "Location", icon: "location_on" },
  { label: "Amenities", icon: "verified_user" },
];

const storageTypes = [
  { value: StorageType.GARAGE, label: "Garage", icon: "garage" },
  { value: StorageType.BASEMENT, label: "Basement", icon: "house_siding" },
  { value: StorageType.ROOM, label: "Room", icon: "meeting_room" },
  { value: StorageType.WAREHOUSE, label: "Warehouse", icon: "warehouse" },
] as const;

const amenityOptions = [
  { icon: "videocam", label: "Security Camera" },
  { icon: "schedule", label: "24/7 Access" },
  { icon: "ac_unit", label: "Climate Control" },
  { icon: "key", label: "Private Entry" },
  { icon: "fence", label: "Gated" },
  { icon: "local_shipping", label: "Loading Dock" },
];

const LocationPreviewMap = dynamic(
  () => import("@/components/maps/LocationPreviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 md:h-full min-h-[200px] bg-surface-container rounded-lg animate-pulse border border-outline-variant/30" />
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

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
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

function validateCoordinatePair(latitude: string, longitude: string) {
  const hasLatitude = latitude.trim().length > 0;
  const hasLongitude = longitude.trim().length > 0;

  if (hasLatitude !== hasLongitude) {
    return "Please enter both latitude and longitude.";
  }

  if (!hasLatitude) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
    return "Latitude must be between -90 and 90.";
  }

  if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    return "Longitude must be between -180 and 180.";
  }

  return null;
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
          setErrorMessage("Unable to load your draft listing right now.");
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
  }, [listingIdFromUrl]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setErrorMessage(null);
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
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

    const urls = await Promise.all(files.map((file) => toDataUrl(file)));

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
        return "Please add a listing title.";
      }

      if (formState.description.trim().length < 20) {
        return "Please add a longer description.";
      }

      if (!formState.storageType) {
        return "Please choose a storage type.";
      }
    }

    if (currentStep === 2) {
      const price = Number(formState.pricePerMonth);
      if (!Number.isFinite(price) || price <= 0) {
        return "Please add a monthly price.";
      }
    }

    if (currentStep === 3) {
      if (!formState.address.trim()) {
        return "Please add a street address.";
      }

      if (!formState.city.trim()) {
        return "Please add a city.";
      }

      const coordinateError = validateCoordinatePair(formState.latitude, formState.longitude);
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
        setErrorMessage(publishParsed.error.issues[0]?.message ?? "Please check the form fields.");
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
        setErrorMessage(data.error ?? "Unable to save this listing right now.");
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
      setErrorMessage("Unable to save this listing right now.");
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
                Step {step + 1} of {steps.length}: {steps[step].label}
              </span>
              <span className="font-label-caps text-label-caps text-secondary">
                {Math.round(progress)}% Complete
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
                    key={item.label}
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
                      {item.label}
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
            Back
          </button>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            <button
              className="flex-1 md:flex-none border border-outline text-primary px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-surface-container transition-all uppercase"
              disabled={isSubmitting}
              onClick={() => persistListing("DRAFT")}
              type="button"
            >
              Save Draft
            </button>
            <button
              className="flex-1 md:flex-none bg-primary text-white px-12 py-3 rounded-full font-label-caps text-label-caps hover:opacity-90 transition-all uppercase shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
              form="create-listing-form"
            >
              {isSubmitting ? "Saving..." : isLastStep ? "Submit Listing" : "Next Step"}
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
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          Let&apos;s start with the basics
        </h2>
        <p className="text-on-surface-variant font-body-md text-body-md">
          Define your space and what makes it unique for asset storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Cave Title
          </label>
          <input
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-lg font-h3 transition-colors outline-none"
            placeholder="e.g., Secure Garage in Downtown"
            type="text"
            value={formState.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Description
          </label>
          <textarea
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-md transition-colors outline-none resize-none"
            placeholder="Describe the serenity, security, and accessibility of your space..."
            rows={4}
            value={formState.description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Storage Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {storageTypes.map((item) => (
              <StorageTypeOption
                icon={item.icon}
                label={item.label}
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
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Visual Documentation</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          High-resolution imagery builds trust. Show off the floor quality,
          lighting, and entry points.
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
            Upload Storage Photos (Min 3 required)
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Drag &amp; drop or click to browse
          </p>
        </div>
        <button
          className="mt-4 border border-primary text-primary px-8 py-2 rounded-full font-label-caps text-label-caps hover:bg-primary hover:text-white transition-all uppercase"
          type="button"
          onClick={onFileClick}
        >
          Browse Files
        </button>
      </div>

      <div className="flex items-center gap-1 px-1">
        <span className="material-symbols-outlined text-error text-[20px]">error</span>
        <p className="text-body-sm font-semibold text-error">
          At least 3 images required
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
  return (
    <div className="group relative aspect-video rounded-md overflow-hidden bg-surface-container border border-outline-variant">
      <img alt="Storage preview" className="w-full h-full object-cover" src={src} />
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
          {primary ? "Primary" : "Set Primary"}
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
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Monthly Rate</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Consistent income for your underutilized asset.
        </p>
      </div>

      <div className="max-w-xs relative">
        <span className="absolute left-4 top-[34px] -translate-y-1/2 text-h2 text-on-surface-variant font-light">
          $
        </span>
        <input
          className="w-full bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 pl-10 pr-4 py-4 text-display font-display transition-colors outline-none appearance-none"
          placeholder="0.00"
          type="number"
          value={pricePerMonth}
          onChange={(event) => onPriceChange(event.target.value)}
        />

        <div className="mt-4 flex items-start gap-2 p-4 bg-secondary-container/20 rounded-md">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-sm text-on-secondary-container">
            Spaces like yours in <strong>Downtown</strong> typically range from{" "}
            <strong>$250 - $450</strong> per month.
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
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Location Details</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Your exact address is only shared after a reservation is confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
              Street Address
            </label>
            <input
              className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
              placeholder="123 Serenity Lane"
              type="text"
              value={address}
              onChange={(event) => onAddressChange(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                City
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="San Francisco"
                type="text"
                value={city}
                onChange={(event) => onCityChange(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                Zip Code
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="94105"
                type="text"
                value={postalCode}
                onChange={(event) => onPostalCodeChange(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
              Size (sq ft)
            </label>
            <input
              className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
              placeholder="120"
              type="number"
              value={sizeSqFt}
              onChange={(event) => onSizeChange(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                Latitude
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="48.8566"
                step="any"
                type="number"
                value={latitude}
                onChange={(event) => onLatitudeChange(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                Longitude
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="2.3522"
                step="any"
                type="number"
                value={longitude}
                onChange={(event) => onLongitudeChange(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="w-full h-48 md:h-full min-h-[200px] rounded-lg overflow-hidden">
          <LocationPreviewMap latitude={latitude} longitude={longitude} />
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
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          Amenities &amp; Features
        </h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Highlight the security and accessibility features that define your
          Cave.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {amenityOptions.map((item) => (
          <AmenityOption
            icon={item.icon}
            label={item.label}
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
