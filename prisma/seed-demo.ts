import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import {
  AccountStatus,
  AdminEntityType,
  BookingStatus,
  ContractStatus,
  DocumentType,
  InvoiceStatus,
  ListingAvailability,
  ListingStatus,
  Prisma,
  PaymentStatus,
  StorageType,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

import { hashPassword } from "@/lib/auth";
import { calculateBookingCharges } from "@/lib/bookings";
import { startOrGetConversation, createConversationMessage } from "@/lib/messages";
import { generateContractForBooking } from "@/lib/contracts/generateContract";
import { generateInvoiceForBooking } from "@/lib/invoices/generateInvoice";
import { prisma } from "@/lib/prisma";

type SeededListing = {
  id: string;
  slug: string | null;
  title: string;
  ownerId: string;
  ownerProfileId: string;
  status: ListingStatus;
  pricePerMonth: Prisma.Decimal;
  securityDeposit: Prisma.Decimal;
  insuranceFee: Prisma.Decimal;
};

type SeededBooking = {
  id: string;
  bookingNumber: string;
  listingId: string;
  ownerId: string;
  renterId: string;
  status: BookingStatus;
  monthlyPrice: Prisma.Decimal;
  securityDeposit: Prisma.Decimal;
  insuranceFee: Prisma.Decimal;
  platformCommission: Prisma.Decimal;
  ownerAmount: Prisma.Decimal;
  totalMonthlyAmount: Prisma.Decimal;
};

const DEMO_EMAILS = [
  "admin@getyourcave.com",
  "owner1@getyourcave.com",
  "owner2@getyourcave.com",
  "renter1@getyourcave.com",
  "renter2@getyourcave.com",
] as const;

const DEMO_GENERATED_PREFIX = "demo-";
const PLACEHOLDER_IMAGE = "/placeholder-listing.svg";
const DEMO_PASSWORD = "Password123!";

function decimal(value: number | string | Prisma.Decimal) {
  return value instanceof Prisma.Decimal
    ? value.toDecimalPlaces(2)
    : new Prisma.Decimal(value).toDecimalPlaces(2);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));
}

function demoFileName(bookingNumber: string) {
  return `${DEMO_GENERATED_PREFIX}${bookingNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx`;
}

function isSeedError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string" &&
    (value as { error: string }).error.length > 0
  );
}

async function ensureDemoGeneratedFolder() {
  await fs.mkdir(path.join(process.cwd(), "docs", "generated"), { recursive: true });
}

async function cleanupDemoGeneratedFiles() {
  const generatedDir = path.join(process.cwd(), "docs", "generated");
  const entries = await fs.readdir(generatedDir, { withFileTypes: true }).catch(() => []);

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(DEMO_GENERATED_PREFIX))
      .map((entry) => fs.rm(path.join(generatedDir, entry.name), { force: true })),
  );
}

async function seedUsers() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [...DEMO_EMAILS],
      },
    },
  });

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const [admin, owner1, owner2, renter1, renter2] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: "Seed Admin",
        email: "admin@getyourcave.com",
        passwordHash,
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Amine Morel",
        email: "owner1@getyourcave.com",
        passwordHash,
        role: UserRole.OWNER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        ownerProfile: {
          create: {
            bio: "Owner of several secure storage spaces near the city center.",
            address: "18 Rue des Archives",
            city: "Paris",
            postalCode: "75003",
            country: "France",
            iban: "FR76 3000 6000 0112 3456 7890 189",
            stripeAccountId: "acct_demo_owner1",
            responseRate: 98,
            verificationStatus: VerificationStatus.APPROVED,
          },
        },
      },
      include: {
        ownerProfile: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Sophie Bernard",
        email: "owner2@getyourcave.com",
        passwordHash,
        role: UserRole.OWNER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        ownerProfile: {
          create: {
            bio: "Independent owner with a growing inventory of urban storage units.",
            address: "9 Quai de la Fosse",
            city: "Nantes",
            postalCode: "44000",
            country: "France",
            iban: "FR76 2004 1010 0505 0001 3M02 606",
            stripeAccountId: null,
            responseRate: 74,
            verificationStatus: VerificationStatus.PENDING,
          },
        },
      },
      include: {
        ownerProfile: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Karim Diallo",
        email: "renter1@getyourcave.com",
        passwordHash,
        role: UserRole.RENTER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        renterProfile: {
          create: {
            address: "31 Boulevard Voltaire",
            city: "Paris",
            postalCode: "75011",
            country: "France",
            verificationStatus: VerificationStatus.APPROVED,
          },
        },
      },
      include: {
        renterProfile: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Nadia El Amrani",
        email: "renter2@getyourcave.com",
        passwordHash,
        role: UserRole.RENTER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        renterProfile: {
          create: {
            address: "4 Rue du Faubourg",
            city: "Lyon",
            postalCode: "69003",
            country: "France",
            verificationStatus: VerificationStatus.NOT_SUBMITTED,
          },
        },
      },
      include: {
        renterProfile: true,
      },
    }),
  ]);

  return {
    admin,
    owner1,
    owner2,
    renter1,
    renter2,
  };
}

