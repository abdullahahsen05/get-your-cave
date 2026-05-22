import {
  ListingAvailability,
  ListingStatus,
  Prisma,
  StorageType,
  type Listing,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  ListingDraftInput,
  ListingPublishInput,
} from "@/lib/validations/listing";

export type ListingCard = {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  storageType: StorageType;
  status: ListingStatus;
  availability: ListingAvailability;
  address: string;
  city: string;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  sizeSqFt: number | null;
  sizeM2: number | null;
  pricePerMonth: string;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  imageUrl: string | null;
  amenityNames: string[];
  createdAt: string;
  updatedAt: string;
};

export type ListingDetail = ListingCard & {
  address: string;
  width: number | null;
  length: number | null;
  height: number | null;
  securityDeposit: string;
  insuranceFee: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    city: string | null;
    responseRate: number | null;
    verificationStatus: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
};

export type ListingOwnerSummary = ListingCard & {
  address: string;
  ownerName: string;
  ownerEmail: string;
};

export type ListingListFilters = {
  page: number;
  limit: number;
  location?: string | null;
  city?: string | null;
  storageType?: StorageType | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minSize?: number | null;
  maxSize?: number | null;
  publicOnly?: boolean;
  includeArchived?: boolean;
};

const amenityIconMap: Record<string, string> = {
  "Security Camera": "videocam",
  "24/7 Access": "schedule",
  "Climate Control": "ac_unit",
  "Climate Controlled": "ac_unit",
  "Private Entry": "key",
  "Gated": "fence",
  "Loading Dock": "local_shipping",
  "CCTV": "videocam",
  "Biometric Access": "verified_user",
  "Drive-Up Access": "local_shipping",
  "Power Outlet": "power",
  "Alarm System": "notifications_active",
  "Elevator": "elevator",
  "Insurance": "shield",
  "Fire Suppression": "local_fire_department",
};

const listingCardInclude = {
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
  },
  amenities: {
    include: {
      amenity: true,
    },
  },
} satisfies Prisma.ListingInclude;

