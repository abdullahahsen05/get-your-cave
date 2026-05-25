import Link from "next/link";
import { redirect } from "next/navigation";

import OwnerActiveBookingActions from "@/components/owner/OwnerActiveBookingActions";
import OwnerBookingActions from "@/components/owner/OwnerBookingActions";
import OwnerBookingDetails from "@/components/owner/OwnerBookingDetails";
import OwnerListingArchiveButton from "@/components/owner/OwnerListingArchiveButton";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { getOwnerDashboardSnapshot } from "@/lib/dashboard/owner";
import { formatCurrency } from "@/lib/invoices/formatCurrency";
import {
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "@/lib/invoices/invoiceTypes";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

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

function getListingStatusLabel(status: string, t: ReturnType<typeof createTranslator>) {
  const key = `status.listing.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
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

function formatStorageTypeLabel(value: string, t: ReturnType<typeof createTranslator>) {
  if (value === "GARAGE") return t("createListing.storageTypes.garage");
  if (value === "BASEMENT") return t("createListing.storageTypes.basement");
  if (value === "ROOM") return t("createListing.storageTypes.room");
  if (value === "WAREHOUSE") return t("createListing.storageTypes.warehouse");
  return value;
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
    redirect("/login?next=/owner/dashboard");
  }

  const dashboard = await getOwnerDashboardSnapshot(currentUser.ownerProfile.id);
  const ownerName = currentUser.fullName ?? t("common.owner");
  const latestInvoices = dashboard.recentInvoices;
  const recentActivity = dashboard.ownerBookings
    .filter((booking) => booking.status !== "PENDING")
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-on-surface max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12 pt-28 sm:pt-32">
      <header className="space-y-2">
        <p className="text-label-caps font-label-caps text-secondary tracking-widest">
          {t("dashboard.owner.title")}
        </p>
        <h1 className="text-h1 font-h1 text-primary">
          {t("dashboard.owner.welcome", { name: ownerName })}
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 sm:p-8 lg:p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.earnings")}
          </span>
          <span className="text-display font-display text-primary">
            {formatCurrency(dashboard.totalEarnings, "EUR")}
          </span>
          <div className="flex items-center gap-1 text-secondary mt-2">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-body-sm font-body-sm">
              {formatGrowthPercent(dashboard.earningsGrowthPercent, t)}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 sm:p-8 lg:p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.activeListings")}
          </span>
          <span className="text-display font-display text-primary">
            {dashboard.activeListingsCount}
          </span>
          <span className="text-body-sm font-body-sm text-on-surface-variant mt-2">
            {t("dashboard.owner.activeListingsDescription")}
          </span>
        </div>

        <div className="bg-surface-container-low p-6 sm:p-8 lg:p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            {t("dashboard.owner.pendingRequests")}
          </span>
          <span className="text-display font-display text-primary">
            {dashboard.tenantActivityCount}
          </span>
          <div className="flex items-center gap-1 text-primary-container mt-2">
            <span className="material-symbols-outlined text-sm">mail</span>
            <span className="text-body-sm font-body-sm">
              {t("dashboard.owner.newBooking")}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-h3 font-h3 text-primary">{t("dashboard.owner.revenueChart")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.owner.revenueSubtitle")}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container" />
                <span className="text-label-caps font-label-caps text-on-surface-variant">
                {t("dashboard.owner.grossRevenue")}
                </span>
              </div>
            </div>
        </div>

        <div className="h-64 mt-8 relative px-4 sm:px-6 lg:px-12 pb-8 sm:pb-12">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 200"
          >
            <defs>
              <linearGradient id="ownerChartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0F3D3E" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0F3D3E" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={dashboard.revenueAreaPath} fill="url(#ownerChartGradient)" />
            <path
              d={dashboard.revenueLinePath}
              fill="none"
              stroke="#0F3D3E"
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

      <section className="space-y-6 mt-12">
        <h2 className="text-h3 font-h3 text-primary">{t("dashboard.owner.earningsAndLegal")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-6 sm:p-8 rounded-lg border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              {t("dashboard.owner.pendingPayouts")}
            </span>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {formatCurrency(dashboard.pendingPayoutAmount, "EUR")}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.owner.scheduledForReleaseOn")}{" "}
                {new Date(dashboard.pendingPayoutReleaseDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 sm:p-8 rounded-lg border border-outline-variant/30 flex flex-col justify-between relative">
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
              <p className="text-body-sm font-body-sm text-error">
                {t("dashboard.owner.contractReviewRequired")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-error-container/20 border border-error/20 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-error">error</span>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-body-sm font-medium text-on-error-container">
              {t("dashboard.owner.bookingRequestsWaiting", {
                count: dashboard.tenantActivityCount,
              })}
            </p>
            <a
              className="text-body-sm font-bold text-error underline underline-offset-4 text-left md:text-right"
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
                  className="rounded-lg border border-outline-variant/20 bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,61,62,0.04)]"
                  key={booking.id}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
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
              <div className="rounded-lg border border-outline-variant/20 bg-white p-6 text-body-sm text-on-surface-variant">
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
                  className="rounded-lg border border-outline-variant/20 bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,61,62,0.04)]"
                  key={booking.id}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
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
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
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
              <div className="rounded-lg border border-outline-variant/20 bg-white p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noActiveBookings")}
              </div>
            )}
          </div>
        </section>

        <div className="bg-white rounded-lg border border-outline-variant/20 overflow-hidden">
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
              className="text-primary-container text-body-sm font-bold hover:underline"
              href="/invoices"
            >
              {t("dashboard.owner.viewAllInvoices")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.yourListings")}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full border border-outline-variant px-6 py-2 text-body-sm font-medium text-primary hover:bg-surface-container transition-colors w-fit"
                href="/messaging"
              >
                {t("nav.messages")}
              </Link>
              <Link
                className="bg-primary text-on-primary rounded-full px-6 py-2 text-body-sm font-medium hover:opacity-90 transition-opacity w-fit"
                href="/create-listing"
              >
                {t("dashboard.owner.addNewCave")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard.ownerListings.length ? (
              dashboard.ownerListings.map((listing) => (
                <article
                  className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 hover:shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all"
                  key={listing.id}
                >
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={listing.imageUrl ?? "/placeholder-listing.svg"}
                    />
                    <span className="absolute top-4 right-4 bg-secondary-container text-on-secondary-fixed text-label-caps font-label-caps px-3 py-1 rounded-full">
                      {getListingStatusLabel(listing.status, t)}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-h3 font-h3 text-primary">{listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {formatStorageTypeLabel(listing.storageType, t)} • {listing.sizeSqFt ?? 0} {t("listingDetail.sqFt")}
                      </p>
                    </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-t border-outline-variant/10 pt-4 gap-4">
                      <div className="flex flex-col">
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          {t("dashboard.owner.monthlyRevenue")}
                        </span>
                        <span className="text-h3 font-h3 text-primary">
                          {formatCurrency(listing.pricePerMonth, "EUR")}
                        </span>
                      </div>
                      <Link
                        className="text-primary-container font-semibold flex items-center gap-1 group/btn"
                        href={`/create-listing?listingId=${listing.id}`}
                      >
                        <span className="text-body-sm font-body-sm">{t("common.manage")}</span>
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </Link>
                      <OwnerListingArchiveButton
                        archived={listing.status === "ARCHIVED"}
                        listingId={listing.id}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/20 bg-white p-6 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noListings")}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6" id="recent-bookings">
          <h2 className="text-h2 font-h2 text-primary">{t("dashboard.owner.recentActivity")}</h2>

          <div className="bg-surface-container-low rounded-lg p-6 space-y-6 border border-outline-variant/30">
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
              <div className="rounded-lg border border-outline-variant/20 bg-white p-4 text-body-sm text-on-surface-variant">
                {t("dashboard.owner.noRecentActivity")}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
