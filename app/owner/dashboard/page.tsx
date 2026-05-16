import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getOwnerBookings } from "@/lib/bookings";
import { getOwnerListings } from "@/lib/listings";

export default async function OwnerDashboardPage() {
  const currentUser = await getCurrentUser();
  const [ownerListings, ownerBookings] =
    currentUser?.role === "OWNER" && currentUser.ownerProfile
      ? await Promise.all([
          getOwnerListings(currentUser.ownerProfile.id),
          getOwnerBookings(currentUser.ownerProfile.id),
        ])
      : [[], []];

  const activeListings = ownerListings.filter(
    (listing) => listing.status === "APPROVED" && listing.isPublished,
  );
  const pendingBookings = ownerBookings.filter(
    (booking) => booking.status === "PENDING",
  );

  const ownerName = currentUser?.fullName ?? "Owner";

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-on-surface max-w-7xl mx-auto px-6 py-12 space-y-12 pt-32">
      <header className="space-y-2">
        <p className="text-label-caps font-label-caps text-secondary tracking-widest">
          OWNER DASHBOARD
        </p>
        <h1 className="text-h1 font-h1 text-primary">
          Welcome back {ownerName} (Owner)
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            TOTAL EARNINGS
          </span>
          <span className="text-display font-display text-primary">$4,280</span>
          <div className="flex items-center gap-1 text-secondary mt-2">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-body-sm font-body-sm">
              +12% from last month
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            ACTIVE LISTINGS
          </span>
          <span className="text-display font-display text-primary">
            {activeListings.length}
          </span>
          <span className="text-body-sm font-body-sm text-on-surface-variant mt-2">
            All units currently occupied
          </span>
        </div>

        <div className="bg-surface-container-low p-12 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
          <span className="text-label-caps font-label-caps text-on-surface-variant">
            TENANT ACTIVITY
          </span>
          <span className="text-display font-display text-primary">
            {pendingBookings.length}
          </span>
          <div className="flex items-center gap-1 text-primary-container mt-2">
            <span className="material-symbols-outlined text-sm">mail</span>
            <span className="text-body-sm font-body-sm">
              New booking requests pending
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden">
        <div className="px-12 pt-12 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-h3 font-h3 text-primary">Revenue Overview</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Last 6 months performance
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-container" />
              <span className="text-label-caps font-label-caps text-on-surface-variant">
                GROSS REVENUE
              </span>
            </div>
          </div>
        </div>

        <div className="h-64 mt-8 relative px-12 pb-12">
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
            <path
              d="M0 180 Q 150 150, 300 160 T 600 100 T 1000 40 L 1000 200 L 0 200 Z"
              fill="url(#ownerChartGradient)"
            />
            <path
              d="M0 180 Q 150 150, 300 160 T 600 100 T 1000 40"
              fill="none"
              stroke="#0F3D3E"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>

          <div className="flex justify-between text-label-caps font-label-caps text-on-surface-variant mt-4 opacity-60">
            <span>JAN</span>
            <span>FEB</span>
            <span>MAR</span>
            <span>APR</span>
            <span>MAY</span>
            <span>JUN</span>
          </div>
        </div>
      </section>

      <section className="space-y-6 mt-12">
        <h2 className="text-h3 font-h3 text-primary">Earnings &amp; Legal</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/30 flex flex-col justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
              Pending Payouts
            </span>
            <div className="mt-2">
              <span className="text-h2 font-h2 text-primary">$1,120.00</span>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                Scheduled for release on Jun 25
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/30 flex flex-col justify-between relative">
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
                {pendingBookings.length}
              </span>
              <p className="text-body-sm font-body-sm text-error">
                Review required for active bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-error-container/20 border border-error/20 p-4 rounded-lg flex items-center gap-4">
          <span className="material-symbols-outlined text-error">error</span>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-body-sm font-medium text-on-error-container">
              You have {pendingBookings.length} booking request
              {pendingBookings.length === 1 ? "" : "s"} waiting for approval
            </p>
            <button
              className="text-body-sm font-bold text-error underline underline-offset-4 text-left md:text-right"
              type="button"
            >
              Review Requests
            </button>
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
                <tr>
                  <td className="px-6 py-4">#INV-2024-081</td>
                  <td className="px-6 py-4">West Chelsea Studio</td>
                  <td className="px-6 py-4 font-bold">$1,850.00</td>
                  <td className="px-6 py-4 text-secondary">Paid</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">#INV-2024-080</td>
                  <td className="px-6 py-4">Tribeca Vault</td>
                  <td className="px-6 py-4 font-bold">$2,430.00</td>
                  <td className="px-6 py-4 text-secondary">Paid</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">#INV-2024-079</td>
                  <td className="px-6 py-4">Midtown Locker</td>
                  <td className="px-6 py-4 font-bold">$920.00</td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    Processing
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-outline-variant/10 text-center">
            <button
              className="text-primary-container text-body-sm font-bold hover:underline"
              type="button"
            >
              View All Invoices
            </button>
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
            {ownerListings.length ? (
              ownerListings.map((listing) => (
                <article
                  className="group bg-white rounded-lg overflow-hidden border border-outline-variant/20 hover:shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all"
                  key={listing.id}
                >
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={
                        listing.imageUrl ??
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhnrtJ57vRKyPKnJ6oLkdjsp6Tu_-Fac1QsViHGr7BL6TzplQO6joQiIK7i_sLWQSwaZd6_KgaVuGSRKCA2skyJamejpIc0EDOc-xg4MnGTmLLWyE6NyxzzqD-8qs2GWXwxtCMcHgzlpaiQqMyvrzreOdFHzZONt0V9jFDrjbaGDwYkskZxVm5b0NwhnYVSwMuH6I-mw1q9wlBzTk692BeCH5m0XHr2boBicvEchpnen5GA-VpZczZoeiGnjVfO9YBDilppi3Z2M8"
                      }
                    />
                    <span className="absolute top-4 right-4 bg-secondary-container text-on-secondary-fixed text-label-caps font-label-caps px-3 py-1 rounded-full">
                      {listing.status}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-h3 font-h3 text-primary">
                        {listing.title}
                      </h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">
                        {listing.storageType} • {listing.sizeSqFt ?? 0} sq ft
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-outline-variant/10 pt-4 gap-4">
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

        <aside className="space-y-6">
          <h2 className="text-h2 font-h2 text-primary">Recent Activity</h2>

          <div className="bg-surface-container-low rounded-lg p-6 space-y-6 border border-outline-variant/30">
            {ownerBookings.length ? (
              ownerBookings.slice(0, 4).map((booking, index) => (
                <div className="flex gap-4 items-start" key={booking.id}>
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-md">
                      {index === 0 ? "event_available" : index === 1 ? "mail" : index === 2 ? "payments" : "reviews"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      <span className="font-bold">{booking.renter.fullName}</span>{" "}
                      requested <span className="font-bold">{booking.listing.title}</span>
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      {booking.status} •{" "}
                      {new Date(booking.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-md">
                      event_available
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      <span className="font-bold">Sarah M.</span> booked{" "}
                      <span className="font-bold">West Chelsea Studio</span>
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      2 HOURS AGO
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-tertiary-fixed text-md">
                      mail
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      Message from <span className="font-bold">David K.</span>{" "}
                      regarding Tribeca accessibility
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      5 HOURS AGO
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary-fixed text-md">
                      payments
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      Payout of <span className="font-bold">$1,250</span> initiated
                      to bank account
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      YESTERDAY
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-md">
                      reviews
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-body-sm text-on-surface">
                      <span className="font-bold">Leo T.</span> left a 5-star review
                      for Midtown Locker
                    </p>
                    <p className="text-label-caps font-label-caps text-on-surface-variant">
                      2 DAYS AGO
                    </p>
                  </div>
                </div>
              </>
            )}

            <button
              className="w-full text-center py-2 border border-outline-variant/30 rounded-full text-body-sm font-medium text-primary hover:bg-surface-container transition-colors"
              type="button"
            >
              View All Activity
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