const listingDetailInclude = {
  ...listingCardInclude,
  owner: {
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.ListingInclude;

const ownerListingInclude = {
  ...listingDetailInclude,
} satisfies Prisma.ListingInclude;

function toDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }

  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function createStableSlug(title: string) {
  const base = slugify(title) || "listing";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function normalizeText(value?: string | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : "";
}

function normalizeNullableText(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeAmenityNames(values?: string[] | null) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeImageUrls(values?: string[] | null) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function pickPrimaryImage(images: Array<{
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}>) {
  if (!images.length) {
    return null;
  }

  const primary = images.find((image) => image.isPrimary);
  return primary?.url ?? images[0]?.url ?? null;
}

function buildPublicWhere(filters: ListingListFilters): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [
    {
      status: ListingStatus.APPROVED,
      isPublished: true,
    },
  ];

  if (!filters.includeArchived) {
    and.push({
      status: {
        not: ListingStatus.ARCHIVED,
      },
    });
  }

  if (filters.city) {
    and.push({
      city: {
        contains: filters.city,
        mode: "insensitive",
      },
    });
  }

  if (filters.location) {
    and.push({
      OR: [
        {
          title: {
            contains: filters.location,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: filters.location,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: filters.location,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: filters.location,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (filters.storageType) {
    and.push({
      storageType: filters.storageType,
    });
  }

  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    and.push({
      pricePerMonth: {
        gte: new Prisma.Decimal(filters.minPrice),
      },
    });
  }

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    and.push({
      pricePerMonth: {
        lte: new Prisma.Decimal(filters.maxPrice),
      },
    });
  }

  if (filters.minSize !== null && filters.minSize !== undefined) {
    and.push({
      OR: [
        {
          sizeSqFt: {
            gte: filters.minSize,
          },
        },
        {
          sizeM2: {
            gte: filters.minSize / 10.7639,
          },
        },
      ],
    });
  }

  if (filters.maxSize !== null && filters.maxSize !== undefined) {
    and.push({
      OR: [
        {
          sizeSqFt: {
            lte: filters.maxSize,
          },
        },
        {
          sizeM2: {
            lte: filters.maxSize / 10.7639,
          },
        },
      ],
    });
  }

  return { AND: and };
}

function buildOwnerWhere(ownerProfileId: string): Prisma.ListingWhereInput {
  return {
    ownerId: ownerProfileId,
  };
}

function serializeBaseListing(
  listing: Listing & {
    images?: Array<{
      id: string;
      url: string;
      altText: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }>;
    amenities?: Array<{
      amenity: {
        name: string;
      };
    }>;
  },
): ListingCard {
  const images = listing.images ?? [];

  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    storageType: listing.storageType,
    status: listing.status,
    availability: listing.availability,
    address: listing.address,
    city: listing.city,
    postalCode: listing.postalCode,
    country: listing.country,
    latitude: listing.latitude,
    longitude: listing.longitude,
    sizeSqFt: listing.sizeSqFt,
    sizeM2: listing.sizeM2,
    pricePerMonth: toDecimal(listing.pricePerMonth).toFixed(2),
    ratingAverage: listing.ratingAverage,
    ratingCount: listing.ratingCount,
    isFeatured: listing.isFeatured,
    isPublished: listing.isPublished,
    imageUrl: pickPrimaryImage(images),
    amenityNames: (listing.amenities ?? []).map((item) => item.amenity.name),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

function serializeListingDetail(
  listing: Listing & {
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }>;
    amenities: Array<{
      amenity: {
        name: string;
      };
    }>;
    owner: {
      id: string;
      userId: string;
      bio: string | null;
      city: string | null;
      responseRate: number | null;
      verificationStatus: string;
      user: {
        fullName: string;
        email: string;
        avatarUrl: string | null;
      };
    };
  },
): ListingDetail {
  const base = serializeBaseListing(listing);

  return {
    ...base,
    address: listing.address,
    width: listing.width,
    length: listing.length,
    height: listing.height,
    securityDeposit: toDecimal(listing.securityDeposit).toFixed(2),
    insuranceFee: toDecimal(listing.insuranceFee).toFixed(2),
    owner: {
      id: listing.owner.id,
      fullName: listing.owner.user.fullName,
      email: listing.owner.user.email,
      avatarUrl: listing.owner.user.avatarUrl,
      bio: listing.owner.bio,
      city: listing.owner.city,
      responseRate: listing.owner.responseRate,
      verificationStatus: listing.owner.verificationStatus,
    },
    images: listing.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
  };
}

function serializeOwnerListing(
  listing: Listing & {
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }>;
    amenities: Array<{
      amenity: {
        name: string;
      };
    }>;
    owner: {
      id: string;
      userId: string;
      bio: string | null;
      city: string | null;
      responseRate: number | null;
      verificationStatus: string;
      user: {
        fullName: string;
        email: string;
        avatarUrl: string | null;
      };
    };
  },
): ListingOwnerSummary {
  const base = serializeListingDetail(listing);

  return {
    ...base,
    address: listing.address,
    ownerName: listing.owner.user.fullName,
    ownerEmail: listing.owner.user.email,
  };
}

function buildCreateData(
  ownerId: string,
  input: ListingDraftInput | ListingPublishInput,
  existing?: {
    slug: string | null;
  },
): Prisma.ListingUncheckedCreateInput {
  const title = normalizeText(input.title) ?? "Untitled Storage Cave";
  const description = normalizeText(input.description) ?? "";
  const address = normalizeText(input.address) ?? "";
  const city = normalizeText(input.city) ?? "";
  const postalCode = normalizeNullableText(input.postalCode) ?? null;
  const latitude = input.latitude ?? null;
  const longitude = input.longitude ?? null;
  const storageType = input.storageType ?? StorageType.OTHER;
  const pricePerMonth = toDecimal(input.pricePerMonth ?? 0);
  const sizeSqFt = input.sizeSqFt ?? null;
  const sizeM2 = input.sizeM2 ?? null;
  const width = input.width ?? null;
  const length = input.length ?? null;
  const height = input.height ?? null;
  const status = input.status ?? ListingStatus.DRAFT;

  return {
    ownerId,
    title,
    slug: existing?.slug ?? createStableSlug(title),
    description,
    storageType,
    status,
    availability: ListingAvailability.AVAILABLE,
    address,
    city,
    postalCode,
    latitude,
    longitude,
    pricePerMonth,
    sizeSqFt,
    sizeM2,
    width,
    length,
    height,
    securityDeposit: new Prisma.Decimal(0),
    insuranceFee: new Prisma.Decimal(0),
    ratingAverage: 0,
    ratingCount: 0,
    isFeatured: input.isFeatured ?? false,
    isPublished: status === ListingStatus.APPROVED ? true : false,
  };
}

async function syncListingRelations(
  listingId: string,
  amenityNames: string[] | undefined,
  imageUrls: string[] | undefined,
  title: string,
) {
  if (amenityNames) {
    await prisma.listingAmenity.deleteMany({
      where: { listingId },
    });

    if (amenityNames.length) {
      const amenities = await Promise.all(
        amenityNames.map((name) =>
          prisma.amenity.upsert({
            where: { name },
            update: {
              icon: amenityIconMap[name] ?? "verified",
            },
            create: {
              name,
              icon: amenityIconMap[name] ?? "verified",
            },
          }),
        ),
      );

      await prisma.listingAmenity.createMany({
        data: amenities.map((amenity) => ({
          listingId,
          amenityId: amenity.id,
        })),
      });
    }
  }

  if (imageUrls) {
    await prisma.listingImage.deleteMany({
      where: { listingId },
    });

    if (imageUrls.length) {
      await prisma.listingImage.createMany({
        data: imageUrls.map((url, index) => ({
          listingId,
          url,
          altText: title,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    }
  }
}

function buildUpdateData(
  input: ListingDraftInput | ListingPublishInput,
  existing: {
    title: string;
    description: string;
    storageType: StorageType;
    address: string;
    city: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    pricePerMonth: Prisma.Decimal;
    sizeSqFt: number | null;
    sizeM2: number | null;
    width: number | null;
    length: number | null;
    height: number | null;
    status: ListingStatus;
    isFeatured: boolean;
    isPublished: boolean;
  },
): Prisma.ListingUncheckedUpdateInput {
  const title = normalizeText(input.title) ?? existing.title;
  const description = normalizeText(input.description) ?? existing.description;
  const address = normalizeText(input.address) ?? existing.address;
  const city = normalizeText(input.city) ?? existing.city;
  const postalCode = normalizeNullableText(input.postalCode) ?? existing.postalCode;
  const latitude = input.latitude !== undefined ? input.latitude : existing.latitude;
  const longitude = input.longitude !== undefined ? input.longitude : existing.longitude;
  const storageType = input.storageType ?? existing.storageType;
  const pricePerMonth = input.pricePerMonth !== undefined
    ? toDecimal(input.pricePerMonth)
    : existing.pricePerMonth;
  const sizeSqFt = input.sizeSqFt ?? existing.sizeSqFt;
  const sizeM2 = input.sizeM2 ?? existing.sizeM2;
  const width = input.width ?? existing.width;
  const length = input.length ?? existing.length;
  const height = input.height ?? existing.height;
  const status = input.status ?? existing.status;

  return {
    title,
    description,
    storageType,
    address,
    city,
    postalCode,
    latitude,
    longitude,
    pricePerMonth,
    sizeSqFt,
    sizeM2,
    width,
    length,
    height,
    status,
    isFeatured: input.isFeatured ?? existing.isFeatured,
    isPublished: status === ListingStatus.APPROVED ? true : false,
  };
}

export async function listPublicListings(filters: ListingListFilters) {
  const where = buildPublicWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [
        { isFeatured: "desc" },
        { updatedAt: "desc" },
      ],
      include: listingCardInclude,
    }),
  ]);

  return {
    total,
    listings: listings.map(serializeBaseListing),
  };
}

export async function getPublicListingById(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: listingDetailInclude,
  });

  if (!listing) {
    return null;
  }

  if (!listing.isPublished || listing.status !== ListingStatus.APPROVED) {
    return null;
  }

  return serializeListingDetail(listing);
}

export async function getListingByIdForOwner(
  id: string,
  ownerProfileId: string,
) {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId: ownerProfileId,
    },
    include: listingDetailInclude,
  });

  return listing ? serializeListingDetail(listing) : null;
}

export async function getListingByIdForViewer(
  id: string,
  viewer?: { role: string; ownerProfileId?: string | null },
) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: listingDetailInclude,
  });

  if (!listing) {
    return null;
  }

  const isPublicListing =
    listing.isPublished && listing.status === ListingStatus.APPROVED;

  if (isPublicListing) {
    return serializeListingDetail(listing);
  }

  if (!viewer) {
    return null;
  }

  if (viewer.role === "ADMIN") {
    return serializeListingDetail(listing);
  }

  if (
    viewer.role === "OWNER" &&
    viewer.ownerProfileId &&
    listing.ownerId === viewer.ownerProfileId
  ) {
    return serializeListingDetail(listing);
  }

  return null;
}

