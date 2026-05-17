"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type {
  AdminActivityPage,
  AdminDashboardResponse,
  AdminRevenuePoint,
} from "@/lib/admin-shared";

function formatCurrency(value: string | number, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeChartPoints(points: AdminRevenuePoint[], desired = 12) {
  if (!points.length) {
    return Array.from({ length: desired }, (_, index) => ({
      label: `Bucket ${index + 1}`,
      value: 0,
    }));
  }

  if (points.length <= desired) {
    return points;
  }

  const bucketSize = Math.ceil(points.length / desired);
  const result: AdminRevenuePoint[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const slice = points.slice(index, index + bucketSize);
    result.push({
      label: slice[slice.length - 1]?.label ?? `Bucket ${result.length + 1}`,
      value: slice.reduce((sum, point) => sum + point.value, 0),
    });
  }

  return result.slice(0, desired);
}

export default function AdminDashboardWorkspace() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [activity, setActivity] = useState<AdminActivityPage | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboardResponse, activityResponse] = await Promise.all([
          fetch("/api/admin/dashboard", { cache: "no-store" }),
          fetch("/api/admin/activity?page=1&limit=3", { cache: "no-store" }),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error("Unable to load admin dashboard.");
        }

        if (!activityResponse.ok) {
          throw new Error("Unable to load recent activity.");
        }

        const dashboardData = (await dashboardResponse.json()) as AdminDashboardResponse;
        const activityData = (await activityResponse.json()) as AdminActivityPage;

        if (!cancelled) {
          setDashboard(dashboardData);
          setActivity(activityData);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load admin dashboard.");
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/admin/revenue?range=${range}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load revenue analytics.");
        }

        return response.json();
      })
      .then((data: { labels: string[]; values: number[] }) => {
        if (cancelled) return;
        setDashboard((current) => {
          if (!current) return current;
          return {
            ...current,
            revenueSeries: data.labels.map((label, index) => ({
              label,
              value: data.values[index] ?? 0,
            })),
          };
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load revenue analytics.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/activity?page=${page}&limit=3&search=${encodeURIComponent(search)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load activity.");
        }

        const data = (await response.json()) as AdminActivityPage;
        setActivity(data);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load activity.");
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [page, search]);

  const chartPoints = useMemo(
    () => normalizeChartPoints(dashboard?.revenueSeries ?? [], 12),
    [dashboard?.revenueSeries],
  );

  const chartMax = Math.max(...chartPoints.map((point) => point.value), 1);
  const activityRows = activity?.rows ?? dashboard?.recentActivity ?? [];
  const totalItems = activity?.totalItems ?? activityRows.length;
  const totalPages = activity?.totalPages ?? 1;
  const statCards: Array<{
    label: string;
    icon: string;
    value: string;
    note: string;
  }> = dashboard
    ? [
        {
          label: "Total Users",
          icon: "group",
          value: formatCompactNumber(dashboard.totalUsers),
          note: `${dashboard.totalAdmins} admin accounts active`,
        },
        {
          label: "Active Listings",
          icon: "garage",
          value: formatCompactNumber(dashboard.activeListings),
          note: `${dashboard.pendingListings} pending review`,
        },
        {
          label: "Monthly Revenue",
          icon: "payments",
          value: formatCurrency(dashboard.monthlyRevenue, "EUR"),
          note: `${dashboard.paidPaymentsCount} paid payments recorded`,
        },
      ]
    : [
        {
          label: "Total Users",
          icon: "group",
          value: "—",
          note: "Loading metrics…",
        },
        {
          label: "Active Listings",
          icon: "garage",
          value: "—",
          note: "Loading metrics…",
        },
        {
          label: "Monthly Revenue",
          icon: "payments",
          value: "—",
          note: "Loading metrics…",
        },
      ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] font-['Manrope',sans-serif] text-[#1c1b1b] antialiased">
      <main className="mx-auto max-w-[1440px] space-y-8 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:space-y-12 lg:px-12 lg:pt-32">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-[32px] font-bold leading-[1.1] text-[#0F3D3E] sm:text-[40px] lg:text-[48px]">
            Admin Dashboard
          </h1>
          <p className="font-medium text-stone-500">
            Overview of the network&apos;s current performance and recent growth.
          </p>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {statCards.map((item) => (
            <div key={item.label} className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848]">
                  {item.label}
                </p>
                <span className="material-symbols-outlined text-[#4b6547]">{item.icon}</span>
              </div>
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-[-0.01em] text-[#0f3d3e]">
                {item.value}
              </h2>
              <p className="mt-2 text-sm font-medium italic leading-[1.5] text-[#4b6547]">
                <span className="inline-flex items-center">{item.note}</span>
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:col-span-2 lg:p-12">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-12">
              <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                Revenue Performance
              </h3>
              <div className="flex gap-2">
                {(["7d", "30d"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={`rounded-full border px-3 py-1 text-sm leading-[1.5] transition-colors ${
                      range === option
                        ? "border-[#0f3d3e] bg-[#0f3d3e] text-white"
                        : "border-[#c0c8c8] bg-white text-[#404848]"
                    }`}
                  >
                    {option === "7d" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex h-[300px] w-full items-end justify-between px-2">
              <div className="absolute inset-0 flex flex-col justify-between border-b border-l border-[#c0c8c8]/30 py-2">
                {[0, 1, 2, 3].map((line) => (
                  <div key={line} className="w-full border-t border-[#c0c8c8]/10" />
                ))}
              </div>
              <div className="relative flex h-full w-full items-end gap-1 pt-8">
                {chartPoints.map((point, index) => {
                  const height = `${Math.max((point.value / chartMax) * 100, 6)}%`;
                  return (
                    <div
                      key={`${point.label}-${index}`}
                      className={`w-full rounded-t-sm ${
                        index === Math.floor(chartPoints.length / 2) || index === chartPoints.length - 1
                          ? "bg-[#0f3d3e] shadow-sm"
                          : index % 3 === 1
                            ? "bg-[#4b6547]/30"
                            : index % 2 === 0
                              ? "bg-[#4b6547]/20"
                              : "bg-[#4b6547]/10"
                      }`}
                      style={{ height }}
                      title={`${point.label}: ${formatCurrency(point.value, "EUR")}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex justify-between text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848]">
              <span>Week 01</span>
              <span>Week 02</span>
              <span>Week 03</span>
              <span>Week 04</span>
            </div>
          </div>

          <div className="tonal-card flex flex-col justify-between rounded-[2rem] border border-[#EBEBE8] p-12">
            <div>
              <h3 className="mb-4 text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                Market Insights
              </h3>
              <p className="text-base leading-relaxed text-[#404848]">
                {dashboard?.marketInsights?.[0]
                  ? `${dashboard.marketInsights[0].label} has ${dashboard.marketInsights[0].value}.`
                  : "Demand for climate-controlled Premium Vaults has increased by 18% in the urban sector."}
              </p>
            </div>

            <div className="space-y-4">
              {(dashboard?.marketInsights?.length
                ? dashboard.marketInsights
                : [
                    { label: "New York City", value: "+24%" },
                    { label: "Los Angeles", value: "+16%" },
                  ]
              ).map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-[#EBEBE8] bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#4b6547]">trending_up</span>
                    <span className="text-sm font-semibold leading-[1.5]">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold leading-[1.5] text-[#4b6547]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="relative mt-6 h-32 overflow-hidden rounded-2xl">
              <Image
                className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
                alt="A modern secure vault interior with metallic shelving and warm lighting"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_YtGckwCAF5jPF35RYc4KOHUT0z2d6ulxPxdkA7_4u-RwluFdcBHRvJXFFJoC3j8i721euohBmLX1Kac40KRFUsldZvxCa01FCJ_XsoF06Y7uJcybYMWE_nj4qY47fACUgkQH29gm7sOw-44q7pt5nBuBvYwdbdgr_jKVoTHHFYDZKirOgo6FbmmSLnodjHP2fbQ4nNFZ8owi0wxa2ZrqkQqPWMlab5aCLZS26Tub55gQr5PM3FK8bo4u70iUYqgjJ7T4A_Sw5_Q"
                fill
                unoptimized
              />
            </div>
          </div>
        </section>

        <section className="tonal-card overflow-hidden rounded-[2rem] border border-[#EBEBE8]">
          <div className="flex flex-col gap-4 border-b border-[#EBEBE8] px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-12">
            <h2 className="text-[28px] font-bold leading-[1.3] text-[#0f3d3e]">Recent Activity</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#404848]">
                  search
                </span>
                <input
                  className="w-64 rounded-full border border-[#EBEBE8] bg-white py-2 pl-10 pr-4 text-sm leading-[1.5] focus:border-[#4b6547] focus:ring-0"
                  placeholder="Filter activity..."
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button className="material-symbols-outlined rounded-full p-2 text-[#404848] transition-colors hover:bg-white">
                filter_list
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f6f3f2]">
                <tr>
                  {["Name / ID", "Type", "Status", "Date"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-xs font-semibold uppercase leading-none tracking-[0.05em] text-[#404848] sm:px-6 lg:px-12"
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="px-4 py-4 sm:px-6 lg:px-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE8]">
                {activityRows.length ? (
                  activityRows.map((activity) => (
                    <tr key={activity.id} className="transition-colors hover:bg-white/50">
                      <td className="px-4 py-4 sm:px-6 lg:px-12">
                        <div className="flex flex-col">
                          <span className="text-base font-bold leading-[1.6] text-[#0f3d3e]">
                            {activity.name}
                          </span>
                          <span className="text-sm leading-[1.5] text-[#404848]">
                            {activity.entityId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6 lg:px-12">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${activity.typeClass}`}>
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6 lg:px-12">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${activity.statusDot}`} />
                          <span className="text-sm font-medium leading-[1.5]">{activity.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm leading-[1.5] text-[#404848] sm:px-6 lg:px-12">
                        {activity.date}
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6 lg:px-12">
                        <button className="material-symbols-outlined text-[#404848] hover:text-[#0f3d3e]">
                          more_horiz
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-sm text-[#404848] sm:px-6 lg:px-12" colSpan={5}>
                      No activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#EBEBE8] bg-white px-12 py-4">
            <span className="text-sm leading-[1.5] text-[#404848]">
              Showing {activityRows.length} of {formatCompactNumber(totalItems)} activities
            </span>
            <div className="flex items-center gap-2">
              <button className="rounded p-1 opacity-30 hover:bg-stone-100" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className="rounded p-1 hover:bg-stone-100"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
