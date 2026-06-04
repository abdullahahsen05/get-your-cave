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
  /**
   * billingPeriods controls how many months this invoice covers.
   * For a payable invoice (stored in DB / sent to Stripe), always pass 1.
   * Stripe subscription duration is controlled separately via cancel_at metadata,
   * not by multiplying the invoice amount.
   * Pass a value > 1 only for display-only contract-total estimates.
   */
  billingPeriods?: number | null;
};

export function calculateInvoiceCharges(input: InvoiceChargeInput) {
  const periods = Math.max(1, Math.round(input.billingPeriods ?? 1));

  const monthlyPrice    = toDecimal(input.monthlyPrice).toDecimalPlaces(2);
  const insuranceFee    = toDecimal(input.insuranceFee ?? 0).toDecimalPlaces(2);
  const securityDeposit = toDecimal(input.securityDeposit ?? 0).toDecimalPlaces(2);
  const platformFee     = toDecimal(input.platformCommission ?? 0).toDecimalPlaces(2);
  const taxes           = toDecimal(input.taxAmount ?? 0).toDecimalPlaces(2);

  // Recurring charges scale with billing periods; security deposit is one-time.
  const totalRent      = monthlyPrice.mul(periods).toDecimalPlaces(2);
  const totalInsurance = insuranceFee.mul(periods).toDecimalPlaces(2);
  const totalPlatform  = platformFee.mul(periods).toDecimalPlaces(2);
  const totalTaxes     = taxes.mul(periods).toDecimalPlaces(2);

  const subtotal   = totalRent.add(totalInsurance).add(securityDeposit).toDecimalPlaces(2);
  const total      = subtotal.add(totalTaxes).toDecimalPlaces(2);
  const ownerAmount = totalRent.sub(totalPlatform).toDecimalPlaces(2);

  return {
    periods,
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
