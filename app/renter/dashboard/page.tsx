import Link from "next/link";
import { redirect } from "next/navigation";

import RenterBookingActions from "@/components/renter/RenterBookingActions";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { getRenterDashboardSnapshot, formatRenterDateRange } from "@/lib/dashboard/renter";
import { formatCurrency } from "@/lib/invoices/formatCurrency";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

function formatFullDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPastRentalStatus(status: string) {
  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return status;
}

export const dynamic = "force-dynamic";

export default async function RenterDashboardPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/renter/dashboard");
  }

  if (currentUser.role !== "RENTER") {
    redirect(getDashboardPath(currentUser.role));
  }

  if (!currentUser.renterProfile) {
    redirect("/login?next=/renter/dashboard");
  }

  const dashboard = await getRenterDashboardSnapshot(currentUser.renterProfile.id);
  const activeUnitCount = dashboard.activeBookings.length;
  const totalSavedSqFt = dashboard.activeBookings.reduce((total, booking) => {
    return total + (booking.listing.sizeSqFt ?? 0);
  }, 0);
  const invoiceHrefByBookingId = new Map(
    dashboard.recentInvoices.map((invoice) => [invoice.bookingId, `/invoices/${invoice.id}`]),
  );

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed antialiased max-w-[1200px] mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
      <header className="mb-12">
        <h1 className="font-h1 text-h1 text-primary mb-2">
          {t("dashboard.renter.welcome", { name: currentUser.fullName ?? "Julian" })}
        </h1>
        <p className="font-body-md text-body-md text-outline">
          {t("dashboard.renter.summary", {
            active: activeUnitCount,
            pending: dashboard.pendingBookingsCount,
          })}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            {t("dashboard.renter.activeRentals")}
          </p>
          <p className="font-h2 text-h2 text-primary">{activeUnitCount}</p>
          <div className="mt-4 w-full bg-surface-container h-1.5 rounded-full">
            <div
              className="bg-secondary-fixed-dim h-full rounded-full"
              style={{ width: `${Math.min(100, activeUnitCount * 33)}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            {t("dashboard.renter.nextPayment")}
          </p>
          <p className="font-h2 text-h2 text-primary">{formatFullDate(dashboard.nextPaymentDate, locale)}</p>
          <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">event</span>
            {t("dashboard.renter.autoPayEnabled")}
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
          <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
            {t("dashboard.renter.totalSaved")}
          </p>
          <p className="font-h2 text-h2 text-primary">{`${totalSavedSqFt} sq ft`}</p>
          <p className="text-body-sm font-body-sm text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {t("dashboard.renter.verifiedCapacity")}
          </p>
        </div>
      </section>

      <section className="mb-16" id="active-rentals">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.currentSpaces")}</h2>
          <a
            className="text-body-sm font-body-sm text-primary font-bold hover:underline underline-offset-4"
            href="#active-rentals"
          >
            {t("common.viewDetails")}
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {dashboard.activeBookings.length ? (
            dashboard.activeBookings.map((booking) => (
              <article
                className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8] transition-all hover:translate-y-[-4px]"
                key={booking.id}
              >
                <div className="h-56 sm:h-64 relative overflow-hidden">
                  <img
                    alt={booking.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={booking.listing.imageUrl ?? "/placeholder-listing.svg"}
                  />
                  <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {booking.status === "ACTIVE" ? t("status.booking.ACTIVE") : t("status.booking.APPROVED")}
                  </span>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                    <div>
                      <h3 className="font-h3 text-h3 text-primary mb-1">{booking.listing.title}</h3>
                      <p className="font-body-sm text-body-sm text-outline">{booking.listing.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-h3 text-h3 text-primary">
                        {formatCurrency(booking.monthlyPrice)}
                      </p>
                      <p className="font-body-sm text-body-sm text-outline">{t("listing.monthly")}</p>
                    </div>
                  </div>

                  <RenterBookingActions
                    bookingId={booking.id}
                    listingId={booking.listing.id}
                    manageLabel={t("dashboard.renter.manageUnit")}
                    receiptHref={invoiceHrefByBookingId.get(booking.id) ?? null}
                    status={booking.status}
                  />
                </div>
              </article>
            ))
          ) : (
            <div className="lg:col-span-2 rounded-lg border border-[#EBEBE8] bg-surface-container-lowest p-8 text-body-sm text-on-surface-variant">
              {t("dashboard.renter.noBookings")}
            </div>
          )}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.recentInvoices")}</h2>
          <Link
            className="text-body-sm font-body-sm text-primary font-bold hover:underline underline-offset-4"
            href="/invoices"
          >
            {t("dashboard.renter.viewAllInvoices")}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.totalPaid")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(dashboard.totalPaidAmount, "EUR")}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.outstanding")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(dashboard.outstandingAmount, "EUR")}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-[#EBEBE8]">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.latestPayment")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatFullDate(dashboard.lastPaymentDate, locale)}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#EBEBE8] bg-surface-container-low">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {t("invoices.invoiceNumber")}
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {t("invoices.booking")}
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {t("invoices.total")}
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {t("common.status")}
                  </th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {t("invoices.due")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EBEBE8]">
                {dashboard.recentInvoices.length ? (
                  dashboard.recentInvoices.map((invoice) => (
                    <tr className="hover:bg-surface-container-low transition-colors" key={invoice.id}>
                      <td className="px-6 py-4 font-body-sm text-primary">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 font-body-sm text-primary">{invoice.bookingTitle}</td>
                      <td className="px-6 py-4 font-body-sm text-primary font-semibold">
                        {formatCurrency(invoice.totalAmount, "EUR")}
                      </td>
                      <td className="px-6 py-4 text-secondary">{invoice.statusLabel}</td>
                      <td className="px-6 py-4 font-body-sm text-outline">
                        {formatFullDate(invoice.issuedAt ?? invoice.createdAt, locale)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-on-surface-variant" colSpan={5}>
                      {t("dashboard.renter.noInvoices")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-h2 text-h2 text-primary mb-8">{t("dashboard.renter.pastRentals")}</h2>

        <div className="space-y-4">
          {dashboard.pastBookings.length ? (
            dashboard.pastBookings.slice(0, 4).map((booking) => {
              const endDate = booking.endDate ?? booking.completedAt ?? booking.cancelledAt ?? booking.updatedAt;

              return (
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 sm:p-6 bg-surface-container-lowest rounded-lg border border-[#EBEBE8] gap-4"
                  key={booking.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0">
                      <img
                        alt={booking.listing.title}
                        className="w-full h-full object-cover"
                        src={booking.listing.imageUrl ?? "/placeholder-listing.svg"}
                      />
                    </div>
                    <div>
                      <h4 className="font-body-lg text-body-lg text-primary font-bold">
                        {booking.listing.title}
                      </h4>
                      <p className="font-body-sm text-body-sm text-outline">
                        {formatRenterDateRange(new Date(booking.startDate), new Date(endDate))}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:justify-end gap-4 sm:gap-12">
                    <div className="text-right">
                      <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">
                        {t(`status.booking.${booking.status}`)}
                      </p>
                      <p className="font-body-md text-body-md text-primary font-semibold">
                        {formatCurrency(booking.monthlyPrice)}/mo
                      </p>
                    </div>
                    <Link
                      className="text-primary-container font-bold hover:underline underline-offset-4 text-sm"
                      href={invoiceHrefByBookingId.get(booking.id) ?? "/invoices"}
                    >
                      {t("dashboard.renter.downloadReceipt")}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-[#EBEBE8] bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant">
              {t("dashboard.renter.noPastRentals")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
