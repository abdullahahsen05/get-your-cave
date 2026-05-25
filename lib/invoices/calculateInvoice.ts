import { Prisma } from "@prisma/client";

function toDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }

  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
}

export type InvoiceChargeInput = {
  monthlyPrice: number | string | Prisma.Decimal;
  insuranceFee?: number | string | Prisma.Decimal | null;
  securityDeposit?: number | string | Prisma.Decimal | null;
  platformCommission?: number | string | Prisma.Decimal | null;
  taxAmount?: number | string | Prisma.Decimal | null;
  durationMonths?: number | null;
};

export function calculateInvoiceCharges(input: InvoiceChargeInput) {
  const months = Math.max(1, Math.round(input.durationMonths ?? 1));

  const monthlyPrice    = toDecimal(input.monthlyPrice).toDecimalPlaces(2);
  const insuranceFee    = toDecimal(input.insuranceFee ?? 0).toDecimalPlaces(2);
  const securityDeposit = toDecimal(input.securityDeposit ?? 0).toDecimalPlaces(2);
  const platformFee     = toDecimal(input.platformCommission ?? 0).toDecimalPlaces(2);
  const taxes           = toDecimal(input.taxAmount ?? 0).toDecimalPlaces(2);

  // Recurring charges scale with duration; security deposit is one-time.
  const totalRent      = monthlyPrice.mul(months).toDecimalPlaces(2);
  const totalInsurance = insuranceFee.mul(months).toDecimalPlaces(2);
  const totalPlatform  = platformFee.mul(months).toDecimalPlaces(2);
  const totalTaxes     = taxes.mul(months).toDecimalPlaces(2);

  const subtotal   = totalRent.add(totalInsurance).add(securityDeposit).toDecimalPlaces(2);
  const total      = subtotal.add(totalPlatform).add(totalTaxes).toDecimalPlaces(2);
  const ownerAmount = totalRent.sub(totalPlatform).toDecimalPlaces(2);

  return {
    months,
    monthlyPrice,
    insuranceFee,
    securityDeposit,
    platformFee,
    taxes,
    totalRent,
    totalInsurance,
    totalPlatform,
    totalTaxes,
    subtotal,
    total,
    ownerAmount,
  };
}
