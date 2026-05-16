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
};

export function calculateInvoiceCharges(input: InvoiceChargeInput) {
  const monthlyPrice = toDecimal(input.monthlyPrice).toDecimalPlaces(2);
  const insuranceFee = toDecimal(input.insuranceFee ?? 0).toDecimalPlaces(2);
  const securityDeposit = toDecimal(input.securityDeposit ?? 0).toDecimalPlaces(2);
  const platformFee = toDecimal(input.platformCommission ?? 0).toDecimalPlaces(2);
  const taxes = toDecimal(input.taxAmount ?? 0).toDecimalPlaces(2);

  const subtotal = monthlyPrice.add(insuranceFee).add(securityDeposit).toDecimalPlaces(2);
  const total = subtotal.add(platformFee).add(taxes).toDecimalPlaces(2);
  const ownerAmount = monthlyPrice.sub(platformFee).toDecimalPlaces(2);

  return {
    monthlyPrice,
    insuranceFee,
    securityDeposit,
    platformFee,
    taxes,
    subtotal,
    total,
    ownerAmount,
  };
}