async function seedReferenceData() {
  const amenitySeeds = [
    { name: "Security Camera", icon: "videocam" },
    { name: "24/7 Access", icon: "schedule" },
    { name: "Climate Controlled", icon: "ac_unit" },
    { name: "Private Entrance", icon: "key" },
    { name: "Drive-Up Access", icon: "local_shipping" },
    { name: "Alarm System", icon: "notifications_active" },
    { name: "Gated Access", icon: "fence" },
    { name: "Power Outlet", icon: "power" },
  ] as const;

  const amenities = await Promise.all(
    amenitySeeds.map((amenity) =>
      prisma.amenity.upsert({
        where: { name: amenity.name },
        update: {
          icon: amenity.icon,
        },
        create: {
          name: amenity.name,
          icon: amenity.icon,
        },
      }),
    ),
  );

  await prisma.platformMetric.upsert({
    where: { key: "verified_listings" },
    update: {
      label: "Verified Listings",
      value: "5",
      note: "Approved inventory ready for browsing",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      key: "verified_listings",
      label: "Verified Listings",
      value: "5",
      note: "Approved inventory ready for browsing",
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.platformMetric.upsert({
    where: { key: "monthly_revenue" },
    update: {
      label: "Monthly Revenue",
      value: "€3.2k",
      note: "Seeded payment data for dashboard charts",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      key: "monthly_revenue",
      label: "Monthly Revenue",
      value: "€3.2k",
      note: "Seeded payment data for dashboard charts",
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.platformMetric.upsert({
    where: { key: "active_conversations" },
    update: {
      label: "Active Conversations",
      value: "2",
      note: "Owner-renter messaging threads",
      sortOrder: 3,
      isActive: true,
    },
    create: {
      key: "active_conversations",
      label: "Active Conversations",
      value: "2",
      note: "Owner-renter messaging threads",
      sortOrder: 3,
      isActive: true,
    },
  });

  const faqs = [
    {
      question: "How quickly can I book a storage unit?",
      answer:
        "Approved listings can be booked immediately and the owner receives the request for confirmation right away.",
      sortOrder: 1,
    },
    {
      question: "Can I access my storage every day?",
      answer:
        "Some listings include 24/7 access, while others have owner-defined hours. The listing cards show the available amenities.",
      sortOrder: 2,
    },
    {
      question: "What documents do owners need to provide?",
      answer:
        "Owners usually upload an ID card and a proof of ownership document before their profile is fully verified.",
      sortOrder: 3,
    },
    {
      question: "How are payments handled?",
      answer:
        "Payments and invoices are recorded in the dashboard so you can track issued, paid, overdue, and cancelled states.",
      sortOrder: 4,
    },
  ];

  await prisma.fAQ.deleteMany({
    where: {
      question: {
        in: faqs.map((faq) => faq.question),
      },
    },
  });

  await prisma.fAQ.createMany({
    data: faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isActive: true,
    })),
  });

  return {
    amenitiesByName: new Map(amenities.map((amenity) => [amenity.name, amenity])),
  };
}

async function seedListings(params: {
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
  amenitiesByName: Map<string, { id: string; name: string }>;
}) {
  const demoListings = [
    {
      slug: "rive-gauche-archive-loft",
      title: "Rive Gauche Archive Loft",
      owner: params.owner1,
      storageType: StorageType.LOFT,
      status: ListingStatus.APPROVED,
      availability: ListingAvailability.AVAILABLE,
      city: "Paris",
      address: "14 Rue de Sèvres",
      postalCode: "75007",
      latitude: 48.8514,
      longitude: 2.3256,
      sizeM2: 18,
      sizeSqFt: 194,
      width: 3.1,
      length: 5.8,
      height: 2.6,
      pricePerMonth: 220,
      securityDeposit: 150,
      insuranceFee: 15,
      ratingAverage: 4.9,
      ratingCount: 18,
      isFeatured: true,
      amenities: ["Security Camera", "24/7 Access", "Climate Controlled", "Private Entrance"],
      images: [PLACEHOLDER_IMAGE],
    },
    {
      slug: "canal-saint-martin-bike-locker",
      title: "Canal Saint-Martin Bike Locker",
      owner: params.owner1,
      storageType: StorageType.LOCKER,
      status: ListingStatus.APPROVED,
      availability: ListingAvailability.AVAILABLE,
      city: "Paris",
      address: "62 Quai de Jemmapes",
      postalCode: "75010",
      latitude: 48.8719,
      longitude: 2.3628,
      sizeM2: 6,
      sizeSqFt: 65,
      width: 1.8,
      length: 3.4,
      height: 2.2,
      pricePerMonth: 95,
      securityDeposit: 80,
      insuranceFee: 8,
      ratingAverage: 4.7,
      ratingCount: 10,
      isFeatured: false,
      amenities: ["24/7 Access", "Security Camera", "Private Entrance"],
      images: [`${PLACEHOLDER_IMAGE}?listing=canal`],
    },
    {
      slug: "montreuil-family-storage-suite",
      title: "Montreuil Family Storage Suite",
      owner: params.owner1,
      storageType: StorageType.GARAGE,
      status: ListingStatus.APPROVED,
      availability: ListingAvailability.OCCUPIED,
      city: "Montreuil",
      address: "28 Rue de Paris",
      postalCode: "93100",
      latitude: 48.8631,
      longitude: 2.4483,
      sizeM2: 24,
      sizeSqFt: 258,
      width: 4.2,
      length: 6.0,
      height: 2.8,
      pricePerMonth: 180,
      securityDeposit: 120,
      insuranceFee: 12,
      ratingAverage: 4.8,
      ratingCount: 22,
      isFeatured: false,
      amenities: ["Drive-Up Access", "Security Camera", "Alarm System"],
      images: [`${PLACEHOLDER_IMAGE}?listing=montreuil`],
    },
    {
      slug: "bordeaux-vault-annex",
      title: "Bordeaux Vault Annex",
      owner: params.owner1,
      storageType: StorageType.BASEMENT,
      status: ListingStatus.PENDING_APPROVAL,
      availability: ListingAvailability.AVAILABLE,
      city: "Bordeaux",
      address: "18 Cours de la Marne",
      postalCode: "33000",
      latitude: 44.8249,
      longitude: -0.5594,
      sizeM2: 14,
      sizeSqFt: 151,
      width: 3.0,
      length: 4.7,
      height: 2.5,
      pricePerMonth: 130,
      securityDeposit: 90,
      insuranceFee: 10,
      ratingAverage: 0,
      ratingCount: 0,
      isFeatured: false,
      amenities: ["Security Camera", "Power Outlet"],
      images: [`${PLACEHOLDER_IMAGE}?listing=bordeaux`],
    },
    {
      slug: "lyon-riverside-wine-cellar",
      title: "Lyon Riverside Wine Cellar",
      owner: params.owner2,
      storageType: StorageType.BASEMENT,
      status: ListingStatus.APPROVED,
      availability: ListingAvailability.AVAILABLE,
      city: "Lyon",
      address: "11 Quai Saint-Antoine",
      postalCode: "69002",
      latitude: 45.7597,
      longitude: 4.8320,
      sizeM2: 12,
      sizeSqFt: 129,
      width: 2.7,
      length: 4.4,
      height: 2.4,
      pricePerMonth: 140,
      securityDeposit: 100,
      insuranceFee: 12,
      ratingAverage: 4.6,
      ratingCount: 14,
      isFeatured: true,
      amenities: ["Climate Controlled", "Security Camera", "Private Entrance"],
      images: [`${PLACEHOLDER_IMAGE}?listing=lyon`],
    },
    {
      slug: "marseille-harbor-warehouse-bay",
      title: "Marseille Harbor Warehouse Bay",
      owner: params.owner2,
      storageType: StorageType.WAREHOUSE,
      status: ListingStatus.APPROVED,
      availability: ListingAvailability.AVAILABLE,
      city: "Marseille",
      address: "7 Boulevard de Dunkerque",
      postalCode: "13002",
      latitude: 43.3075,
      longitude: 5.3608,
      sizeM2: 55,
      sizeSqFt: 592,
      width: 8.5,
      length: 10.0,
      height: 4.2,
      pricePerMonth: 390,
      securityDeposit: 250,
      insuranceFee: 35,
      ratingAverage: 4.5,
      ratingCount: 9,
      isFeatured: false,
      amenities: ["Drive-Up Access", "Alarm System", "Gated Access"],
      images: [`${PLACEHOLDER_IMAGE}?listing=marseille`],
    },
    {
      slug: "nice-old-town-cold-room",
      title: "Nice Old Town Cold Room",
      owner: params.owner2,
      storageType: StorageType.ROOM,
      status: ListingStatus.REJECTED,
      availability: ListingAvailability.UNAVAILABLE,
      city: "Nice",
      address: "21 Rue Droite",
      postalCode: "06000",
      latitude: 43.7009,
      longitude: 7.2710,
      sizeM2: 9,
      sizeSqFt: 97,
      width: 2.2,
      length: 4.0,
      height: 2.3,
      pricePerMonth: 110,
      securityDeposit: 85,
      insuranceFee: 10,
      ratingAverage: 0,
      ratingCount: 0,
      isFeatured: false,
      amenities: ["Climate Controlled", "Security Camera"],
      images: [`${PLACEHOLDER_IMAGE}?listing=nice`],
    },
    {
      slug: "lille-attic-cache",
      title: "Lille Attic Cache",
      owner: params.owner1,
      storageType: StorageType.ROOM,
      status: ListingStatus.DRAFT,
      availability: ListingAvailability.AVAILABLE,
      city: "Lille",
      address: "44 Rue de Béthune",
      postalCode: "59000",
      latitude: 50.6366,
      longitude: 3.0635,
      sizeM2: 10,
      sizeSqFt: 108,
      width: 2.5,
      length: 4.0,
      height: 2.1,
      pricePerMonth: 85,
      securityDeposit: 70,
      insuranceFee: 6,
      ratingAverage: 0,
      ratingCount: 0,
      isFeatured: false,
      amenities: ["Private Entrance", "Power Outlet"],
      images: [`${PLACEHOLDER_IMAGE}?listing=lille`],
    },
    {
      slug: "toulouse-riverside-pod",
      title: "Toulouse Riverside Pod",
      owner: params.owner2,
      storageType: StorageType.LOCKER,
      status: ListingStatus.ARCHIVED,
      availability: ListingAvailability.UNAVAILABLE,
      city: "Toulouse",
      address: "9 Rue des Blanchers",
      postalCode: "31000",
      latitude: 43.6047,
      longitude: 1.4442,
      sizeM2: 30,
      sizeSqFt: 323,
      width: 4.8,
      length: 6.6,
      height: 2.8,
      pricePerMonth: 200,
      securityDeposit: 120,
      insuranceFee: 18,
      ratingAverage: 4.3,
      ratingCount: 7,
      isFeatured: false,
      amenities: ["24/7 Access", "Gated Access", "Security Camera"],
      images: [`${PLACEHOLDER_IMAGE}?listing=toulouse`],
    },
  ] as const;

  const listingsBySlug = new Map<string, SeededListing>();

  for (const seed of demoListings) {
    const listing = await prisma.listing.create({
      data: {
        ownerId: seed.owner.ownerProfile!.id,
        title: seed.title,
        slug: seed.slug,
        description: `Demo listing for ${seed.title.toLowerCase()} with realistic inventory and bookkeeping data.`,
        storageType: seed.storageType,
        status: seed.status,
        availability: seed.availability,
        address: seed.address,
        city: seed.city,
        postalCode: seed.postalCode,
        country: "France",
        latitude: seed.latitude,
        longitude: seed.longitude,
        sizeM2: seed.sizeM2,
        sizeSqFt: seed.sizeSqFt,
        width: seed.width,
        length: seed.length,
        height: seed.height,
        pricePerMonth: decimal(seed.pricePerMonth),
        securityDeposit: decimal(seed.securityDeposit),
        insuranceFee: decimal(seed.insuranceFee),
        ratingAverage: seed.ratingAverage,
        ratingCount: seed.ratingCount,
        isFeatured: seed.isFeatured,
        isPublished: seed.status === ListingStatus.APPROVED,
      },
    });

    await prisma.listingImage.createMany({
      data: seed.images.map((url, index) => ({
        listingId: listing.id,
        url,
        fileName: `${seed.slug}-${index + 1}.svg`,
        altText: seed.title,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });

    const amenityIds = seed.amenities
      .map((name) => params.amenitiesByName.get(name))
      .filter((value): value is { id: string; name: string } => Boolean(value));

    if (amenityIds.length) {
      await prisma.listingAmenity.createMany({
        data: amenityIds.map((amenity) => ({
          listingId: listing.id,
          amenityId: amenity.id,
        })),
      });
    }

    listingsBySlug.set(seed.slug, {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      ownerId: listing.ownerId,
      ownerProfileId: seed.owner.ownerProfile!.id,
      status: listing.status,
      pricePerMonth: listing.pricePerMonth,
      securityDeposit: listing.securityDeposit,
      insuranceFee: listing.insuranceFee,
    });
  }

  return listingsBySlug;
}

async function seedBookings(params: {
  listingsBySlug: Map<string, SeededListing>;
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
  renter1: Awaited<ReturnType<typeof seedUsers>>["renter1"];
  renter2: Awaited<ReturnType<typeof seedUsers>>["renter2"];
}) {
  const now = new Date();
  const bookingsSeed = [
    {
      bookingNumber: "BK-DEMO-001",
      listingSlug: "rive-gauche-archive-loft",
      renter: params.renter1,
      status: BookingStatus.PENDING,
      startDate: addMonths(now, 2),
      endDate: addMonths(now, 3),
      durationMonths: 1,
      renterNote: "Looking for a secure short-term space while I finish moving.",
      ownerNote: null,
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
    },
    {
      bookingNumber: "BK-DEMO-002",
      listingSlug: "canal-saint-martin-bike-locker",
      renter: params.renter2,
      status: BookingStatus.APPROVED,
      startDate: addMonths(now, 1),
      endDate: addMonths(now, 4),
      durationMonths: 3,
      renterNote: "Need weekday access for inventory rotation.",
      ownerNote: "Approved pending payment confirmation.",
      approvedAt: addDays(now, -2),
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
    },
    {
      bookingNumber: "BK-DEMO-003",
      listingSlug: "lyon-riverside-wine-cellar",
      renter: params.renter1,
      status: BookingStatus.ACTIVE,
      startDate: addMonths(now, -1),
      endDate: addMonths(now, 11),
      durationMonths: 12,
      renterNote: "Active monthly storage for event equipment.",
      ownerNote: "Client has already completed first payment.",
      approvedAt: addMonths(now, -2),
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
    },
    {
      bookingNumber: "BK-DEMO-004",
      listingSlug: "marseille-harbor-warehouse-bay",
      renter: params.renter2,
      status: BookingStatus.COMPLETED,
      startDate: addMonths(now, -8),
      endDate: addMonths(now, -2),
      durationMonths: 6,
      renterNote: "Completed long-term logistics storage.",
      ownerNote: "Closed after final inspection.",
      approvedAt: addMonths(now, -8),
      rejectedAt: null,
      cancelledAt: null,
      completedAt: addMonths(now, -2),
    },
    {
      bookingNumber: "BK-DEMO-005",
      listingSlug: "montreuil-family-storage-suite",
      renter: params.renter1,
      status: BookingStatus.CANCELLED,
      startDate: addMonths(now, 1),
      endDate: addMonths(now, 13),
      durationMonths: 12,
      renterNote: "Cancelled after a change of move-in plans.",
      ownerNote: "Cancelled before the move-in date.",
      approvedAt: null,
      rejectedAt: null,
      cancelledAt: addDays(now, -3),
      completedAt: null,
    },
    {
      bookingNumber: "BK-DEMO-006",
      listingSlug: "rive-gauche-archive-loft",
      renter: params.renter2,
      status: BookingStatus.COMPLETED,
      startDate: addMonths(now, -6),
      endDate: addMonths(now, -1),
      durationMonths: 5,
      renterNote: "Completed temporary archive storage.",
      ownerNote: "All access logs were clean.",
      approvedAt: addMonths(now, -6),
      rejectedAt: null,
      cancelledAt: null,
      completedAt: addMonths(now, -1),
    },
    {
      bookingNumber: "BK-DEMO-007",
      listingSlug: "montreuil-family-storage-suite",
      renter: params.renter2,
      status: BookingStatus.APPROVED,
      startDate: addMonths(now, 1),
      endDate: addMonths(now, 4),
      durationMonths: 3,
      renterNote: "Demo checkout booking for Stripe testing.",
      ownerNote: "Approved specifically for Stripe payment QA.",
      approvedAt: addDays(now, -1),
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
    },
  ] as const;

  const bookingsByNumber = new Map<string, SeededBooking>();

  for (const seed of bookingsSeed) {
    const listing = params.listingsBySlug.get(seed.listingSlug);
    if (!listing) {
      throw new Error(`Missing listing for booking seed ${seed.bookingNumber}.`);
    }

    const charges = calculateBookingCharges({
      monthlyPrice: listing.pricePerMonth,
      securityDeposit: listing.securityDeposit,
      insuranceFee: listing.insuranceFee,
    });

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: seed.bookingNumber,
        listingId: listing.id,
        ownerId: listing.ownerProfileId,
        renterId: seed.renter.renterProfile!.id,
        startDate: seed.startDate,
        endDate: seed.endDate,
        durationMonths: seed.durationMonths,
        monthlyPrice: charges.monthlyPrice,
        securityDeposit: charges.securityDeposit,
        insuranceFee: charges.insuranceFee,
        platformCommission: charges.platformCommission,
        ownerAmount: charges.ownerAmount,
        totalMonthlyAmount: charges.totalMonthlyAmount,
        renterNote: seed.renterNote,
        ownerNote: seed.ownerNote,
        status: seed.status,
        approvedAt: seed.approvedAt,
        rejectedAt: seed.rejectedAt,
        cancelledAt: seed.cancelledAt,
        completedAt: seed.completedAt,
      },
    });

    bookingsByNumber.set(seed.bookingNumber, {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      listingId: booking.listingId,
      ownerId: booking.ownerId,
      renterId: booking.renterId,
      status: booking.status,
      monthlyPrice: booking.monthlyPrice,
      securityDeposit: booking.securityDeposit,
      insuranceFee: booking.insuranceFee,
      platformCommission: booking.platformCommission,
      ownerAmount: booking.ownerAmount,
      totalMonthlyAmount: booking.totalMonthlyAmount,
    });
  }

  return bookingsByNumber;
}

async function seedPaymentsAndInvoices(params: {
  bookingsByNumber: Map<string, SeededBooking>;
}) {
  const now = new Date();
  const invoicesByBookingNumber = new Map<string, { invoiceId: string; paymentId: string | null }>();

  type PaymentSeed = {
    bookingNumber: string;
    status: PaymentStatus;
    createdAt: Date;
    paidAt?: Date;
    failedAt?: Date;
    stripeCheckoutSessionId: string;
    stripePaymentIntentId: string | null;
    stripeCustomerId: string;
    stripeChargeId: string | null;
  };

  const paymentSeeds: PaymentSeed[] = [
    {
      bookingNumber: "BK-DEMO-002",
      status: PaymentStatus.PENDING,
      createdAt: addDays(now, -7),
      stripeCheckoutSessionId: "cs_demo_pending_bk_demo_002",
      stripePaymentIntentId: null,
      stripeCustomerId: "cus_demo_pending_owner1",
      stripeChargeId: null,
    },
    {
      bookingNumber: "BK-DEMO-003",
      status: PaymentStatus.PAID,
      createdAt: addDays(now, -3),
      paidAt: addDays(now, -3),
      stripeCheckoutSessionId: "cs_demo_paid_bk_demo_003",
      stripePaymentIntentId: "pi_demo_paid_bk_demo_003",
      stripeCustomerId: "cus_demo_paid_bk_demo_003",
      stripeChargeId: "ch_demo_paid_bk_demo_003",
    },
    {
      bookingNumber: "BK-DEMO-004",
      status: PaymentStatus.FAILED,
      createdAt: addDays(now, -24),
      failedAt: addDays(now, -23),
      stripeCheckoutSessionId: "cs_demo_failed_bk_demo_004",
      stripePaymentIntentId: "pi_demo_failed_bk_demo_004",
      stripeCustomerId: "cus_demo_failed_bk_demo_004",
      stripeChargeId: null,
    },
    {
      bookingNumber: "BK-DEMO-005",
      status: PaymentStatus.CANCELLED,
      createdAt: addDays(now, -4),
      stripeCheckoutSessionId: "cs_demo_cancelled_bk_demo_005",
      stripePaymentIntentId: "pi_demo_cancelled_bk_demo_005",
      stripeCustomerId: "cus_demo_cancelled_bk_demo_005",
      stripeChargeId: null,
    },
    {
      bookingNumber: "BK-DEMO-006",
      status: PaymentStatus.PAID,
      createdAt: addMonths(now, -2),
      paidAt: addMonths(now, -2),
      stripeCheckoutSessionId: "cs_demo_paid_bk_demo_006",
      stripePaymentIntentId: "pi_demo_paid_bk_demo_006",
      stripeCustomerId: "cus_demo_paid_bk_demo_006",
      stripeChargeId: "ch_demo_paid_bk_demo_006",
    },
    {
      bookingNumber: "BK-DEMO-007",
      status: PaymentStatus.PENDING,
      createdAt: addDays(now, -1),
      stripeCheckoutSessionId: "cs_demo_pending_bk_demo_007",
      stripePaymentIntentId: null,
      stripeCustomerId: "cus_demo_pending_bk_demo_007",
      stripeChargeId: null,
    },
  ] as const;

  for (const seed of paymentSeeds) {
    const booking = params.bookingsByNumber.get(seed.bookingNumber);
    if (!booking) {
      throw new Error(`Missing booking for payment seed ${seed.bookingNumber}.`);
    }

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripeCheckoutSessionId: seed.stripeCheckoutSessionId,
        stripePaymentIntentId: seed.stripePaymentIntentId,
        stripeCustomerId: seed.stripeCustomerId,
        stripeChargeId: seed.stripeChargeId,
        amount: booking.totalMonthlyAmount,
        currency: "eur",
        platformCommission: booking.platformCommission,
        ownerAmount: booking.ownerAmount,
        status: seed.status,
        paidAt: seed.paidAt ?? null,
        failedAt: seed.failedAt ?? null,
        createdAt: seed.createdAt,
      },
    });
  }

  type InvoiceSeed = {
    bookingNumber: string;
    status: InvoiceStatus;
    issuedAt: Date;
    dueAt: Date;
    paidAt?: Date;
    cancelledAt?: Date;
  };

  const invoiceSeeds: InvoiceSeed[] = [
    {
      bookingNumber: "BK-DEMO-002",
      status: InvoiceStatus.ISSUED,
      issuedAt: addDays(now, -7),
      dueAt: addDays(now, 7),
    },
    {
      bookingNumber: "BK-DEMO-003",
      status: InvoiceStatus.PAID,
      issuedAt: addDays(now, -8),
      dueAt: addDays(now, 6),
      paidAt: addDays(now, -3),
    },
    {
      bookingNumber: "BK-DEMO-004",
      status: InvoiceStatus.OVERDUE,
      issuedAt: addDays(now, -30),
      dueAt: addDays(now, -10),
    },
    {
      bookingNumber: "BK-DEMO-005",
      status: InvoiceStatus.CANCELLED,
      issuedAt: addDays(now, -12),
      dueAt: addDays(now, -2),
      cancelledAt: addDays(now, -3),
    },
    {
      bookingNumber: "BK-DEMO-006",
      status: InvoiceStatus.PAID,
      issuedAt: addMonths(now, -2),
      dueAt: addMonths(now, -2),
      paidAt: addMonths(now, -2),
    },
    {
      bookingNumber: "BK-DEMO-007",
      status: InvoiceStatus.ISSUED,
      issuedAt: addDays(now, -1),
      dueAt: addDays(now, 13),
    },
  ] as const;

  for (const seed of invoiceSeeds) {
    const booking = params.bookingsByNumber.get(seed.bookingNumber);
    if (!booking) {
      throw new Error(`Missing booking for invoice seed ${seed.bookingNumber}.`);
    }

    const invoice = await generateInvoiceForBooking({
      bookingId: booking.id,
      status: seed.status,
    });

    if (!invoice) {
      throw new Error(`Invoice generation failed for ${seed.bookingNumber}.`);
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: seed.status,
        issuedAt: seed.issuedAt,
        dueAt: seed.dueAt,
        paidAt: seed.paidAt ?? null,
        cancelledAt: seed.cancelledAt ?? null,
        timeline: [
          {
            key: "generated",
            label: "Generated",
            at: seed.issuedAt.toISOString(),
            active: true,
          },
          {
            key: "issued",
            label: "Issued",
            at: seed.issuedAt.toISOString(),
            active: true,
          },
          {
            key: "due",
            label: "Due",
            at: seed.dueAt.toISOString(),
            active: true,
          },
          {
            key: "paid",
            label: "Paid",
            at: seed.paidAt?.toISOString() ?? null,
            active: seed.status === InvoiceStatus.PAID,
          },
          {
            key: "cancelled",
            label: "Cancelled",
            at: seed.cancelledAt?.toISOString() ?? null,
            active: seed.status === InvoiceStatus.CANCELLED,
          },
        ],
      },
    });

    const latestPayment = await prisma.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    invoicesByBookingNumber.set(seed.bookingNumber, {
      invoiceId: invoice.id,
      paymentId: latestPayment?.id ?? null,
    });
  }

  return invoicesByBookingNumber;
}

