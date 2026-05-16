export function formatCurrency(
  value: number | string | null | undefined,
  currency = "USD",
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
