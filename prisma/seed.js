/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const {
  AccountStatus,
  DocumentType,
  PrismaClient,
  Prisma,
  VerificationStatus,
  ListingStatus,
  StorageType,
  ListingAvailability,
  BookingStatus,
} = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const pg = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const pool = new pg.Pool({
  connectionString,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const seedUploadDir = path.join(
  process.cwd(),
  "public",
  "uploads",
  "verification-documents",
);

const ownerEmail = "julian@getyourcave.com";
const ownerPassword = "Password123!";
const adminEmail = "admin@getyourcave.com";
const adminPassword = "Password123!";
const seedOwnerEmail = "seed-owner@getyourcave.com";
const seedOwnerPassword = "Password123!";
const seedRenterEmail = "seed-renter@getyourcave.com";
const seedRenterPassword = "Password123!";

const seedOwnerVerificationFileName = "seed-owner-id.png";
const seedOwnerVerificationPath = path.join(
  seedUploadDir,
  seedOwnerVerificationFileName,
);

function ensureSeedFile(filePath, base64Content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
  }
}

const amenitySeeds = [
  { name: "Security Camera", icon: "videocam" },
  { name: "24/7 Access", icon: "schedule" },
  { name: "Climate Control", icon: "ac_unit" },
  { name: "Private Entry", icon: "key" },
  { name: "Gated", icon: "fence" },
  { name: "Loading Dock", icon: "local_shipping" },
  { name: "CCTV", icon: "videocam" },
  { name: "Biometric Access", icon: "verified_user" },
];

const listings = [
  {
    slug: "the-emerald-vault-lower-manhattan",
    title: "The Emerald Vault - Lower Manhattan",
    description:
      "Located in the heart of Chelsea's gallery district, The Emerald Vault offers a sanctuary for high-value items, from fine art collections to vintage furniture and sensitive tech equipment.",
    storageType: StorageType.WAREHOUSE,
    city: "Chelsea, New York City",
    address: "24 W 24th St, New York, NY",
    postalCode: "10010",
    sizeSqFt: 120,
    pricePerMonth: "240.00",
    ratingAverage: 4.98,
    ratingCount: 124,
    isFeatured: true,
    amenities: ["Security Camera", "Climate Control", "Private Entry"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDvOaq7w-wrMJTbpSflULdtVljsC7lPIQ-P_cOGDlmvmn0F-KWt9QJDgMY8isuu3BzCGvHS3nINmRP-Wvd8C1S_jiKBCjYKxBSsg_nT985iIqaWJtZBX8MfXpKuEH83_BwQ5_WDWF8TcFhxkNjkDvdsfVEswUa3UYhsBccvvVjdnTCrvWGroYVu7XP_80UhZeqyn-4PwcKaXRcdgsA5hRCXS5zHXdeEsTCxikgslZt5O34mV1ubp1lCQClnEWiFqErOPzBgTuxqDlA",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDSFxERFxhCmvO_5DTcAE5yQr23z_XbX0R3Q3goZVT1D22dI5oktXZ3KYJOKlZwqDDIGJEk9jBt6WQtru4X4NUJcdHanvzmh1eGfvwg9fYB7TETbzlKlB-8F5YyV1M0ARPjm4CV5qAYXd46udsHMAVd4xvhHTDEjOiPJgCE-QYoAA_olEzXmDLmDx8VytGJ9QTSpfF5XdSyas_b3SDxxlgFRgbhw7xCF-PTUmllJdHApXhurbTQjmjT84e2DZ0PN0IJ2gAbuqNLgeg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBw7OtqXpeeS7Za_AX9FXVKblgSXKm4uvwdDjzks-eCoSk8sdjJohT8ZSKsaEjHv74cEl62qjO-HELBOw3Ez5dkkr431O-QQY1gwQYqKjCV5Ubp9HUW-1NPrJREVeFNOGUfJHyOjfuhLs7WLszKru1tT36vD2nMULm9feAp-a2Nm1BRrcz_PGCsFgDhq_tQjtMswRpl7GZq2-MI62VLRj_LX3GacmOz-2dg1vqxkw7obM4V6qJRrW3FrXJkvdReyfjIgQ8zj0_E7HM",
    ],
  },
  {
    slug: "west-chelsea-studio",
    title: "West Chelsea Studio",
    description:
      "A climate-controlled studio cave in West Chelsea with polished concrete floors, secure access, and room for art, furniture, and seasonal inventory.",
    storageType: StorageType.GARAGE,
    city: "Chelsea, New York City",
    address: "511 W 25th St, New York, NY",
    postalCode: "10001",
    sizeSqFt: 200,
    pricePerMonth: "1850.00",
    ratingAverage: 4.91,
    ratingCount: 88,
    isFeatured: true,
    amenities: ["Security Camera", "24/7 Access", "Climate Control"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhnrtJ57vRKyPKnJ6oLkdjsp6Tu_-Fac1QsViHGr7BL6TzplQO6joQiIK7i_sLWQSwaZd6_KgaVuGSRKCA2skyJamejpIc0EDOc-xg4MnGTmLLWyE6NyxzzqD-8qs2GWXwxtCMcHgzlpaiQqMyvrzreOdFHzZONt0V9jFDrjbaGDwYkskZxVm5b0NwhnYVSwMuH6I-mw1q9wlBzTk692BeCH5m0XHr2boBicvEchpnen5GA-VpZczZoeiGnjVfO9YBDilppi3Z2M8",
    ],
  },
  {
    slug: "tribeca-vault",
    title: "Tribeca Vault",
    description:
      "A high-security Tribeca vault with monitored entry, ideal for valuable equipment and sensitive business storage.",
    storageType: StorageType.WAREHOUSE,
    city: "Tribeca, New York City",
    address: "88 Franklin St, New York, NY",
    postalCode: "10013",
    sizeSqFt: 150,
    pricePerMonth: "2430.00",
    ratingAverage: 4.87,
    ratingCount: 62,
    isFeatured: false,
    amenities: ["Biometric Access", "Security Camera", "Gated"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAPSbjfT9vcpv7TudTmagWwoCQiD3wU2U5bXiWaswxlVjs2-mIPMtTsnFHjown1Mi6bcMH22RYFClgUvEyrA01ezGeG8RJPl-Si_wUSIfB3QhCENaU195KcOGNkVQexe-tBqfVQ6gdxjQfN2I7zUDE2-NYZ5ShyOCQAy2n53glD52UHZorJNUAT00nQjti7PcLZquWqK8naw4TzCl3WdFszcrtMwYW0netXzY-bQVVJ8Dd53TEmQxAZQJ60gLPX7vCj1t3-xWqMDFw",
    ],
  },
  {
    slug: "midtown-locker",
    title: "Midtown Locker",
    description:
      "A convenient Midtown locker space with easy access for small inventories, documents, and seasonal items.",
    storageType: StorageType.ROOM,
    city: "Midtown, New York City",
    address: "220 E 42nd St, New York, NY",
    postalCode: "10017",
    sizeSqFt: 45,
    pricePerMonth: "920.00",
    ratingAverage: 4.7,
    ratingCount: 34,
    isFeatured: false,
    amenities: ["24/7 Access", "Private Entry"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7fb8InKvLc3zUDR5NGmnt7jEr0yX3_Vn364WGCdYkS7JeB3ouKzmy_vTSMNKDOBnEmFHbAN1OBsx8_Jwg2gkDVv1gPtuDshnP808GgPmjgD1aSHNOxsApyIsMyBb3EC_VvlCty7O_bNJ-hZKA8d_etiruKYkH9MMMkcwq0Gn1qrl1idHSVUUQOo5IV22GQNMBN2Wc1V3vC4RtZuKkforSnpagbLoCUTUEA5l83G-AEYGNaUIzeCgKQl5TcS5jShmj8Hq_ulWw7qE",
    ],
  },
  {
    slug: "mission-district-studio",
    title: "Mission District Studio",
    description:
      "An airy, climate-conscious studio in Mission District with dependable access for creative and business storage.",
    storageType: StorageType.GARAGE,
    city: "Mission St, SF",
    address: "1234 Valencia St, San Francisco, CA",
    postalCode: "94110",
    sizeSqFt: 85,
    pricePerMonth: "185.00",
    ratingAverage: 5.0,
    ratingCount: 56,
    isFeatured: true,
    amenities: ["Climate Control", "24/7 Access", "Security Camera"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIt43UPBLz2tRqo29v3dPp2m-WCMHLfSSPMGPV35p09S3hXFFsHiVUOsgwTd6f7q7a5W6ZiTVPyRuWN9eFDt_hcifHnoYTkdbYQGLGsCElvtU4BwwVceeme3_Ncmy8PibvBevgM7ZToBItC4kMUKeRQIvGzb07E8gd_H3a6Wp6TqbcBAWMmcvn6JVJTVR03G2vFyeudFQIRMDnxV4W96hyIOvSWR8dcjsMnQYFGmkcBUNq824x3fAkyZjpht9tR-_RPVuw6DQpFc",
    ],
  },
  {
    slug: "presidio-tech-vault",
    title: "Presidio Tech Vault",
    description:
      "A secure warehouse listing in Presidio with CCTV coverage and generous storage depth for equipment and inventory.",
    storageType: StorageType.WAREHOUSE,
    city: "Presidio, SF",
    address: "700 Mason St, San Francisco, CA",
    postalCode: "94129",
    sizeSqFt: 300,
    pricePerMonth: "410.00",
    ratingAverage: 4.8,
    ratingCount: 41,
    isFeatured: false,
    amenities: ["CCTV", "Loading Dock", "Gated"],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEMzWCKTMW9myHE10w7l7ipIN-rMkLrVcUnbwBYq2ox_sZt3uy0tPn09J1wKbn815LUaVdKfKyWW3UMBq0KDvdAL1VheQetC6yVh-o8PF0A4o9qNlKLqJ57L0aYlP8cpfbuXAquCPUDAIoXu9Heh4txqVmX5yvphIEPPjxiayU07yHfC_D8CI7CBBB1UD2na5hNtuvtmSsyvyC4moLz8IoYfKij4qgZg24GClZxmB43gCKImnlbdBeW06oOQmwKqWvaaLR194ykFQ",
    ],
  },
];

