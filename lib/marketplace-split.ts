import { Prisma } from "@prisma/client";

export const MARKETPLACE_COMMISSION_RATE = 0.2;
export const MARKETPLACE_OWNER_SHARE_RATE = 0.8;

export function toDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }

  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
}

export function calculateMarketplaceSplit(
  grossAmount: number | string | Prisma.Decimal,
  commissionBaseAmount: number | string | Prisma.Decimal,
) {
  const amount = toDecimal(grossAmount).toDecimalPlaces(2);
  const base = toDecimal(commissionBaseAmount).toDecimalPlaces(2);
  const platformCommission = base.mul(MARKETPLACE_COMMISSION_RATE).toDecimalPlaces(2);
  const ownerAmount = amount.sub(platformCommission).toDecimalPlaces(2);

  return {
    amount,
    platformCommission,
    ownerAmount,
  };
}