export async function getOwnerListings(ownerProfileId: string) {
  const listings = await prisma.listing.findMany({
    where: buildOwnerWhere(ownerProfileId),
    orderBy: [{ updatedAt: "desc" }],
    include: ownerListingInclude,
  });

  return listings.map(serializeOwnerListing);
}

export async function createOwnerListing(params: {
  ownerProfileId: string;
  data: ListingDraftInput | ListingPublishInput;
}) {
  const listing = await prisma.listing.create({
    data: buildCreateData(params.ownerProfileId, params.data),
    include: listingDetailInclude,
  });

  await syncListingRelations(
    listing.id,
    normalizeAmenityNames(params.data.amenityNames),
    normalizeImageUrls(params.data.imageUrls),
    listing.title,
  );

  const refreshed = await prisma.listing.findUnique({
    where: { id: listing.id },
    include: listingDetailInclude,
  });

  return refreshed ? serializeListingDetail(refreshed) : null;
}

export async function updateOwnerListing(params: {
  listingId: string;
  ownerProfileId: string;
  data: ListingDraftInput | ListingPublishInput;
}) {
  const existing = await prisma.listing.findFirst({
    where: {
      id: params.listingId,
      ownerId: params.ownerProfileId,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.listing.update({
    where: { id: existing.id },
    data: buildUpdateData(params.data, existing),
    include: listingDetailInclude,
  });

  await syncListingRelations(
    updated.id,
    normalizeAmenityNames(params.data.amenityNames),
    normalizeImageUrls(params.data.imageUrls),
    updated.title,
  );

  const refreshed = await prisma.listing.findUnique({
    where: { id: updated.id },
    include: listingDetailInclude,
  });

  return refreshed ? serializeListingDetail(refreshed) : null;
}

export async function archiveOwnerListing(params: {
  listingId: string;
  ownerProfileId: string;
}) {
  const existing = await prisma.listing.findFirst({
    where: {
      id: params.listingId,
      ownerId: params.ownerProfileId,
    },
  });

  if (!existing) {
    return null;
  }

  const archived = await prisma.listing.update({
    where: { id: existing.id },
    data: {
      status: ListingStatus.ARCHIVED,
      isPublished: false,
    },
    include: listingDetailInclude,
  });

  return serializeListingDetail(archived);
}

export function normalizeListingFilters(searchParams: URLSearchParams): ListingListFilters {
  const pageValue = Number(searchParams.get("page") ?? "1");
  const limitValue = Number(searchParams.get("limit") ?? "12");
  const storageTypeValue = searchParams.get("storageType");
  const minPriceRaw = searchParams.get("minPrice");
  const maxPriceRaw = searchParams.get("maxPrice");
  const minSizeRaw = searchParams.get("minSize");
  const maxSizeRaw = searchParams.get("maxSize");
  const minPriceValue = minPriceRaw === null || minPriceRaw === "" ? null : Number(minPriceRaw);
  const maxPriceValue = maxPriceRaw === null || maxPriceRaw === "" ? null : Number(maxPriceRaw);
  const minSizeValue = minSizeRaw === null || minSizeRaw === "" ? null : Number(minSizeRaw);
  const maxSizeValue = maxSizeRaw === null || maxSizeRaw === "" ? null : Number(maxSizeRaw);

  const parsedStorageType =
    storageTypeValue && storageTypeValue in StorageType
      ? (storageTypeValue as StorageType)
      : null;

  return {
    page: Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1,
    limit: Number.isFinite(limitValue) && limitValue > 0 ? Math.min(Math.floor(limitValue), 24) : 12,
    location: searchParams.get("location")?.trim() || null,
    city: searchParams.get("city")?.trim() || null,
    storageType: parsedStorageType,
    minPrice: minPriceValue !== null && Number.isFinite(minPriceValue) ? minPriceValue : null,
    maxPrice: maxPriceValue !== null && Number.isFinite(maxPriceValue) ? maxPriceValue : null,
    minSize: minSizeValue !== null && Number.isFinite(minSizeValue) ? minSizeValue : null,
    maxSize: maxSizeValue !== null && Number.isFinite(maxSizeValue) ? maxSizeValue : null,
    publicOnly: searchParams.get("publicOnly") !== "false",
    includeArchived: searchParams.get("includeArchived") === "true",
  };
}

export function normalizeListingPayload(
  payload: ListingDraftInput | ListingPublishInput,
) {
  return {
    title: normalizeText(payload.title),
    description: normalizeText(payload.description),
    storageType: payload.storageType,
    address: normalizeText(payload.address),
    city: normalizeText(payload.city),
    postalCode: normalizeNullableText(payload.postalCode),
    pricePerMonth: payload.pricePerMonth,
    sizeSqFt: payload.sizeSqFt,
    sizeM2: payload.sizeM2,
    width: payload.width,
    length: payload.length,
    height: payload.height,
    amenityNames: normalizeAmenityNames(payload.amenityNames),
    imageUrls: normalizeImageUrls(payload.imageUrls),
    status: payload.status,
    isFeatured: payload.isFeatured,
    isPublished: payload.isPublished,
  };
}
