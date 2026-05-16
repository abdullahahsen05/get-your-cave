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

export const listingAmenityNamesSchema = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

export const listingImageUrlsSchema = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

export const listingDraftSchema = z.object({
  title: optionalSmallString,
  description: optionalTrimmedString,
  storageType: z.nativeEnum(StorageType).optional(),
  address: optionalTrimmedString,
  city: optionalSmallString,
  postalCode: optionalNullableSmallString,
  pricePerMonth: optionalNumber,
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

export const listingPublishSchema = listingDraftSchema.extend({
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
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;
export type ListingPublishInput = z.infer<typeof listingPublishSchema>;