async function finalizeGeneratedContractFile(params: {
  bookingNumber: string;
  generatedContractId: string;
  currentRelativePath: string;
}) {
  const targetFileName = demoFileName(params.bookingNumber);
  const sourcePath = path.resolve(process.cwd(), params.currentRelativePath);
  const targetRelativePath = path.posix.join("docs", "generated", targetFileName);
  const targetPath = path.resolve(process.cwd(), targetRelativePath);

  await fs.rm(targetPath, { force: true });
  await fs.rename(sourcePath, targetPath);

  await prisma.generatedContract.update({
    where: { id: params.generatedContractId },
    data: {
      generatedFilePath: targetRelativePath,
      generatedFileName: targetFileName,
    },
  });

  return {
    generatedFilePath: targetRelativePath,
    generatedFileName: targetFileName,
  };
}

async function seedContracts(params: {
  bookingsByNumber: Map<string, SeededBooking>;
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  renter1: Awaited<ReturnType<typeof seedUsers>>["renter1"];
  renter2: Awaited<ReturnType<typeof seedUsers>>["renter2"];
}) {
  const contractSeeds = [
    {
      bookingNumber: "BK-DEMO-002",
      status: ContractStatus.SENT_FOR_SIGNATURE,
      manualContractStatus: ContractStatus.SENT_FOR_SIGNATURE,
      signerSetup: "none" as const,
    },
    {
      bookingNumber: "BK-DEMO-003",
      status: ContractStatus.SIGNED,
      manualContractStatus: ContractStatus.SIGNED,
      signerSetup: "both" as const,
    },
    {
      bookingNumber: "BK-DEMO-004",
      status: ContractStatus.GENERATED,
      manualContractStatus: ContractStatus.GENERATED,
      signerSetup: "none" as const,
    },
    {
      bookingNumber: "BK-DEMO-006",
      status: ContractStatus.PARTIALLY_SIGNED,
      manualContractStatus: ContractStatus.PARTIALLY_SIGNED,
      signerSetup: "renter" as const,
    },
  ] as const;

  for (const seed of contractSeeds) {
    const booking = params.bookingsByNumber.get(seed.bookingNumber);
    if (!booking) {
      throw new Error(`Missing booking for contract seed ${seed.bookingNumber}.`);
    }

    const generated = await generateContractForBooking({
      bookingId: booking.id,
    });

    if (!generated) {
      throw new Error(`Contract generation failed for ${seed.bookingNumber}.`);
    }

    const generatedRecord = await prisma.generatedContract.findUnique({
      where: { bookingId: booking.id },
      select: {
        id: true,
        bookingId: true,
        templateId: true,
        contractType: true,
        status: true,
        generatedFilePath: true,
        generatedFileName: true,
        contractData: true,
      },
    });

    if (!generatedRecord) {
      throw new Error(`Generated contract record missing for ${seed.bookingNumber}.`);
    }

    const finalizedFile = await finalizeGeneratedContractFile({
      bookingNumber: seed.bookingNumber,
      generatedContractId: generatedRecord.id,
      currentRelativePath: generatedRecord.generatedFilePath,
    });

    await prisma.generatedContract.update({
      where: { id: generatedRecord.id },
      data: {
        status: seed.status,
      },
    });

    const contractNumber = `CT-DEMO-${seed.bookingNumber.slice(-3)}`;
    const now = new Date();
    const signedAt = seed.manualContractStatus === ContractStatus.SIGNED ? now : null;
    const ownerSignedAt = seed.signerSetup === "both" ? addDays(now, -1) : null;
    const renterSignedAt = seed.signerSetup === "both" || seed.signerSetup === "renter" ? now : null;
    const contractData =
      generatedRecord.contractData === null
        ? undefined
        : (generatedRecord.contractData as Prisma.InputJsonValue);

    const manualContract = await prisma.contract.create({
      data: {
        contractNumber,
        bookingId: booking.id,
        templateId: generatedRecord.templateId,
        ownerId: booking.ownerId,
        renterId: booking.renterId,
        type: generatedRecord.contractType,
        status: seed.manualContractStatus,
        generatedPdfUrl: finalizedFile.generatedFilePath,
        signedPdfUrl: seed.manualContractStatus === ContractStatus.SIGNED ? finalizedFile.generatedFilePath : null,
        contractData,
        timeline: [
          {
            key: "generated",
            label: "Generated",
            at: now.toISOString(),
            active: true,
          },
          {
            key: "sent",
            label: "Sent",
            at: now.toISOString(),
            active: true,
          },
          {
            key: "signed",
            label: "Signed",
            at: seed.manualContractStatus === ContractStatus.SIGNED ? now.toISOString() : null,
            active: seed.manualContractStatus === ContractStatus.SIGNED,
          },
        ],
        sentAt: now,
        ownerSignedAt,
        renterSignedAt,
        fullySignedAt: signedAt,
        cancelledAt: null,
      },
    });

    if (seed.signerSetup === "both") {
      await prisma.contractSignature.createMany({
        data: [
          {
            contractId: manualContract.id,
            signerUserId: params.owner1.id,
            party: "OWNER",
            signatureText: "Amine Morel",
            ipAddress: "127.0.0.1",
            userAgent: "Seed script",
          },
          {
            contractId: manualContract.id,
            signerUserId: params.renter1.id,
            party: "RENTER",
            signatureText: "Karim Diallo",
            ipAddress: "127.0.0.1",
            userAgent: "Seed script",
          },
        ],
      });
    }

    if (seed.signerSetup === "renter") {
      await prisma.contractSignature.create({
        data: {
          contractId: manualContract.id,
          signerUserId: params.renter2.id,
          party: "RENTER",
          signatureText: "Nadia El Amrani",
          ipAddress: "127.0.0.1",
          userAgent: "Seed script",
        },
      });
    }
  }
}

