import Link from "next/link";
import { redirect } from "next/navigation";

import OwnerActiveBookingActions from "@/components/owner/OwnerActiveBookingActions";
import OwnerBookingActions from "@/components/owner/OwnerBookingActions";
import OwnerBookingDetails from "@/components/owner/OwnerBookingDetails";
import OwnerListingActions from "@/components/owner/OwnerListingActions";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { getOwnerDashboardSnapshot } from "@/lib/dashboard/owner";
import { formatCurrency } from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "@/lib/invoices/invoiceTypes";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";
import { formatStorageTypeLabel } from "@/lib/storage-types";
import { formatSquareMeters, resolveAreaInSquareMeters } from "@/lib/units";

export const dynamic = "force-dynamic";

function formatGrowthPercent(value: number, t: ReturnType<typeof createTranslator>) {
  const rounded = Math.abs(value).toFixed(0);

  if (value > 0) {
    return `+${rounded}% ${t("dashboard.owner.monthlyGrowth")}`;
  }

  if (value < 0) {
    return `-${rounded}% ${t("dashboard.owner.monthlyGrowth")}`;
  }

  return `0% ${t("dashboard.owner.monthlyGrowth")}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getListingStatusLabel(status: string, t: ReturnType<typeof createTranslator>) {
  const key = `status.listing.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function getListingAvailabilityLabel(availability: string, t: ReturnType<typeof createTranslator>) {
  const key = `status.availability.${availability}`;
  const translated = t(key);
  return translated === key ? availability : translated;
}

function getActivityIcon(status: string) {
  if (status === "ACTIVE") {
    return "check_circle";
  }

  if (status === "APPROVED") {
    return "event_available";
  }

  if (status === "COMPLETED") {
    return "payments";
  }

  if (status === "CANCELLED" || status === "REJECTED") {
    return "cancel";
  }

  return "mail";
}

function formatDateRange(startDate: string, endDate: string | null, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const start = formatter.format(new Date(startDate));
  const end = formatter.format(new Date(endDate ?? startDate));

  return `${start} - ${end}`;
}

export default async function OwnerDashboardPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/owner/dashboard");
  }

  if (currentUser.role !== "OWNER") {
    redirect(getDashboardPath(currentUser.role));
  }

  if (!currentUser.ownerProfile) {
    // Owner is authenticated but has no profile yet — send to document upload,
    // not to /login. Redirecting to /login for an authenticated user looks like
    // an unexpected logout.
    redirect("/document");
  }

  const dashboard = await getOwnerDashboardSnapshot(currentUser.ownerProfile.id);
  const ownerName = currentUser.fullName ?? t("common.owner");
  const latestInvoices = dashboard.recentInvoices;
  const rentalHistory = dashboard.ownerBookings
    .filter((booking) =>
      booking.status === "COMPLETED" ||
      booking.status === "CANCELLED" ||
      booking.status === "REJECTED",
    )
    .slice(0, 6);
  const recentActivity = dashboard.ownerBookings
    .filter((booking) => booking.status !== "PENDING")
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 space-y-8 sm:space-y-10 lg:space-y-12">
      <header className="relative overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-secondary-container/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
            <p className="text-label-caps font-label-caps text-secondary tracking-[0.22em] uppercase">
              {t("dashboard.owner.title")}
            </p>
            <h1 className="text-h1 font-h1 text-primary max-w-3xl leading-[0.95]">
              {t("dashboard.owner.welcome", { name: ownerName })}
            </h1>
            <p className="max-w-2xl text-body-md font-body-md text-on-surface-variant">
              {t("dashboard.owner.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-low px-5 py-3 text-body-sm font-bold text-primary hover:bg-secondary-container transition-colors"
              href="/messaging"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              {t("nav.messages")}
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-body-sm font-bold text-on-primary hover:bg-[#d9590f] transition-colors shadow-[0_12px_28px_rgba(242,106,27,0.22)]"
              href="/create-listing"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t("dashboard.owner.addNewCave")}
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col gap-3 shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[176px]">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.monthlyEarnings")}
          </span>
          <span className="text-display font-display text-primary">
            {formatCurrency(dashboard.monthlyEarningsAmount, "EUR")}
          </span>
          <div className="flex items-center gap-1 text-secondary mt-2">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-body-sm font-body-sm">
              {formatGrowthPercent(dashboard.earningsGrowthPercent, t)}
            </span>
          </div>
          <span className="text-body-sm font-body-sm text-on-surface-variant">
            {t("dashboard.owner.totalEarnings")}: {formatCurrency(dashboard.totalEarnings, "EUR")}
          </span>
        </div>

        <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col gap-3 shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[176px]">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.occupancyRate")}
          </span>
          <span className="text-display font-display text-primary">
            {formatPercent(dashboard.occupancyRatePercent)}
          </span>
          <span className="text-body-sm font-body-sm text-on-surface-variant mt-2">
            {t("dashboard.owner.activeListingsDescription", {
              count: dashboard.activeListingsCount,
            })}
          </span>
        </div>

        <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col gap-3 shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[176px]">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.pendingPayments")}
          </span>
          <span className="text-display font-display text-primary">
            {formatCurrency(dashboard.pendingPaymentsAmount, "EUR")}
          </span>
            <div className="flex items-center gap-1 text-secondary mt-2">
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span className="text-body-sm font-body-sm">
              {t("dashboard.owner.pendingPayouts")}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-[28px] border border-outline-variant/60 overflow-hidden shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
        <div className="px-5 sm:px-8 lg:px-10 pt-7 sm:pt-9 lg:pt-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-h3 font-h3 text-primary">{t("dashboard.owner.revenueChart")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.owner.revenueSubtitle")}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary-container" />
                <span className="text-label-caps font-label-caps text-on-surface-variant">
                {t("dashboard.owner.grossRevenue")}
                </span>
              </div>
            </div>
        </div>

        <div className="h-56 sm:h-64 lg:h-72 mt-6 sm:mt-8 relative px-5 sm:px-8 lg:px-10 pb-8 sm:pb-10">
              <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 200"
          >
            <defs>
              <linearGradient id="ownerChartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f26a1b" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#f26a1b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={dashboard.revenueAreaPath} fill="url(#ownerChartGradient)" />
            <path
              d={dashboard.revenueLinePath}
              fill="none"
              stroke="#f26a1b"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>

          <div className="flex justify-between text-label-caps font-label-caps text-on-surface-variant mt-4 opacity-60">
            {dashboard.revenueSeries.map((point) => (
              <span key={`${point.monthStart}-${point.label}`}>{point.label.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5 sm:space-y-6 mt-8 sm:mt-10">
        <h2 className="text-h3 font-h3 text-primary">{t("dashboard.owner.earningsAndLegal")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col justify-between shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[160px]">
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              {t("dashboard.owner.pendingPayouts")}
            </span>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {formatCurrency(dashboard.pendingPayoutAmount, "EUR")}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.scheduledForReleaseOn")}{" "}
                {new Date(dashboard.pendingPayoutReleaseDate).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col justify-between shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[160px] relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                {t("dashboard.owner.unsignedContracts")}
              </span>
              <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-bold w-fit">
                {t("common.actionRequired").toUpperCase()}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {dashboard.unsignedContractsCount}
              </span>
              <p className="text-body-sm font-body-sm text-secondary">
                {t("dashboard.owner.contractReviewRequired")}
              </p>
            </div>
          </div>

          <div className="bg-surface p-5 sm:p-6 lg:p-8 rounded-[24px] border border-outline-variant/60 flex flex-col justify-between shadow-[0_10px_32px_rgba(17,24,39,0.05)] min-h-[160px]">
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              {t("dashboard.owner.signedContracts")}
            </span>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {dashboard.signedContractsCount}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.signedContractsDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-h3 font-h3 text-primary">{t("dashboard.owner.payoutHistory")}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.payoutHistoryDescription")}
              </p>
            </div>
            <span className="text-label-caps font-label-caps text-secondary uppercase tracking-[0.18em]">
              {formatCurrency(dashboard.monthlyEarningsAmount, "EUR")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.payoutDate")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.bookingColumn")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.amountColumn")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.ownerShare")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-sm text-on-surface">
                {dashboard.payoutHistory.length ? (
                  dashboard.payoutHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString(locale, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-primary">{payment.bookingTitle}</p>
                          <p className="text-on-surface-variant">
                            {payment.bookingNumber} • {payment.bookingCity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(payment.amount, "EUR")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-secondary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                          {formatCurrency(payment.ownerAmount, "EUR")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-on-surface-variant" colSpan={4}>
                      {t("dashboard.owner.noPayoutHistory")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-h3 font-h3 text-primary">{t("dashboard.owner.signedContracts")}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.signedContractsSectionDescription")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.contractNumber")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.bookingColumn")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.signedAt")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-sm text-on-surface">
                {dashboard.recentSignedContracts.length ? (
                  dashboard.recentSignedContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td className="px-6 py-4 font-medium text-primary">{contract.contractNumber}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-primary">{contract.bookingTitle}</p>
                          <p className="text-on-surface-variant">
                            {contract.bookingNumber} • {contract.bookingCity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract.fullySignedAt
                          ? new Date(contract.fullySignedAt).toLocaleDateString(locale, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          className="text-secondary font-semibold hover:underline"
                          href={`/api/contracts/${contract.id}/download`}
                        >
                          {t("common.download")}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-on-surface-variant" colSpan={4}>
                      {t("dashboard.owner.noSignedContracts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-secondary-container/20 border border-secondary/20 p-4 sm:p-5 rounded-[20px] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-secondary">error</span>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-body-sm font-medium text-primary">
              {t("dashboard.owner.bookingRequestsWaiting", {
                count: dashboard.tenantActivityCount,
              })}
            </p>
            <a
              className="text-body-sm font-bold text-secondary underline underline-offset-4 text-left md:text-right"
              href="#booking-requests"
            >
              {t("dashboard.owner.reviewRequests")}
            </a>
          </div>
        </div>

        <section className="space-y-6" id="booking-requests">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.bookingRequests")}</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {dashboard.tenantActivityCount === 0
                  ? t("dashboard.owner.noBookingRequests")
                  : t("dashboard.owner.bookingRequestsWaiting", {
                      count: dashboard.tenantActivityCount,
                    })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {dashboard.pendingBookings.length ? (
              dashboard.pendingBookings.map((booking) => (
                <article
                  className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 lg:p-7 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
                  key={booking.id}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 lg:gap-8">
                    <div className="space-y-2.5">
                      <p className="text-label-caps font-label-caps text-on-surface-variant">
                        {booking.renter.fullName}
                      </p>
                      <h3 className="text-h3 font-h3 text-primary">{booking.listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {booking.listing.address} • {booking.listing.city}
                      </p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {formatDateRange(booking.startDate, booking.endDate, locale)}
                        {booking.durationMonths ? (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
                            {booking.durationMonths} {booking.durationMonths === 1 ? t("dashboard.owner.month") : t("dashboard.owner.months")}
                          </span>
                        ) : null}
                      </p>
                      <OwnerBookingDetails
                        durationMonths={booking.durationMonths}
                        monthlyPrice={booking.monthlyPrice}
                        totalMonthlyAmount={booking.totalMonthlyAmount}
                        renterNote={booking.renterNote}
                      />
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-left lg:text-right">
                        <p className="text-label-caps font-label-caps text-on-surface-variant">
                          {t("dashboard.owner.statusLabel")}
                        </p>
                        <span className="inline-flex rounded-full bg-secondary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                          {t(`status.booking.${booking.status}`)}
                        </span>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-label-caps font-label-caps text-on-surface-variant">
                          {t("dashboard.owner.monthlyRevenue")}
                        </p>
                        <p className="text-h3 font-h3 text-primary">
                          {formatCurrency(booking.totalMonthlyAmount, "EUR")}
                        </p>
                      </div>

                      <OwnerBookingActions bookingId={booking.id} status={booking.status} />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/60 bg-surface p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noBookingRequests")}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4" id="active-bookings">
          <div>
            <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.activeBookings")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.owner.activeBookingsDescription")}
            </p>
          </div>

          <div className="space-y-4">
            {dashboard.activeBookings.length ? (
              dashboard.activeBookings.map((booking) => (
                <article
                  className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 lg:p-7 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
                  key={booking.id}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 lg:gap-8">
                    <div className="space-y-2.5">
                      <p className="text-label-caps font-label-caps text-on-surface-variant">
                        {booking.renter.fullName}
                      </p>
                      <h3 className="text-h3 font-h3 text-primary">{booking.listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {booking.listing.address} • {booking.listing.city}
                      </p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {formatDateRange(booking.startDate, booking.endDate, locale)}
                        {booking.durationMonths ? (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
                            {booking.durationMonths}{" "}
                            {booking.durationMonths === 1
                              ? t("dashboard.owner.month")
                              : t("dashboard.owner.months")}
                          </span>
                        ) : null}
                      </p>
                      <OwnerBookingDetails
                        durationMonths={booking.durationMonths}
                        monthlyPrice={booking.monthlyPrice}
                        totalMonthlyAmount={booking.totalMonthlyAmount}
                        renterNote={booking.renterNote}
                      />
                      <OwnerActiveBookingActions bookingId={booking.id} />
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-left lg:text-right">
                        <p className="text-label-caps font-label-caps text-on-surface-variant">
                          {t("dashboard.owner.statusLabel")}
                        </p>
                        <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                          {t(`status.booking.${booking.status}`)}
                        </span>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-label-caps font-label-caps text-on-surface-variant">
                          {t("dashboard.owner.monthlyRevenue")}
                        </p>
                        <p className="text-h3 font-h3 text-primary">
                          {formatCurrency(booking.totalMonthlyAmount, "EUR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/60 bg-surface p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noActiveBookings")}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4" id="rental-history">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.rentalHistory")}</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.rentalHistoryDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {rentalHistory.length ? (
              rentalHistory.map((booking) => (
                <article
                  className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 lg:p-7 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
                  key={booking.id}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 lg:gap-8">
                    <div className="space-y-2.5">
                      <p className="text-label-caps font-label-caps text-on-surface-variant">
                        {booking.renter.fullName}
                      </p>
                      <h3 className="text-h3 font-h3 text-primary">{booking.listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {booking.listing.address} • {booking.listing.city}
                      </p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {formatDateRange(booking.startDate, booking.endDate, locale)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <span className="inline-flex rounded-full bg-secondary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                        {t(`status.booking.${booking.status}`)}
                      </span>
                      <p className="text-h3 font-h3 text-primary">
                        {formatCurrency(booking.totalMonthlyAmount, "EUR")}
                      </p>
                      <Link
                        className="text-secondary font-semibold hover:underline"
                        href={`/storage/${booking.listing.id}`}
                      >
                        {t("common.viewDetails")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/60 bg-surface p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noRentalHistory")}
              </div>
            )}
          </div>
        </section>

        <div className="bg-surface rounded-[24px] border border-outline-variant/60 overflow-hidden shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.invoiceNumber")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.bookingColumn")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.amountColumn")}
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    {t("dashboard.owner.statusColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-sm text-on-surface">
                {latestInvoices.length ? (
                  latestInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4">{invoice.bookingTitle}</td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(invoice.totalAmount, "EUR")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(invoice.status)}`}
                        >
                          {getInvoiceStatusLabel(invoice.status, locale)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-10 text-center text-on-surface-variant" colSpan={4}>
                      {t("dashboard.owner.noInvoices")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-outline-variant/10 text-center">
            <Link
            className="text-secondary text-body-sm font-bold hover:underline"
            href="/invoices"
          >
            {t("dashboard.owner.viewAllInvoices")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 xl:gap-10">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.yourListings")}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full border border-outline-variant/70 bg-surface-container-low px-6 py-2 text-body-sm font-medium text-primary hover:bg-secondary-container transition-colors w-fit"
                href="/storage"
              >
                {t("dashboard.owner.viewAllCaves")}
              </Link>
              <Link
                className="rounded-full border border-outline-variant/70 bg-surface-container-low px-6 py-2 text-body-sm font-medium text-primary hover:bg-secondary-container transition-colors w-fit"
                href="/messaging"
              >
                {t("nav.messages")}
              </Link>
              <Link
                className="bg-secondary text-on-primary rounded-full px-6 py-2 text-body-sm font-medium hover:bg-[#d9590f] transition-colors w-fit"
                href="/create-listing"
              >
                {t("dashboard.owner.addNewCave")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {dashboard.ownerListings.length ? (
              dashboard.ownerListings.map((listing) => (
                <article
                  className="group bg-surface rounded-[24px] overflow-hidden border border-outline-variant/60 hover:shadow-[0_12px_32px_rgba(17,24,39,0.08)] transition-all"
                  key={listing.id}
                >
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={listing.imageUrl ?? "/placeholder-listing.svg"}
                    />
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-h3 font-h3 text-primary">{listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {formatStorageTypeLabel(listing.storageType, t)} •{" "}
                        {formatSquareMeters(resolveAreaInSquareMeters(listing.sizeM2, listing.sizeSqFt))}
                      </p>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {listing.address} • {listing.city}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-secondary-container/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                          {getListingStatusLabel(listing.status, t)}
                        </span>
                        <span className="inline-flex rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                          {getListingAvailabilityLabel(listing.availability, t)}
                        </span>
                      </div>
                    </div>

                  <div className="flex flex-col gap-4 border-t border-outline-variant/10 pt-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div className="flex flex-col">
                          <span className="text-label-caps font-label-caps text-on-surface-variant">
                            {t("dashboard.owner.monthlyRevenue")}
                          </span>
                          <span className="text-h3 font-h3 text-primary">
                            {formatCurrency(listing.pricePerMonth, "EUR")}
                          </span>
                        </div>
                        <Link
                          className="text-secondary font-semibold flex items-center gap-1 group/btn"
                          href={`/create-listing?listingId=${listing.id}`}
                        >
                          <span className="text-body-sm font-body-sm">{t("common.manage")}</span>
                          <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                      <OwnerListingActions
                        availability={listing.availability}
                        listingId={listing.id}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/60 bg-surface p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noListings")}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6" id="recent-bookings">
          <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.recentActivity")}</h2>

          <div className="bg-surface rounded-[24px] p-5 sm:p-6 space-y-5 border border-outline-variant/60 shadow-[0_10px_32px_rgba(17,24,39,0.05)] lg:sticky lg:top-28">
            {recentActivity.length ? (
              recentActivity.map((booking) => (
                <div className="flex gap-4 items-start" key={booking.id}>
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-md">
                      {getActivityIcon(booking.status)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      <span className="font-bold">{booking.renter.fullName}</span>{" "}
                      {t("dashboard.owner.requested")}{" "}
                      <span className="font-bold">{booking.listing.title}</span>
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      {t(`status.booking.${booking.status}`)} •{" "}
                      {new Date(booking.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <OwnerBookingActions bookingId={booking.id} status={booking.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/60 bg-surface p-4 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noRecentActivity")}
              </div>
            )}
          </div>
        </aside>
      </section>
      </div>
    </main>
  );
}