const contractTemplates = [
  {
    name: "Seasonal Rental",
    type: "SEASONAL_RENTAL",
    description: "Reusable seasonal cave rental contract template.",
    templateFileUrl: "docs/templates/GYC_Contrat_Location_Saisonniere.template.docx",
    variables: {
      placeholders: [
        "booking_id",
        "contract_number",
        "today_date",
        "owner_name",
        "renter_name",
        "listing_address",
        "start_date",
        "end_date",
        "duration_weeks",
        "monthly_price",
        "deposit_amount",
        "platform_commission_rate",
        "platform_commission_frequency",
        "platform_commission_fixed",
        "platform_duration_months",
      ],
    },
  },
  {
    name: "Long Term Rental",
    type: "LONG_TERM_RENTAL",
    description: "Reusable long-term cave rental contract template.",
    templateFileUrl: "docs/templates/GYC_Contrat_Location_Longue_Duree.template.docx",
    variables: {
      placeholders: [
        "booking_id",
        "contract_number",
        "today_date",
        "owner_name",
        "renter_name",
        "listing_address",
        "start_date",
        "duration_months",
        "monthly_price",
        "deposit_amount",
        "platform_duration_months",
      ],
    },
  },
  {
    name: "Platform Introduction",
    type: "PLATFORM_INTRODUCTION",
    description: "Reusable platform introduction contract template.",
    templateFileUrl: "docs/templates/GYC_Contrat_Mise_En_Relation.template.docx",
    variables: {
      placeholders: [
        "contract_number",
        "today_date",
        "owner_name",
        "renter_name",
        "platform_siret",
        "platform_address",
        "platform_representative",
        "platform_commission_rate",
        "platform_commission_frequency",
        "platform_commission_fixed",
      ],
    },
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash(ownerPassword, 12);

  const existingUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  const ownerUser = existingUser
    ? await prisma.user.update({
        where: { email: ownerEmail },
        data: {
          fullName: "Julian Mercer",
          passwordHash: hashedPassword,
          role: "OWNER",
          status: "ACTIVE",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAF7wUT1k9ZCAva5NgXcX8YJPvnMbhq-c6QeGKdpV3RSSiC6HlKMjzVW5v81zLTOTC-cyuM_VcCISM5sRIE88krwbGdHjZK3U1kcvpadgGhSJS0ulfN4p9sBUcPBQKZCyg9s_AVwMcoEtW07Q5fRCTpZ5MtgQC5tkYYCyJYBdAyNqpdWSENoMMXRZVaL38imcD1OTqh1q-8ylvF24Lk1NFIYfAh9vILuo2LpzpB7njG6ZSX_CfgKO5vL5mGcpFupaPmDj8fKXcNDBA",
        },
      })
    : await prisma.user.create({
        data: {
          fullName: "Julian Mercer",
          email: ownerEmail,
          passwordHash: hashedPassword,
          role: "OWNER",
          status: "ACTIVE",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAF7wUT1k9ZCAva5NgXcX8YJPvnMbhq-c6QeGKdpV3RSSiC6HlKMjzVW5v81zLTOTC-cyuM_VcCISM5sRIE88krwbGdHjZK3U1kcvpadgGhSJS0ulfN4p9sBUcPBQKZCyg9s_AVwMcoEtW07Q5fRCTpZ5MtgQC5tkYYCyJYBdAyNqpdWSENoMMXRZVaL38imcD1OTqh1q-8ylvF24Lk1NFIYfAh9vILuo2LpzpB7njG6ZSX_CfgKO5vL5mGcpFupaPmDj8fKXcNDBA",
        },
      });

  const existingOwnerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: ownerUser.id },
  });

  const ownerProfile = existingOwnerProfile
    ? await prisma.ownerProfile.update({
        where: { userId: ownerUser.id },
        data: {
          bio: "Trusted owner with a premium network of urban storage spaces.",
          city: "New York",
          postalCode: "10010",
          verificationStatus: "APPROVED",
        },
      })
    : await prisma.ownerProfile.create({
        data: {
          userId: ownerUser.id,
          bio: "Trusted owner with a premium network of urban storage spaces.",
          city: "New York",
          postalCode: "10010",
          verificationStatus: "APPROVED",
        },
      });

  for (const template of contractTemplates) {
    await prisma.contractTemplate.upsert({
      where: { type: template.type },
      update: {
        name: template.name,
        description: template.description,
        templateFileUrl: template.templateFileUrl,
        variables: template.variables,
        isActive: true,
      },
      create: {
        name: template.name,
        type: template.type,
        description: template.description,
        templateFileUrl: template.templateFileUrl,
        variables: template.variables,
        isActive: true,
      },
    });
  }

  for (const amenity of amenitySeeds) {
    const existingAmenity = await prisma.amenity.findUnique({
      where: { name: amenity.name },
    });

    if (existingAmenity) {
      await prisma.amenity.update({
        where: { name: amenity.name },
        data: { icon: amenity.icon },
      });
    } else {
      await prisma.amenity.create({
        data: amenity,
      });
    }
  }

  for (const item of listings) {
    const existingListing = await prisma.listing.findUnique({
      where: { slug: item.slug },
    });

    const listing = existingListing
      ? await prisma.listing.update({
          where: { slug: item.slug },
          data: {
            ownerId: ownerProfile.id,
            title: item.title,
            description: item.description,
            storageType: item.storageType,
            status: ListingStatus.APPROVED,
            availability: ListingAvailability.AVAILABLE,
            address: item.address,
            city: item.city,
            postalCode: item.postalCode,
            pricePerMonth: new Prisma.Decimal(item.pricePerMonth),
            sizeSqFt: item.sizeSqFt,
            ratingAverage: item.ratingAverage,
            ratingCount: item.ratingCount,
            isFeatured: item.isFeatured,
            isPublished: true,
          },
        })
      : await prisma.listing.create({
          data: {
            ownerId: ownerProfile.id,
            slug: item.slug,
            title: item.title,
            description: item.description,
            storageType: item.storageType,
            status: ListingStatus.APPROVED,
            availability: ListingAvailability.AVAILABLE,
            address: item.address,
            city: item.city,
            postalCode: item.postalCode,
            pricePerMonth: new Prisma.Decimal(item.pricePerMonth),
            sizeSqFt: item.sizeSqFt,
            ratingAverage: item.ratingAverage,
            ratingCount: item.ratingCount,
            isFeatured: item.isFeatured,
            isPublished: true,
          },
        });

    await prisma.listingImage.deleteMany({
      where: { listingId: listing.id },
    });

    await prisma.listingAmenity.deleteMany({
      where: { listingId: listing.id },
    });

    const amenityRecords = await prisma.amenity.findMany({
      where: {
        name: {
          in: item.amenities,
        },
      },
    });

    await prisma.listingImage.createMany({
      data: item.images.map((url, index) => ({
        listingId: listing.id,
        url,
        altText: item.title,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });

    await prisma.listingAmenity.createMany({
      data: amenityRecords.map((amenity) => ({
        listingId: listing.id,
        amenityId: amenity.id,
      })),
    });
  }

  const secondOwnerEmail = "sofia@getyourcave.com";
  const secondOwnerPassword = "Password123!";
  const secondOwnerHash = await bcrypt.hash(secondOwnerPassword, 12);

  const secondOwnerExisting = await prisma.user.findUnique({
    where: { email: secondOwnerEmail },
  });

  const secondOwnerUser = secondOwnerExisting
    ? await prisma.user.update({
        where: { email: secondOwnerEmail },
        data: {
          fullName: "Sofia Laurent",
          passwordHash: secondOwnerHash,
          role: "OWNER",
          status: "ACTIVE",
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      })
    : await prisma.user.create({
        data: {
          fullName: "Sofia Laurent",
          email: secondOwnerEmail,
          passwordHash: secondOwnerHash,
          role: "OWNER",
          status: "ACTIVE",
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

  const secondOwnerProfileExisting = await prisma.ownerProfile.findUnique({
    where: { userId: secondOwnerUser.id },
  });

  const secondOwnerProfile = secondOwnerProfileExisting
    ? await prisma.ownerProfile.update({
        where: { userId: secondOwnerUser.id },
        data: {
          bio: "Curator of premium climate-aware city storage spaces.",
          city: "San Francisco",
          postalCode: "94107",
          verificationStatus: "APPROVED",
        },
      })
    : await prisma.ownerProfile.create({
        data: {
          userId: secondOwnerUser.id,
          bio: "Curator of premium climate-aware city storage spaces.",
          city: "San Francisco",
          postalCode: "94107",
          verificationStatus: "APPROVED",
        },
      });

  const secondOwnerListingSlug = "soho-climate-loft";
  const secondOwnerListingExisting = await prisma.listing.findUnique({
    where: { slug: secondOwnerListingSlug },
  });

  const secondOwnerListing = secondOwnerListingExisting
    ? await prisma.listing.update({
        where: { slug: secondOwnerListingSlug },
        data: {
          ownerId: secondOwnerProfile.id,
          title: "SoHo Climate Loft",
          description:
            "A polished climate-controlled loft space in SoHo with secure entry and gentle natural light.",
          storageType: StorageType.LOFT,
          status: ListingStatus.APPROVED,
          availability: ListingAvailability.AVAILABLE,
          address: "77 Mercer St, New York, NY",
          city: "SoHo, New York City",
          postalCode: "10012",
          pricePerMonth: new Prisma.Decimal("690.00"),
          sizeSqFt: 180,
          ratingAverage: 4.95,
          ratingCount: 27,
          isFeatured: false,
          isPublished: true,
        },
      })
    : await prisma.listing.create({
        data: {
          ownerId: secondOwnerProfile.id,
          slug: secondOwnerListingSlug,
          title: "SoHo Climate Loft",
          description:
            "A polished climate-controlled loft space in SoHo with secure entry and gentle natural light.",
          storageType: StorageType.LOFT,
          status: ListingStatus.APPROVED,
          availability: ListingAvailability.AVAILABLE,
          address: "77 Mercer St, New York, NY",
          city: "SoHo, New York City",
          postalCode: "10012",
          pricePerMonth: new Prisma.Decimal("690.00"),
          sizeSqFt: 180,
          ratingAverage: 4.95,
          ratingCount: 27,
          isFeatured: false,
          isPublished: true,
        },
      });

  await prisma.listingImage.deleteMany({
    where: { listingId: secondOwnerListing.id },
  });

  await prisma.listingAmenity.deleteMany({
    where: { listingId: secondOwnerListing.id },
  });

  const secondOwnerAmenityRecords = await prisma.amenity.findMany({
    where: {
      name: {
        in: ["Climate Control", "Private Entry", "Security Camera"],
      },
    },
  });

  await prisma.listingImage.createMany({
    data: [
      {
        listingId: secondOwnerListing.id,
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhnrtJ57vRKyPKnJ6oLkdjsp6Tu_-Fac1QsViHGr7BL6TzplQO6joQiIK7i_sLWQSwaZd6_KgaVuGSRKCA2skyJamejpIc0EDOc-xg4MnGTmLLWyE6NyxzzqD-8qs2GWXwxtCMcHgzlpaiQqMyvrzreOdFHzZONt0V9jFDrjbaGDwYkskZxVm5b0NwhnYVSwMuH6I-mw1q9wlBzTk692BeCH5m0XHr2boBicvEchpnen5GA-VpZczZoeiGnjVfO9YBDilppi3Z2M8",
        altText: "SoHo Climate Loft",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
  });

  await prisma.listingAmenity.createMany({
    data: secondOwnerAmenityRecords.map((amenity) => ({
      listingId: secondOwnerListing.id,
      amenityId: amenity.id,
    })),
  });

  const conversationCount = await prisma.conversation.count();

  if (conversationCount === 0) {
    const renterEmail = "maya@getyourcave.com";
    const renterPassword = "Password123!";
    const renterHash = await bcrypt.hash(renterPassword, 12);

    const renterExisting = await prisma.user.findUnique({
      where: { email: renterEmail },
    });

    const renterUser = renterExisting
      ? await prisma.user.update({
          where: { email: renterEmail },
          data: {
            fullName: "Maya Chen",
            passwordHash: renterHash,
            role: "RENTER",
            status: "ACTIVE",
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        })
      : await prisma.user.create({
          data: {
            fullName: "Maya Chen",
            email: renterEmail,
            passwordHash: renterHash,
            role: "RENTER",
            status: "ACTIVE",
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });

    const renterProfileExisting = await prisma.renterProfile.findUnique({
      where: { userId: renterUser.id },
    });

    const renterProfile = renterProfileExisting
      ? await prisma.renterProfile.update({
          where: { userId: renterUser.id },
          data: {
            city: "New York",
            postalCode: "10001",
            verificationStatus: "APPROVED",
          },
        })
      : await prisma.renterProfile.create({
          data: {
            userId: renterUser.id,
            city: "New York",
            postalCode: "10001",
            verificationStatus: "APPROVED",
          },
        });

    const westChelseaListing = await prisma.listing.findUnique({
      where: { slug: "west-chelsea-studio" },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
      },
    });

    if (westChelseaListing) {
      const bookingNumber = "BK-WS-1001";
      const bookingExisting = await prisma.booking.findUnique({
        where: { bookingNumber },
      });

      const booking = bookingExisting
        ? await prisma.booking.update({
            where: { bookingNumber },
            data: {
              listingId: westChelseaListing.id,
              ownerId: westChelseaListing.owner.id,
              renterId: renterProfile.id,
              startDate: new Date("2024-10-15T09:00:00.000Z"),
              durationMonths: 3,
              monthlyPrice: new Prisma.Decimal("1850.00"),
              securityDeposit: new Prisma.Decimal("500.00"),
              insuranceFee: new Prisma.Decimal("25.00"),
              platformCommission: new Prisma.Decimal("185.00"),
              ownerAmount: new Prisma.Decimal("1665.00"),
              totalMonthlyAmount: new Prisma.Decimal("1875.00"),
              renterNote:
                "I need climate control for a small art archive and two large paintings.",
              status: BookingStatus.APPROVED,
              approvedAt: new Date("2024-10-15T10:00:00.000Z"),
            },
          })
        : await prisma.booking.create({
            data: {
              bookingNumber,
              listingId: westChelseaListing.id,
              ownerId: westChelseaListing.owner.id,
              renterId: renterProfile.id,
              startDate: new Date("2024-10-15T09:00:00.000Z"),
              durationMonths: 3,
              monthlyPrice: new Prisma.Decimal("1850.00"),
              securityDeposit: new Prisma.Decimal("500.00"),
              insuranceFee: new Prisma.Decimal("25.00"),
              platformCommission: new Prisma.Decimal("185.00"),
              ownerAmount: new Prisma.Decimal("1665.00"),
              totalMonthlyAmount: new Prisma.Decimal("1875.00"),
              renterNote:
                "I need climate control for a small art archive and two large paintings.",
              status: BookingStatus.APPROVED,
              approvedAt: new Date("2024-10-15T10:00:00.000Z"),
            },
          });

      const conversationExisting = await prisma.conversation.findFirst({
        where: {
          ownerUserId: westChelseaListing.owner.userId,
          renterUserId: renterUser.id,
          listingId: westChelseaListing.id,
          bookingId: booking.id,
        },
      });

      const conversation = conversationExisting
        ? await prisma.conversation.update({
            where: { id: conversationExisting.id },
            data: {
              lastMessageText:
                "The temperature control is set to a constant 21°C (70°F) with 50% relative humidity. We have backup generators to ensure no fluctuations during power events.",
              lastMessageAt: new Date("2024-10-15T12:45:00.000Z"),
            },
          })
        : await prisma.conversation.create({
            data: {
              ownerUserId: westChelseaListing.owner.userId,
              renterUserId: renterUser.id,
              listingId: westChelseaListing.id,
              bookingId: booking.id,
              lastMessageText:
                "The temperature control is set to a constant 21°C (70°F) with 50% relative humidity. We have backup generators to ensure no fluctuations during power events.",
              lastMessageAt: new Date("2024-10-15T12:45:00.000Z"),
            },
          });

      await prisma.message.deleteMany({
        where: { conversationId: conversation.id },
      });

      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            senderId: renterUser.id,
            type: "TEXT",
            body:
              "Hello! I saw your inquiry about the climate-controlled unit in West Chelsea. It's currently available and perfectly suited for fine art or vintage furniture.",
            readAt: new Date("2024-10-15T12:31:00.000Z"),
            createdAt: new Date("2024-10-15T12:30:00.000Z"),
          },
          {
            conversationId: conversation.id,
            senderId: westChelseaListing.owner.userId,
            type: "TEXT",
            body:
              "That sounds perfect. I have three large oil paintings that need consistent humidity levels. What is the exact temperature range?",
            readAt: new Date("2024-10-15T12:43:00.000Z"),
            createdAt: new Date("2024-10-15T12:42:00.000Z"),
          },
          {
            conversationId: conversation.id,
            senderId: renterUser.id,
            type: "TEXT",
            body:
              "The temperature control is set to a constant 21°C (70°F) with 50% relative humidity. We have backup generators to ensure no fluctuations during power events.",
            readAt: new Date("2024-10-15T12:46:00.000Z"),
            createdAt: new Date("2024-10-15T12:45:00.000Z"),
          },
        ],
      });
    }
  }

  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Seed Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: "Seed Admin",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const seedOwnerHash = await bcrypt.hash(seedOwnerPassword, 12);
  const seedOwnerUser = await prisma.user.upsert({
    where: { email: seedOwnerEmail },
    update: {
      fullName: "Seed Pending Owner",
      passwordHash: seedOwnerHash,
      role: "OWNER",
      status: "PENDING_VERIFICATION",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: "Seed Pending Owner",
      email: seedOwnerEmail,
      passwordHash: seedOwnerHash,
      role: "OWNER",
      status: "PENDING_VERIFICATION",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const seedOwnerProfile = await prisma.ownerProfile.upsert({
    where: { userId: seedOwnerUser.id },
    update: {
      city: "New York",
      postalCode: "10010",
      verificationStatus: "PENDING",
    },
    create: {
      userId: seedOwnerUser.id,
      city: "New York",
      postalCode: "10010",
      verificationStatus: "PENDING",
    },
  });

  ensureSeedFile(
    seedOwnerVerificationPath,
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9+7X8AAAAASUVORK5CYII=",
  );

  const seedOwnerVerificationSize = fs.statSync(seedOwnerVerificationPath).size;
  const seedOwnerVerificationUrl = `/uploads/verification-documents/${seedOwnerVerificationFileName}`;

  const seedOwnerVerificationExisting = await prisma.verificationDocument.findFirst({
    where: {
      userId: seedOwnerUser.id,
      type: DocumentType.ID_CARD,
    },
  });

  if (seedOwnerVerificationExisting) {
    await prisma.verificationDocument.update({
      where: { id: seedOwnerVerificationExisting.id },
      data: {
        fileUrl: seedOwnerVerificationUrl,
        fileName: seedOwnerVerificationFileName,
        mimeType: "image/png",
        sizeBytes: seedOwnerVerificationSize,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });
  } else {
    await prisma.verificationDocument.create({
      data: {
        userId: seedOwnerUser.id,
        type: DocumentType.ID_CARD,
        fileUrl: seedOwnerVerificationUrl,
        fileName: seedOwnerVerificationFileName,
        mimeType: "image/png",
        sizeBytes: seedOwnerVerificationSize,
        status: VerificationStatus.PENDING,
      },
    });
  }

  const seedListingSlug = "seed-admin-pending-listing";
  const seedListingData = {
    title: "Seed Pending Listing",
    description:
      "A seed listing reserved for admin moderation testing. It remains unpublished until reviewed.",
    city: "New York City",
    address: "99 Seed Street, New York, NY",
    postalCode: "10001",
    storageType: StorageType.OTHER,
    availability: ListingAvailability.AVAILABLE,
    pricePerMonth: new Prisma.Decimal("149.00"),
    securityDeposit: new Prisma.Decimal("0.00"),
    insuranceFee: new Prisma.Decimal("0.00"),
    status: ListingStatus.PENDING_APPROVAL,
    isPublished: false,
  };

  const seedListingExisting = await prisma.listing.findUnique({
    where: { slug: seedListingSlug },
  });

  if (seedListingExisting) {
    await prisma.listing.update({
      where: { slug: seedListingSlug },
      data: {
        ...seedListingData,
        ownerId: seedOwnerProfile.id,
      },
    });
  } else {
    await prisma.listing.create({
      data: {
        slug: seedListingSlug,
        ownerId: seedOwnerProfile.id,
        ...seedListingData,
      },
    });
  }

  const seedRenterHash = await bcrypt.hash(seedRenterPassword, 12);
  await prisma.user.upsert({
    where: { email: seedRenterEmail },
    update: {
      fullName: "Seed Renter",
      passwordHash: seedRenterHash,
      role: "RENTER",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: "Seed Renter",
      email: seedRenterEmail,
      passwordHash: seedRenterHash,
      role: "RENTER",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const seedRenterUser = await prisma.user.findUnique({
    where: { email: seedRenterEmail },
  });

  if (seedRenterUser) {
    await prisma.renterProfile.upsert({
      where: { userId: seedRenterUser.id },
      update: {
        city: "New York",
        postalCode: "10001",
        verificationStatus: "NOT_SUBMITTED",
      },
      create: {
        userId: seedRenterUser.id,
        city: "New York",
        postalCode: "10001",
        verificationStatus: "NOT_SUBMITTED",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