async function seedConversations(params: {
  bookingsByNumber: Map<string, SeededBooking>;
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
  renter1: Awaited<ReturnType<typeof seedUsers>>["renter1"];
  renter2: Awaited<ReturnType<typeof seedUsers>>["renter2"];
}) {
  const convoA = await startOrGetConversation({
    viewerId: params.renter2.id,
    viewerRole: UserRole.RENTER,
    bookingId: params.bookingsByNumber.get("BK-DEMO-002")?.id ?? null,
  });

  if (isSeedError(convoA)) {
    throw new Error(convoA.error);
  }
  const convoASuccess = convoA as { id: string };

  const convoB = await startOrGetConversation({
    viewerId: params.renter1.id,
    viewerRole: UserRole.RENTER,
    bookingId: params.bookingsByNumber.get("BK-DEMO-003")?.id ?? null,
  });

  if (isSeedError(convoB)) {
    throw new Error(convoB.error);
  }
  const convoBSuccess = convoB as { id: string };

  const seededAt = new Date();
  const conversationAId = convoASuccess.id;
  const conversationBId = convoBSuccess.id;

  const a1 = await createConversationMessage({
    conversationId: conversationAId,
    senderId: params.renter2.id,
    body: "Hi, is the locker accessible on weekends and does it have 24/7 entry?",
  });
  if (isSeedError(a1)) throw new Error(a1.error);

  const a2 = await createConversationMessage({
    conversationId: conversationAId,
    senderId: params.owner1.id,
    body: "Yes, weekends are fine and the unit has 24/7 access with camera coverage.",
  });
  if (isSeedError(a2)) throw new Error(a2.error);

  const a3 = await createConversationMessage({
    conversationId: conversationAId,
    senderId: params.renter2.id,
    body: "Perfect. I’ll confirm the move-in date once payment is processed.",
  });
  if (isSeedError(a3)) throw new Error(a3.error);

  const b1 = await createConversationMessage({
    conversationId: conversationBId,
    senderId: params.renter1.id,
    body: "Can you confirm the long-term access window for the wine cellar unit?",
  });
  if (isSeedError(b1)) throw new Error(b1.error);

  const b2 = await createConversationMessage({
    conversationId: conversationBId,
    senderId: params.owner2.id,
    body: "Absolutely. Access is flexible, and I can share the gate code after approval.",
  });
  if (isSeedError(b2)) throw new Error(b2.error);

  await prisma.message.updateMany({
    where: { id: { in: [a1.message.id, a2.message.id, b2.message.id] } },
    data: {
      readAt: seededAt,
    },
  });

  await prisma.message.updateMany({
    where: { id: { in: [a3.message.id, b1.message.id] } },
    data: {
      readAt: null,
    },
  });
}

