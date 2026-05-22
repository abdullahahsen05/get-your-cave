import Link from "next/link";
import { redirect } from "next/navigation";

import OwnerBookingActions from "@/components/owner/OwnerBookingActions";
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

function formatGrowthPercent(value: number) {
  const rounded = Math.abs(value).toFixed(0);

  if (value > 0) {
    return `+${rounded}% from last month`;
  }

  if (value < 0) {
    return `-${rounded}% from last month`;
  }

  return `0% from last month`;
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
  const ownerName = currentUser.fullName ?? "Owner";
  const latestInvoices = dashboard.recentInvoices;
  const recentActivity = dashboard.ownerBookings.slice(0, 4);

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
              {formatGrowthPercent(dashboard.earningsGrowthPercent)}
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
            All units currently occupied
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
              Pending Payouts
            </span>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {formatCurrency(dashboard.pendingPayoutAmount, "EUR")}
              </span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                Scheduled for release on{" "}
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
                Unsigned Contracts
              </span>
              <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-bold w-fit">
                ACTION REQUIRED
              </span>
            </div>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">
                {dashboard.unsignedContractsCount}
              </span>
              <p className="text-body-sm font-body-sm text-error">
                Review required for generated contracts
              </p>
            </div>
          </div>
        </div>

        <div className="bg-error-container/20 border border-error/20 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-error">error</span>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-body-sm font-medium text-on-error-container">
              You have {dashboard.tenantActivityCount} booking request
              {dashboard.tenantActivityCount === 1 ? "" : "s"} waiting for approval
            </p>
            <a
              className="text-body-sm font-bold text-error underline underline-offset-4 text-left md:text-right"
              href="#recent-bookings"
            >
              Review Requests
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    INVOICE #
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    BOOKING
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    AMOUNT
                  </th>
                  <th className="px-6 py-3 text-label-caps font-label-caps text-on-surface-variant">
                    STATUS
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
                      No invoices found yet.
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
              View All Invoices
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-h2 font-h2 text-primary">Your Listings</h2>
            <Link
              className="bg-primary text-on-primary rounded-full px-6 py-2 text-body-sm font-medium hover:opacity-90 transition-opacity w-fit"
              href="/create-listing"
            >
              Add New Cave
            </Link>
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
                      {listing.status}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-h3 font-h3 text-primary">{listing.title}</h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {listing.storageType} • {listing.sizeSqFt ?? 0} sq ft
                      </p>
                    </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-t border-outline-variant/10 pt-4 gap-4">
                      <div className="flex flex-col">
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          MONTHLY REVENUE
                        </span>
                        <span className="text-h3 font-h3 text-primary">
                          ${listing.pricePerMonth}
                        </span>
                      </div>
                      <Link
                        className="text-primary-container font-semibold flex items-center gap-1 group/btn"
                        href={`/create-listing?listingId=${listing.id}`}
                      >
                        <span className="text-body-sm font-body-sm">Manage</span>
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-outline-variant/20 bg-white p-6 text-body-sm text-on-surface-variant">
                No listings yet. Create your first cave to get started.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6" id="recent-bookings">
          <h2 className="text-h2 font-h2 text-primary">Recent Activity</h2>

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
                      <span className="font-bold">{booking.renter.fullName}</span> requested{" "}
                      <span className="font-bold">{booking.listing.title}</span>
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      {booking.status} •{" "}
                      {new Date(booking.createdAt).toLocaleDateString("en-US", {
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
                No recent activity yet.
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
