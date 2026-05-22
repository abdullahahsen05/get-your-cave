import { ListingStatus, StorageType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(5000)
  .optional();

const optionalSmallString = z
  .string()
  .trim()
  .max(255)
  .optional();

const optionalNullableSmallString = z
  .union([z.string(), z.null()])
  .transform((value) =>
    typeof value === "string" ? value.trim() || null : value,
  )
  .optional();

const optionalNumber = z.coerce.number().finite().nonnegative().optional();

const optionalCoordinate = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }

    return value;
  },
  z.coerce.number().finite().optional(),
);

function validateCoordinates(
  data: { latitude?: number; longitude?: number },
  ctx: z.RefinementCtx,
) {
  const hasLatitude = data.latitude !== undefined;
  const hasLongitude = data.longitude !== undefined;
  const latitude = data.latitude;
  const longitude = data.longitude;

  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: hasLatitude ? ["longitude"] : ["latitude"],
      message: "Please enter both latitude and longitude.",
    });
  }

  if (hasLatitude && latitude !== undefined && (latitude < -90 || latitude > 90)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["latitude"],
      message: "Latitude must be between -90 and 90.",
    });
  }

  if (
    hasLongitude &&
    longitude !== undefined &&
    (longitude < -180 || longitude > 180)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["longitude"],
      message: "Longitude must be between -180 and 180.",
    });
  }
}

export const listingAmenityNamesSchema = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

export const listingImageUrlsSchema = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

const listingDraftSchemaBase = z.object({
  title: optionalSmallString,
  description: optionalTrimmedString,
  storageType: z.nativeEnum(StorageType).optional(),
  address: optionalTrimmedString,
  city: optionalSmallString,
  postalCode: optionalNullableSmallString,
  pricePerMonth: optionalNumber,
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  sizeSqFt: optionalNumber,
  sizeM2: optionalNumber,
  width: optionalNumber,
  length: optionalNumber,
  height: optionalNumber,
  amenityNames: listingAmenityNamesSchema,
  imageUrls: listingImageUrlsSchema,
  status: z.nativeEnum(ListingStatus).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const listingDraftSchema = listingDraftSchemaBase.superRefine(validateCoordinates);

export const listingPublishSchema = listingDraftSchemaBase.extend({
  title: z.string().trim().min(2, "Please add a listing title."),
  description: z.string().trim().min(20, "Please add a longer description."),
  storageType: z.nativeEnum(StorageType),
  address: z.string().trim().min(3, "Please add a street address."),
  city: z.string().trim().min(2, "Please add a city."),
  pricePerMonth: z.coerce
    .number()
    .positive("Please add a monthly price."),
  sizeSqFt: z.coerce.number().positive().optional(),
  amenityNames: z.array(z.string().trim().min(1)).optional().default([]),
  imageUrls: z.array(z.string().trim().min(1)).optional().default([]),
}).superRefine(validateCoordinates);

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;
export type ListingPublishInput = z.infer<typeof listingPublishSchema>;