async function seedVerificationDocuments(params: {
  adminId: string;
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
  renter1: Awaited<ReturnType<typeof seedUsers>>["renter1"];
}) {
  const docs = [
    {
      userId: params.owner1.id,
      type: DocumentType.ID_CARD,
      fileUrl: PLACEHOLDER_IMAGE,
      fileName: "owner1-id-card.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024,
      status: VerificationStatus.APPROVED,
      rejectionReason: null,
      reviewedById: params.adminId,
      reviewedAt: addDays(new Date(), -12),
    },
    {
      userId: params.owner1.id,
      type: DocumentType.PROOF_OF_OWNERSHIP,
      fileUrl: PLACEHOLDER_IMAGE,
      fileName: "owner1-proof-ownership.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 1190,
      status: VerificationStatus.APPROVED,
      rejectionReason: null,
      reviewedById: params.adminId,
      reviewedAt: addDays(new Date(), -11),
    },
    {
      userId: params.owner2.id,
      type: DocumentType.ID_CARD,
      fileUrl: PLACEHOLDER_IMAGE,
      fileName: "owner2-id-card.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 1090,
      status: VerificationStatus.PENDING,
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    },
    {
      userId: params.owner2.id,
      type: DocumentType.PROOF_OF_OWNERSHIP,
      fileUrl: PLACEHOLDER_IMAGE,
      fileName: "owner2-proof-ownership.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 1115,
      status: VerificationStatus.REJECTED,
      rejectionReason: "Proof image was too blurry to verify.",
      reviewedById: params.adminId,
      reviewedAt: addDays(new Date(), -5),
    },
    {
      userId: params.renter1.id,
      type: DocumentType.ID_CARD,
      fileUrl: PLACEHOLDER_IMAGE,
      fileName: "renter1-id-card.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 1002,
      status: VerificationStatus.APPROVED,
      rejectionReason: null,
      reviewedById: params.adminId,
      reviewedAt: addDays(new Date(), -9),
    },
  ] as const;

  for (const doc of docs) {
    await prisma.verificationDocument.create({
      data: {
        userId: doc.userId,
        type: doc.type,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        status: doc.status,
        rejectionReason: doc.rejectionReason,
        reviewedById: doc.reviewedById,
        reviewedAt: doc.reviewedAt,
      },
    });
  }
}

