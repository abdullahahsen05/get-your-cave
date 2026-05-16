import { ContractType, Prisma } from "@prisma/client";

type BookingForContract = Prisma.BookingGetPayload<{
  include: {
    listing: {
      include: {
        owner: {
          include: {
            user: {
              select: {
                fullName: true;
                email: true;
                phone: true;
              };
            };
          };
        };
      };
    };
    owner: {
      include: {
        user: {
          select: {
            fullName: true;
            email: true;
            phone: true;
          };
        };
      };
    };
    renter: {
      include: {
        user: {
          select: {
            fullName: true;
            email: true;
            phone: true;
          };
        };
      };
    };
    generatedContract: {
      select: {
        contractNumber: true;
        generatedAt: true;
        status: true;
      };
    };
  };
}>;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatMoney(
  value: number | string | Prisma.Decimal | null | undefined,
) {
  const amount =
    value instanceof Prisma.Decimal
      ? value
      : new Prisma.Decimal(value ?? 0);

  return amount.toFixed(2).replace(".", ",");
}

function buildAddress(parts: Array<string | null | undefined>) {
  const filtered = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (!filtered.length) {
    return "À compléter";
  }

  return filtered.join(", ");
}

function resolveEnvValue(key: string, fallback: string) {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

export type ContractPlaceholderData = Record<string, string>;

export function buildContractPlaceholderData(params: {
  booking: BookingForContract;
  contractNumber: string;
  contractType: ContractType;
}) {
  const { booking, contractNumber, contractType } = params;
  const startDate = booking.startDate;
  const endDate = booking.endDate ?? booking.startDate;
  const durationMonths = booking.durationMonths ?? 1;
  const durationWeeks = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) ||
      Math.max(1, durationMonths * 4),
  );

  const ownerProfile = booking.owner;
  const renterProfile = booking.renter;
  const listing = booking.listing;

  const ownerUser = ownerProfile.user;
  const renterUser = renterProfile.user;
  const listingOwnerUser = listing.owner.user;

  return {
    booking_id: booking.bookingNumber,
    booking_number: booking.bookingNumber,
    contract_number: contractNumber,
    contract_type: contractType,
    contract_type_label:
      contractType === "LONG_TERM_RENTAL"
        ? "Location longue durée"
        : contractType === "SEASONAL_RENTAL"
          ? "Location saisonnière"
          : "Mise en relation",
    today_date: formatDate(new Date()),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    duration_months: String(durationMonths),
    duration_weeks: String(durationWeeks),
    owner_name: ownerUser.fullName,
    owner_email: ownerUser.email,
    owner_phone: ownerUser.phone ?? "À compléter",
    owner_address: buildAddress([
      ownerProfile.address,
      ownerProfile.postalCode,
      ownerProfile.city,
      ownerProfile.country,
    ]),
    renter_name: renterUser.fullName,
    renter_email: renterUser.email,
    renter_phone: renterUser.phone ?? "À compléter",
    renter_address: buildAddress([
      renterProfile.address,
      renterProfile.postalCode,
      renterProfile.city,
      renterProfile.country,
    ]),
    listing_name: listing.title,
    listing_address: buildAddress([
      listing.address,
      listing.postalCode,
      listing.city,
      listing.country,
    ]),
    listing_city: listing.city,
    listing_postal_code: listing.postalCode ?? "À compléter",
    listing_storage_type: listing.storageType,
    monthly_price: formatMoney(booking.monthlyPrice),
    security_deposit: formatMoney(booking.securityDeposit),
    deposit_amount: formatMoney(booking.securityDeposit),
    insurance_fee: formatMoney(booking.insuranceFee),
    platform_commission: formatMoney(booking.platformCommission),
    owner_amount: formatMoney(booking.ownerAmount),
    total_monthly_amount: formatMoney(booking.totalMonthlyAmount),
    owner_listing_owner_name: listingOwnerUser.fullName,
    owner_listing_owner_email: listingOwnerUser.email,
    platform_company_name: "GetYourCave",
    platform_rcs_city: resolveEnvValue("GYC_LEGAL_RCS_CITY", "Paris"),
    platform_siret: resolveEnvValue("GYC_LEGAL_SIRET", "À compléter"),
    platform_address: resolveEnvValue("GYC_LEGAL_ADDRESS", "À compléter"),
    platform_representative: resolveEnvValue(
      "GYC_LEGAL_REPRESENTATIVE",
      "À compléter",
    ),
    platform_email: resolveEnvValue("GYC_LEGAL_EMAIL", "contact@getyourcave.fr"),
    platform_website: resolveEnvValue("GYC_LEGAL_WEBSITE", "www.getyourcave.fr"),
    platform_commission_rate: resolveEnvValue(
      "GYC_PLATFORM_COMMISSION_RATE",
      "10",
    ),
    platform_commission_frequency: resolveEnvValue(
      "GYC_PLATFORM_COMMISSION_FREQUENCY",
      "mensuellement",
    ),
    platform_commission_fixed: resolveEnvValue(
      "GYC_PLATFORM_COMMISSION_FIXED",
      "0",
    ),
    platform_duration_months: String(durationMonths),
  } satisfies ContractPlaceholderData;
}
