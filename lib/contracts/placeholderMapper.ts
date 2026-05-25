import { ContractType, Prisma } from "@prisma/client";

import { getContractTypeLabel } from "@/lib/contracts/contractTypes";
import { defaultLocale, type Locale } from "@/lib/i18n";

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

function formatDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatMoney(
  value: number | string | Prisma.Decimal | null | undefined,
  locale: Locale,
) {
  const amount =
    value instanceof Prisma.Decimal
      ? value
      : new Prisma.Decimal(value ?? 0);

  return locale === "fr" ? amount.toFixed(2).replace(".", ",") : amount.toFixed(2);
}

function buildAddress(parts: Array<string | null | undefined>, locale: Locale) {
  const filtered = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (!filtered.length) {
    return locale === "fr" ? "À compléter" : "To complete";
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
  locale?: Locale;
}) {
  const locale = params.locale ?? defaultLocale;
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
    contract_type_label: getContractTypeLabel(contractType, locale),
    today_date: formatDate(new Date(), locale),
    start_date: formatDate(startDate, locale),
    end_date: formatDate(endDate, locale),
    duration_months: String(durationMonths),
    duration_weeks: String(durationWeeks),
    owner_name: ownerUser.fullName,
    owner_email: ownerUser.email,
    owner_phone: ownerUser.phone ?? (locale === "fr" ? "À compléter" : "To complete"),
    owner_address: buildAddress(
      [
        ownerProfile.address,
        ownerProfile.postalCode,
        ownerProfile.city,
        ownerProfile.country,
      ],
      locale,
    ),
    renter_name: renterUser.fullName,
    renter_email: renterUser.email,
    renter_phone: renterUser.phone ?? (locale === "fr" ? "À compléter" : "To complete"),
    renter_address: buildAddress(
      [
        renterProfile.address,
        renterProfile.postalCode,
        renterProfile.city,
        renterProfile.country,
      ],
      locale,
    ),
    listing_name: listing.title,
    listing_address: buildAddress(
      [listing.address, listing.postalCode, listing.city, listing.country],
      locale,
    ),
    listing_city: listing.city,
    listing_postal_code: listing.postalCode ?? (locale === "fr" ? "À compléter" : "To complete"),
    listing_storage_type: listing.storageType,
    monthly_price: formatMoney(booking.monthlyPrice, locale),
    security_deposit: formatMoney(booking.securityDeposit, locale),
    deposit_amount: formatMoney(booking.securityDeposit, locale),
    insurance_fee: formatMoney(booking.insuranceFee, locale),
    platform_commission: formatMoney(booking.platformCommission, locale),
    owner_amount: formatMoney(booking.ownerAmount, locale),
    total_monthly_amount: formatMoney(booking.totalMonthlyAmount, locale),
    owner_listing_owner_name: listingOwnerUser.fullName,
    owner_listing_owner_email: listingOwnerUser.email,
    platform_company_name: "GetYourCave",
    platform_rcs_city: resolveEnvValue("GYC_LEGAL_RCS_CITY", "Paris"),
    platform_siret: resolveEnvValue("GYC_LEGAL_SIRET", locale === "fr" ? "À compléter" : "To complete"),
    platform_address: resolveEnvValue("GYC_LEGAL_ADDRESS", locale === "fr" ? "À compléter" : "To complete"),
    platform_representative: resolveEnvValue(
      "GYC_LEGAL_REPRESENTATIVE",
      locale === "fr" ? "À compléter" : "To complete",
    ),
    platform_email: resolveEnvValue(
      "GYC_LEGAL_EMAIL",
      locale === "fr" ? "contact@getyourcave.fr" : "contact@getyourcave.com",
    ),
    platform_website: resolveEnvValue(
      "GYC_LEGAL_WEBSITE",
      locale === "fr" ? "www.getyourcave.fr" : "www.getyourcave.com",
    ),
    platform_commission_rate: resolveEnvValue("GYC_PLATFORM_COMMISSION_RATE", "10"),
    platform_commission_frequency: resolveEnvValue(
      "GYC_PLATFORM_COMMISSION_FREQUENCY",
      locale === "fr" ? "mensuellement" : "monthly",
    ),
    platform_commission_fixed: resolveEnvValue("GYC_PLATFORM_COMMISSION_FIXED", "0"),
    platform_duration_months: String(durationMonths),
  } satisfies ContractPlaceholderData;
}
