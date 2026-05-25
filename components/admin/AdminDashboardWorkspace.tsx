"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  AdminActivityPage,
  AdminDashboardResponse,
  AdminRevenuePoint,
} from "@/lib/admin-shared";
import { normalizeLocale } from "@/lib/i18n";
import {
  getVerificationDocumentTypeLabel,
  getVerificationStatusLabel as getVerificationStatusDisplayLabel,
  type VerificationDocumentType,
  type VerificationStatusValue,
} from "@/lib/verification-types";

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

type PendingListingRow = {
  id: string;
  title: string;
  city: string;
  pricePerMonth: string;
  status: string;
  availability: string | null;
  isPublished: boolean;
  createdAt: string;
  owner: {
    fullName: string;
    email: string;
  };
};

type PendingVerificationRow = {
  id: string;
  type: VerificationDocumentType;
  fileName: string | null;
  fileUrl: string;
  status: VerificationStatusValue;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
};

type PendingUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

function getListingStatusLabel(status: string, t: (key: string) => string) {
  const key = `status.listing.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function getVerificationStatusLabel(status: string, t: (key: string) => string) {
  const key = `status.verification.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function getAdminActivityTypeLabel(entityType: string, t: (key: string) => string) {
  switch (entityType) {
    case "USER":
      return t("dashboard.admin.users");
    case "LISTING":
      return t("dashboard.admin.listings");
    case "BOOKING":
      return t("dashboard.admin.bookings");
    case "PAYMENT":
      return t("dashboard.admin.payments");
    case "INVOICE":
      return t("invoices.title");
    case "CONTRACT":
      return t("nav.contracts");
    case "VERIFICATION_DOCUMENT":
      return t("dashboard.admin.documents");
    default:
      return t("dashboard.admin.platformOverview");
  }
}

function getAdminActivityStatusLabel(
  activity: { entityType: string; status: string },
  t: (key: string) => string,
) {
  if (activity.entityType === "USER") {
    if (activity.status === "Verified") {
      return t("status.account.ACTIVE");
    }
    if (activity.status === "Pending") {
      return t("status.account.PENDING_VERIFICATION");
    }
    return activity.status;
  }

  if (activity.entityType === "LISTING") {
    if (activity.status === "Pending") {
      return t("status.listing.PENDING_APPROVAL");
    }
    if (activity.status === "Approved") {
      return t("status.listing.APPROVED");
    }
    if (activity.status === "Rejected") {
      return t("status.listing.REJECTED");
    }
    return activity.status;
  }

  if (activity.entityType === "BOOKING") {
    if (activity.status === "Pending") return t("status.booking.PENDING");
    if (activity.status === "Approved") return t("status.booking.APPROVED");
    if (activity.status === "Active") return t("status.booking.ACTIVE");
    if (activity.status === "Completed") return t("status.booking.COMPLETED");
    if (activity.status === "Rejected") return t("status.booking.REJECTED");
    if (activity.status === "Cancelled") return t("status.booking.CANCELLED");
    return activity.status;
  }

  if (activity.entityType === "PAYMENT") {
    if (activity.status === "Paid") return t("status.payment.PAID");
    if (activity.status === "Failed") return t("status.payment.FAILED");
    if (activity.status === "Refunded") return t("status.payment.REFUNDED");
    if (activity.status === "Pending") return t("status.payment.PENDING");
    if (activity.status === "Cancelled") return t("status.payment.CANCELLED");
    return activity.status;
  }

  if (activity.entityType === "INVOICE") {
    if (activity.status === "Pending") return t("status.invoice.DRAFT");
    if (activity.status === "Issued") return t("status.invoice.ISSUED");
    if (activity.status === "Paid") return t("status.invoice.PAID");
    if (activity.status === "Overdue") return t("status.invoice.OVERDUE");
    if (activity.status === "Refunded") return t("status.invoice.REFUNDED");
    if (activity.status === "Cancelled") return t("status.invoice.CANCELLED");
    return activity.status;
  }

  if (activity.entityType === "CONTRACT") {
    if (activity.status === "Draft") return t("status.contract.DRAFT");
    if (activity.status === "Generated") return t("status.contract.GENERATED");
    if (activity.status === "Signed") return t("status.contract.SIGNED");
    if (activity.status === "Cancelled") return t("status.contract.CANCELLED");
    return activity.status;
  }

  if (activity.entityType === "VERIFICATION_DOCUMENT") {
    if (activity.status === "Pending") return t("status.verification.PENDING");
    if (activity.status === "Approved") return t("status.verification.APPROVED");
    if (activity.status === "Rejected") return t("status.verification.REJECTED");
    if (activity.status === "Not submitted") return t("status.verification.NOT_SUBMITTED");
    return activity.status;
  }

  return activity.status;
}

export default function AdminDashboardWorkspace() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [activity, setActivity] = useState<AdminActivityPage | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);
  const [moderationReloadKey, setModerationReloadKey] = useState(0);
  const [pendingListings, setPendingListings] = useState<PendingListingRow[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerificationRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUserRow[]>([]);
  const [moderationLoading, setModerationLoading] = useState(true);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<{
    kind: "listing" | "verification" | "user";
    id: string;
    action: "approve" | "reject";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboardResponse, activityResponse] = await Promise.all([
          fetch("/api/admin/dashboard", { cache: "no-store" }),
          fetch("/api/admin/activity?page=1&limit=3", { cache: "no-store" }),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error(t("errors.unableToLoadDashboard"));
        }

        if (!activityResponse.ok) {
          throw new Error(t("errors.unableToLoadRecentActivity"));
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
          setError(loadError instanceof Error ? loadError.message : t("errors.unableToLoadDashboard"));
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [dashboardReloadKey]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/admin/revenue?range=${range}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t("errors.unableToLoadRevenueAnalytics"));
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
          setError(loadError instanceof Error ? loadError.message : t("errors.unableToLoadRevenueAnalytics"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    let cancelled = false;

    async function loadModerationQueues() {
      setModerationLoading(true);
      setModerationError(null);

      try {
        const [listingsResponse, verificationsResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/listings?status=PENDING_APPROVAL&limit=5", {
            cache: "no-store",
          }),
          fetch("/api/admin/verifications?status=PENDING&limit=5", {
            cache: "no-store",
          }),
          fetch("/api/admin/users?status=PENDING_VERIFICATION&limit=5", {
            cache: "no-store",
          }),
        ]);

        if (!listingsResponse.ok) {
          throw new Error(t("errors.unableToLoadPendingListings"));
        }

        if (!verificationsResponse.ok) {
          throw new Error(t("errors.unableToLoadPendingVerificationDocuments"));
        }

        if (!usersResponse.ok) {
          throw new Error("Unable to load pending users.");
        }

        const listingsData = (await listingsResponse.json()) as {
          rows?: PendingListingRow[];
        };
        const verificationsData = (await verificationsResponse.json()) as {
          rows?: PendingVerificationRow[];
        };
        const usersData = (await usersResponse.json()) as {
          rows?: PendingUserRow[];
        };

        if (!cancelled) {
          setPendingListings(listingsData.rows ?? []);
          setPendingVerifications(verificationsData.rows ?? []);
          setPendingUsers(usersData.rows ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setModerationError(
            loadError instanceof Error
            ? loadError.message
              : t("errors.unableToLoadModerationQueues"),
        );
        }
      } finally {
        if (!cancelled) {
          setModerationLoading(false);
        }
      }
    }

    loadModerationQueues();

    return () => {
      cancelled = true;
    };
  }, [moderationReloadKey]);

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
          throw new Error(t("errors.unableToLoadActivity"));
        }

        const data = (await response.json()) as AdminActivityPage;
        setActivity(data);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : t("errors.unableToLoadActivity"));
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [page, search]);

  async function handleModerationAction(
    kind: "listing" | "verification" | "user",
    id: string,
    action: "approve" | "reject",
  ) {
    const isReject = action === "reject";
    const rejectionReason =
      isReject && kind !== "user"
        ? window.prompt(
            kind === "listing"
              ? t("errors.optionalRejectionReasonListing")
              : t("errors.optionalRejectionReasonVerification"),
          )
        : null;

    if (isReject && kind !== "user" && rejectionReason === null) {
      return;
    }

    setBusyAction({ kind, id, action });
    setModerationError(null);

    try {
      const endpoint =
        kind === "listing"
          ? "/api/admin/listings"
          : kind === "user"
            ? `/api/admin/users/${id}/verify`
            : `/api/admin/verifications/${id}/${action}`;

      const bodyPayload =
        kind === "listing"
          ? {
              id,
              action,
              reason:
                isReject && rejectionReason !== null
                  ? rejectionReason.trim() || undefined
                  : undefined,
            }
          : kind === "user"
            ? undefined
            : isReject && rejectionReason !== null
              ? {
                  rejectionReason: rejectionReason.trim() || undefined,
                }
              : undefined;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(t("errors.unableToUpdateModerationItem"));
      }

      setDashboardReloadKey((value) => value + 1);
      setModerationReloadKey((value) => value + 1);
    } catch (moderationActionError) {
      setModerationError(
        moderationActionError instanceof Error
          ? moderationActionError.message
          : t("errors.unableToUpdateModerationItem"),
      );
    } finally {
      setBusyAction(null);
    }
  }

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
          label: t("dashboard.admin.totalUsers"),
          icon: "group",
          value: formatCompactNumber(dashboard.totalUsers),
          note: t("dashboard.admin.totalAdminsActive", { count: dashboard.totalAdmins }),
        },
        {
          label: t("dashboard.admin.activeListings"),
          icon: "garage",
          value: formatCompactNumber(dashboard.activeListings),
          note: t("dashboard.admin.pendingReviewCount", { count: dashboard.pendingListings }),
        },
        {
          label: t("dashboard.admin.monthlyRevenue"),
          icon: "payments",
          value: formatCurrency(dashboard.monthlyRevenue, "EUR"),
          note: t("dashboard.admin.paidPaymentsRecorded", { count: dashboard.paidPaymentsCount }),
        },
        {
          label: t("dashboard.admin.refundedPayments"),
          icon: "undo",
          value: formatCompactNumber(dashboard.refundedPaymentsCount),
          note: t("dashboard.admin.refundedPaymentsRecorded", { count: dashboard.refundedPaymentsCount }),
        },
      ]
    : [
        {
          label: t("dashboard.admin.totalUsers"),
          icon: "group",
          value: "—",
          note: t("dashboard.admin.loadingMetrics"),
        },
        {
          label: t("dashboard.admin.activeListings"),
          icon: "garage",
          value: "—",
          note: t("dashboard.admin.loadingMetrics"),
        },
        {
          label: t("dashboard.admin.monthlyRevenue"),
          icon: "payments",
          value: "—",
          note: t("dashboard.admin.loadingMetrics"),
        },
        {
          label: t("dashboard.admin.refundedPayments"),
          icon: "undo",
          value: "—",
          note: t("dashboard.admin.loadingMetrics"),
        },
      ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] font-['Manrope',sans-serif] text-[#1c1b1b] antialiased">
      <main className="mx-auto max-w-[1440px] space-y-8 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:space-y-12 lg:px-12 lg:pt-32">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-[32px] font-bold leading-[1.1] text-[#0F3D3E] sm:text-[40px] lg:text-[48px]">
            {t("dashboard.admin.title")}
          </h1>
          <p className="font-medium text-stone-500">
            {t("dashboard.admin.subtitle")}
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
                {t("dashboard.admin.revenueActivity")}
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
                    {option === "7d" ? t("dashboard.admin.range7d") : t("dashboard.admin.range30d")}
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
              <span>{t("dashboard.admin.week1")}</span>
              <span>{t("dashboard.admin.week2")}</span>
              <span>{t("dashboard.admin.week3")}</span>
              <span>{t("dashboard.admin.week4")}</span>
            </div>
          </div>

          <div className="tonal-card flex flex-col justify-between rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
            <div>
              <h3 className="mb-4 text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                {t("dashboard.admin.marketInsights")}
              </h3>
              <p className="text-base leading-relaxed text-[#404848]">
                {dashboard?.marketInsights?.[0]
                  ? t("dashboard.admin.marketInsightSentence", {
                      label: dashboard.marketInsights[0].label,
                      value: dashboard.marketInsights[0].value,
                    })
                  : t("dashboard.admin.marketInsightsFallback")}
              </p>
            </div>

            <div className="space-y-4">
              {(dashboard?.marketInsights?.length
                ? dashboard.marketInsights
                : [
                    { label: t("dashboard.admin.sampleCity1"), value: "+24%" },
                    { label: t("dashboard.admin.sampleCity2"), value: "+16%" },
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

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                {t("dashboard.admin.pendingListings")}
              </h3>
              <span className="rounded-full border border-[#EBEBE8] bg-white px-3 py-1 text-xs font-semibold text-[#404848]">
                {t("dashboard.admin.queuedCount", { count: pendingListings.length })}
              </span>
            </div>

            {moderationError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {moderationError}
              </div>
            ) : null}

            {moderationLoading ? (
              <p className="text-sm font-medium text-stone-500">{t("dashboard.admin.loadingModeration")}</p>
            ) : pendingListings.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-[#EBEBE8]">
                    <tr>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.listing")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.owner")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.status")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848] text-right">
                        {t("dashboard.admin.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEBE8]">
                    {pendingListings.map((listing) => (
                      <tr key={listing.id}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-semibold leading-[1.5] text-[#0f3d3e]">
                            {listing.title}
                          </p>
                          <p className="text-xs leading-[1.5] text-[#404848]">
                            {listing.city} • {formatCurrency(listing.pricePerMonth, "EUR")}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-sm leading-[1.5] text-[#404848]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0f3d3e]">
                              {listing.owner.fullName}
                            </span>
                            <span>{listing.owner.email}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
                            {getListingStatusLabel(listing.status, t)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-full bg-[#0f3d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                              disabled={
                                busyAction?.kind === "listing" &&
                                busyAction.id === listing.id &&
                                busyAction.action === "approve"
                              }
                              type="button"
                              onClick={() => {
                                void handleModerationAction("listing", listing.id, "approve");
                              }}
                            >
                              {busyAction?.kind === "listing" &&
                              busyAction.id === listing.id &&
                              busyAction.action === "approve"
                                ? t("common.loading")
                                : t("common.approve")}
                            </button>
                            <button
                              className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-white disabled:opacity-60"
                              disabled={
                                busyAction?.kind === "listing" &&
                                busyAction.id === listing.id &&
                                busyAction.action === "reject"
                              }
                              type="button"
                              onClick={() => {
                                void handleModerationAction("listing", listing.id, "reject");
                              }}
                            >
                              {busyAction?.kind === "listing" &&
                              busyAction.id === listing.id &&
                              busyAction.action === "reject"
                                ? t("common.loading")
                                : t("common.reject")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EBEBE8] bg-white p-4 text-sm text-stone-500">
                {t("dashboard.admin.noPendingListings")}
              </div>
            )}
          </div>

          <div className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                {t("dashboard.admin.pendingVerifications")}
              </h3>
              <span className="rounded-full border border-[#EBEBE8] bg-white px-3 py-1 text-xs font-semibold text-[#404848]">
                {t("dashboard.admin.queuedCount", { count: pendingVerifications.length })}
              </span>
            </div>

            {moderationLoading ? (
              <p className="text-sm font-medium text-stone-500">{t("dashboard.admin.loadingModeration")}</p>
            ) : pendingVerifications.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-[#EBEBE8]">
                    <tr>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.document")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.user")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.status")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848] text-right">
                        {t("dashboard.admin.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEBE8]">
                    {pendingVerifications.map((document) => (
                      <tr key={document.id}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-semibold leading-[1.5] text-[#0f3d3e]">
                            {document.fileName ?? getVerificationDocumentTypeLabel(document.type, locale)}
                          </p>
                          <p className="text-xs leading-[1.5] text-[#404848]">
                            {getVerificationDocumentTypeLabel(document.type, locale)}
                          </p>
                          <a
                            className="text-xs font-semibold text-[#4b6547] hover:underline"
                            href={`/api/verification-documents/${document.id}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t("dashboard.admin.viewDocument")}
                          </a>
                        </td>
                        <td className="py-4 pr-4 text-sm leading-[1.5] text-[#404848]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0f3d3e]">
                              {document.user.fullName}
                            </span>
                            <span>{document.user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
                            {getVerificationStatusDisplayLabel(document.status, locale)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-full bg-[#0f3d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                              disabled={
                                busyAction?.kind === "verification" &&
                                busyAction.id === document.id &&
                                busyAction.action === "approve"
                              }
                              type="button"
                              onClick={() => {
                                void handleModerationAction("verification", document.id, "approve");
                              }}
                            >
                              {busyAction?.kind === "verification" &&
                              busyAction.id === document.id &&
                              busyAction.action === "approve"
                                ? t("common.loading")
                                : t("common.approve")}
                            </button>
                            <button
                              className="rounded-full border border-outline-variant px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-white disabled:opacity-60"
                              disabled={
                                busyAction?.kind === "verification" &&
                                busyAction.id === document.id &&
                                busyAction.action === "reject"
                              }
                              type="button"
                              onClick={() => {
                                void handleModerationAction("verification", document.id, "reject");
                              }}
                            >
                              {busyAction?.kind === "verification" &&
                              busyAction.id === document.id &&
                              busyAction.action === "reject"
                                ? t("common.loading")
                                : t("common.reject")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EBEBE8] bg-white p-4 text-sm text-stone-500">
                {t("dashboard.admin.noPendingVerifications")}
              </div>
            )}
          </div>
        </section>

        {pendingUsers.length > 0 ? (
          <section className="tonal-card rounded-[2rem] border border-[#EBEBE8] p-6 sm:p-8 lg:p-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[22px] font-semibold leading-[1.4] text-[#0f3d3e]">
                Pending Users
              </h3>
              <span className="rounded-full border border-[#EBEBE8] bg-white px-3 py-1 text-xs font-semibold text-[#404848]">
                {t("dashboard.admin.queuedCount", { count: pendingUsers.length })}
              </span>
            </div>

            {moderationError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {moderationError}
              </div>
            ) : null}

            {moderationLoading ? (
              <p className="text-sm font-medium text-stone-500">{t("dashboard.admin.loadingModeration")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-[#EBEBE8]">
                    <tr>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.user")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        Role
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848]">
                        {t("dashboard.admin.status")}
                      </th>
                      <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#404848] text-right">
                        {t("dashboard.admin.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEBE8]">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-semibold leading-[1.5] text-[#0f3d3e]">
                            {user.fullName}
                          </p>
                          <p className="text-xs leading-[1.5] text-[#404848]">{user.email}</p>
                        </td>
                        <td className="py-4 pr-4 text-sm leading-[1.5] text-[#404848]">
                          {user.role}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
                            {t("status.account.PENDING_VERIFICATION")}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            className="rounded-full bg-[#0f3d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            disabled={
                              busyAction?.kind === "user" &&
                              busyAction.id === user.id
                            }
                            type="button"
                            onClick={() => {
                              void handleModerationAction("user", user.id, "approve");
                            }}
                          >
                            {busyAction?.kind === "user" && busyAction.id === user.id
                              ? t("common.loading")
                              : t("common.approve")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        <section className="tonal-card overflow-hidden rounded-[2rem] border border-[#EBEBE8]">
          <div className="flex flex-col gap-4 border-b border-[#EBEBE8] px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-12">
            <h2 className="text-[28px] font-bold leading-[1.3] text-[#0f3d3e]">{t("dashboard.admin.recentActivity")}</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#404848]">
                  search
                </span>
                <input
                  className="w-56 sm:w-64 rounded-full border border-[#EBEBE8] bg-white py-2 pl-10 pr-4 text-sm leading-[1.5] focus:border-[#4b6547] focus:ring-0"
                placeholder={t("dashboard.admin.filterActivity")}
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button
                aria-label={t("dashboard.admin.filterActivity")}
                className="material-symbols-outlined rounded-full p-2 text-[#404848] transition-colors hover:bg-white"
                type="button"
              >
                filter_list
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f6f3f2]">
                <tr>
                  {[t("dashboard.admin.nameId"), t("dashboard.admin.type"), t("dashboard.admin.status"), t("dashboard.admin.date")].map((heading) => (
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
                          {getAdminActivityTypeLabel(activity.entityType, t)}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6 lg:px-12">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${activity.statusDot}`} />
                          <span className="text-sm font-medium leading-[1.5]">
                            {getAdminActivityStatusLabel(activity, t)}
                          </span>
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
                      {t("dashboard.admin.noActivityFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#EBEBE8] bg-white px-4 sm:px-6 lg:px-12 py-4">
            <span className="text-sm leading-[1.5] text-[#404848]">
              {t("dashboard.admin.showingActivities", {
                visible: activityRows.length,
                total: formatCompactNumber(totalItems),
              })}
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