async function updateOwnerBalances(params: {
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
}) {
  const paidPayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      booking: {
        ownerId: {
          in: [params.owner1.ownerProfile!.id, params.owner2.ownerProfile!.id],
        },
      },
    },
    select: {
      ownerAmount: true,
      paidAt: true,
      createdAt: true,
      booking: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);

  const owner1Payments = paidPayments.filter((payment) => payment.booking.ownerId === params.owner1.ownerProfile!.id);
  const owner2Payments = paidPayments.filter((payment) => payment.booking.ownerId === params.owner2.ownerProfile!.id);

  const sumOwnerAmount = (payments: typeof paidPayments) =>
    payments.reduce((sum, payment) => sum + Number(payment.ownerAmount), 0);

  const currentMonthPayout = (payments: typeof paidPayments) =>
    payments.reduce((sum, payment) => {
      const reference = payment.paidAt ?? payment.createdAt;
      if (reference < monthStart || reference >= nextMonthStart) {
        return sum;
      }

      return sum + Number(payment.ownerAmount);
    }, 0);

  await prisma.ownerProfile.update({
    where: { id: params.owner1.ownerProfile!.id },
    data: {
      walletBalance: decimal(sumOwnerAmount(owner1Payments)),
      pendingPayout: decimal(currentMonthPayout(owner1Payments)),
      totalEarnings: decimal(sumOwnerAmount(owner1Payments)),
    },
  });

  await prisma.ownerProfile.update({
    where: { id: params.owner2.ownerProfile!.id },
    data: {
      walletBalance: decimal(sumOwnerAmount(owner2Payments)),
      pendingPayout: decimal(currentMonthPayout(owner2Payments)),
      totalEarnings: decimal(sumOwnerAmount(owner2Payments)),
    },
  });
}

