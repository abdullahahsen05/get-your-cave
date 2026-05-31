export const SQUARE_FEET_TO_SQUARE_METERS = 0.09290304;

export function squareFeetToSquareMeters(value: number) {
  return value * SQUARE_FEET_TO_SQUARE_METERS;
}

export function resolveAreaInSquareMeters(
  sizeM2: number | null | undefined,
  sizeSqFt: number | null | undefined,
) {
  if (typeof sizeM2 === "number" && Number.isFinite(sizeM2) && sizeM2 > 0) {
    return sizeM2;
  }

  if (typeof sizeSqFt === "number" && Number.isFinite(sizeSqFt) && sizeSqFt > 0) {
    return squareFeetToSquareMeters(sizeSqFt);
  }

  return null;
}

export function formatSquareMeters(value: number | null | undefined, maximumFractionDigits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(value)} m²`;
}

