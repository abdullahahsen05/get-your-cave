import { Prisma } from "@prisma/client";

export type RevenuePoint = {
  label: string;
  value: number;
  monthStart: string;
};

type RevenuePayment = {
  amount: Prisma.Decimal | number | string;
  paidAt: Date | null;
  createdAt: Date;
};

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function getMonthBuckets(monthCount: number, referenceDate = new Date()) {
  const end = startOfMonth(referenceDate);
  const buckets: Date[] = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    buckets.push(addMonths(end, -index));
  }

  return buckets;
}

export function buildMonthlyRevenueSeries(
  payments: RevenuePayment[],
  monthCount = 6,
  referenceDate = new Date(),
): RevenuePoint[] {
  const buckets = getMonthBuckets(monthCount, referenceDate);

  return buckets.map((monthStart) => {
    const monthEnd = addMonths(monthStart, 1);
    const value = payments.reduce((sum, payment) => {
      const date = payment.paidAt ?? payment.createdAt;
      if (date < monthStart || date >= monthEnd) {
        return sum;
      }

      return sum + Number(payment.amount);
    }, 0);

    return {
      label: formatMonthLabel(monthStart),
      value,
      monthStart: monthStart.toISOString(),
    };
  });
}

export function getRevenueGrowthPercentage(points: RevenuePoint[]) {
  if (points.length < 2) {
    return 0;
  }

  const current = points[points.length - 1]?.value ?? 0;
  const previous = points[points.length - 2]?.value ?? 0;

  if (previous <= 0 && current <= 0) {
    return 0;
  }

  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

export function getNextPayoutDate(referenceDate = new Date()) {
  const currentYear = referenceDate.getUTCFullYear();
  const currentMonth = referenceDate.getUTCMonth();
  const currentDay = referenceDate.getUTCDate();

  const payoutMonth = currentDay <= 25 ? currentMonth : currentMonth + 1;
  return new Date(Date.UTC(currentYear, payoutMonth, 25));
}

export function buildRevenuePaths(
  points: RevenuePoint[],
  options?: {
    width?: number;
    height?: number;
    topPadding?: number;
    bottomPadding?: number;
  },
) {
  const width = options?.width ?? 1000;
  const height = options?.height ?? 200;
  const topPadding = options?.topPadding ?? 20;
  const bottomPadding = options?.bottomPadding ?? 20;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const chartHeight = height - topPadding - bottomPadding;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const coordinates = points.map((point, index) => {
    const x = points.length > 1 ? index * step : width / 2;
    const ratio = point.value / maxValue;
    const y = height - bottomPadding - ratio * chartHeight;

    return { x, y };
  });

  if (!coordinates.length) {
    const y = height - bottomPadding;
    const linePath = `M 0 ${y} L ${width} ${y}`;
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return { linePath, areaPath };
  }

  if (coordinates.length === 1) {
    const { x, y } = coordinates[0];
    const linePath = `M ${x} ${y}`;
    const areaPath = `${linePath} L ${width} ${y} L ${width} ${height - bottomPadding} L 0 ${height - bottomPadding} Z`;

    return { linePath, areaPath };
  }

  const lineSegments = [`M ${coordinates[0].x} ${coordinates[0].y}`];

  if (coordinates.length === 2) {
    lineSegments.push(`L ${coordinates[1].x} ${coordinates[1].y}`);
  } else {
    lineSegments.push(
      `Q ${coordinates[1].x} ${coordinates[1].y} ${(coordinates[1].x + coordinates[2].x) / 2} ${(coordinates[1].y + coordinates[2].y) / 2}`,
    );

    for (let index = 2; index < coordinates.length; index += 1) {
      const point = coordinates[index];
      lineSegments.push(`T ${point.x} ${point.y}`);
    }
  }

  const linePath = lineSegments.join(" ");
  const areaPath = `${linePath} L ${width} ${height - bottomPadding} L 0 ${height - bottomPadding} Z`;

  return { linePath, areaPath };
}

export function formatMoneyAmount(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "0.00";
  }

  const amount = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return amount.toFixed(2);
}