async function seedAdminLogs(params: {
  adminId: string;
  listingsBySlug: Map<string, SeededListing>;
  invoicesByBookingNumber: Map<string, { invoiceId: string; paymentId: string | null }>;
  owner1: Awaited<ReturnType<typeof seedUsers>>["owner1"];
  owner2: Awaited<ReturnType<typeof seedUsers>>["owner2"];
}) {
  const listingApproved = params.listingsBySlug.get("rive-gauche-archive-loft");
  const listingRejected = params.listingsBySlug.get("nice-old-town-cold-room");
  const invoiceIssued = params.invoicesByBookingNumber.get("BK-DEMO-002");

  if (!listingApproved || !listingRejected || !invoiceIssued) {
    throw new Error("Missing seeded entities for admin logs.");
  }

  await prisma.adminLog.createMany({
    data: [
      {
        adminId: params.adminId,
        targetUserId: params.owner1.id,
        entityType: AdminEntityType.LISTING,
        entityId: listingApproved.id,
        action: "LISTING_APPROVED",
        details: {
          entityName: listingApproved.title,
          title: listingApproved.title,
          statusLabel: "Approved",
        },
      },
      {
        adminId: params.adminId,
        targetUserId: params.owner2.id,
        entityType: AdminEntityType.LISTING,
        entityId: listingRejected.id,
        action: "LISTING_REJECTED",
        details: {
          entityName: listingRejected.title,
          title: listingRejected.title,
          statusLabel: "Rejected",
          reason: "Unit photographs did not meet the marketplace standard.",
        },
      },
      {
        adminId: params.adminId,
        targetUserId: params.owner1.id,
        entityType: AdminEntityType.VERIFICATION_DOCUMENT,
        entityId: `demo-owner1-verification`,
        action: "VERIFICATION_DOCUMENT_APPROVED",
        details: {
          entityName: "Owner 1 ID Card",
          fileName: "owner1-id-card.svg",
          statusLabel: "Approved",
        },
      },
      {
        adminId: params.adminId,
        targetUserId: params.owner2.id,
        entityType: AdminEntityType.VERIFICATION_DOCUMENT,
        entityId: `demo-owner2-verification`,
        action: "VERIFICATION_DOCUMENT_REJECTED",
        details: {
          entityName: "Owner 2 Proof of Ownership",
          fileName: "owner2-proof-ownership.svg",
          statusLabel: "Rejected",
          reason: "Proof image was too blurry to verify.",
        },
      },
      {
        adminId: params.adminId,
        entityType: AdminEntityType.INVOICE,
        entityId: invoiceIssued.invoiceId,
        action: "SYSTEM_GENERATED_INVOICE",
        details: {
          entityName: "Invoice issued for booking BK-DEMO-002",
          invoiceNumber: "demo-issued",
          bookingNumber: "BK-DEMO-002",
          statusLabel: "Issued",
        },
      },
    ],
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  await ensureDemoGeneratedFolder();
  await cleanupDemoGeneratedFiles();

  const users = await seedUsers();
  const referenceData = await seedReferenceData();
  const listingsBySlug = await seedListings({
    owner1: users.owner1,
    owner2: users.owner2,
    amenitiesByName: referenceData.amenitiesByName,
  });
  const bookingsByNumber = await seedBookings({
    listingsBySlug,
    owner1: users.owner1,
    owner2: users.owner2,
    renter1: users.renter1,
    renter2: users.renter2,
  });
  const invoicesByBookingNumber = await seedPaymentsAndInvoices({
    bookingsByNumber,
  });

  await seedContracts({
    bookingsByNumber,
    owner1: users.owner1,
    renter1: users.renter1,
    renter2: users.renter2,
  });

  await seedConversations({
    bookingsByNumber,
    owner1: users.owner1,
    owner2: users.owner2,
    renter1: users.renter1,
    renter2: users.renter2,
  });

  await seedVerificationDocuments({
    adminId: users.admin.id,
    owner1: users.owner1,
    owner2: users.owner2,
    renter1: users.renter1,
  });

  await updateOwnerBalances({
    owner1: users.owner1,
    owner2: users.owner2,
  });

  await seedAdminLogs({
    adminId: users.admin.id,
    listingsBySlug,
    invoicesByBookingNumber,
    owner1: users.owner1,
    owner2: users.owner2,
  });

  console.log("Demo seed completed successfully.");
  console.log("Accounts created:");
  console.log("- admin@getyourcave.com / Password123!");
  console.log("- owner1@getyourcave.com / Password123!");
  console.log("- owner2@getyourcave.com / Password123!");
  console.log("- renter1@getyourcave.com / Password123!");
  console.log("- renter2@getyourcave.com / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
