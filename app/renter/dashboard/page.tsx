import Link from "next/link";
import { redirect } from "next/navigation";

import RenterBookingActions from "@/components/renter/RenterBookingActions";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { getRenterDashboardSnapshot, formatRenterDateRange } from "@/lib/dashboard/renter";
import { formatCurrency } from "@/lib/invoices/formatCurrency";
import { getInvoiceStatusClass, getInvoiceStatusLabel } from "@/lib/invoices/invoiceTypes";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";
import { formatSquareMeters, resolveAreaInSquareMeters } from "@/lib/units";

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

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  supporting,
  icon,
  progress,
}: {
  label: string;
  value: string | number;
  supporting?: string;
  icon: string;
  progress?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(15,61,62,0.07)] sm:p-6 lg:p-7">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-secondary-container/30 opacity-60 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex min-h-[150px] flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <p className="font-label-caps text-label-caps uppercase tracking-widest text-outline">
            {label}
          </p>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        </div>

        <div>
          <p className="font-h2 text-h2 leading-none text-primary">{value}</p>
          {supporting ? (
            <p className="mt-3 flex items-center gap-1.5 text-body-sm font-body-sm text-secondary">
              {supporting}
            </p>
          ) : null}
        </div>

        {typeof progress === "number" ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-secondary-fixed-dim transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
  const totalSavedAreaM2 = dashboard.activeBookings.reduce((total, booking) => {
    return total + (resolveAreaInSquareMeters(booking.listing.sizeM2, booking.listing.sizeSqFt) ?? 0);
  }, 0);
  const invoiceHrefByBookingId = new Map(
    dashboard.recentInvoices.map((invoice) => [invoice.bookingId, `/invoices/${invoice.id}`]),
  );

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed antialiased">
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      <header className="mb-10 rounded-[28px] border border-[#EBEBE8] bg-surface-container-lowest px-5 py-6 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:px-7 sm:py-8 lg:px-10">
        <p className="mb-3 font-label-caps text-label-caps uppercase tracking-widest text-secondary">{t("dashboard.renter.title")}</p>
        <h1 className="max-w-4xl font-h1 text-h1 leading-tight text-primary">
          {t("dashboard.renter.welcome", { name: currentUser.fullName ?? t("common.renter") })}
        </h1>
        <p className="mt-3 max-w-3xl font-body-md text-body-md leading-7 text-outline">
          {t("dashboard.renter.summary", {
            active: activeUnitCount,
            pending: dashboard.pendingBookingsCount,
          })}
        </p>
      </header>

      <section className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
        <StatCard
          icon="inventory_2"
          label={t("dashboard.renter.activeRentals")}
          progress={activeUnitCount * 33}
          supporting={t("dashboard.renter.currentSpaces")}
          value={activeUnitCount}
        />
        <StatCard
          icon="event"
          label={t("dashboard.renter.nextPayment")}
          supporting={t("dashboard.renter.autoPayEnabled")}
          value={formatFullDate(dashboard.nextPaymentDate, locale)}
        />
        <StatCard
          icon="check_circle"
          label={t("dashboard.renter.totalSaved")}
          supporting={t("dashboard.renter.verifiedCapacity")}
          value={formatSquareMeters(totalSavedAreaM2, 0)}
        />
      </section>

      {dashboard.paymentRequiredInvoice ? (
        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
            <div>
              <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.paymentRequired")}</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {t("dashboard.renter.paymentRequiredDescription")}
              </p>
            </div>
            <span className="text-body-sm font-body-sm text-outline">
              {t("dashboard.renter.invoiceDue")}
            </span>
          </div>

          <article className="rounded-[24px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-7 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3">
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {dashboard.paymentRequiredInvoice.invoiceNumber}
                </p>
                <div>
                  <h3 className="font-h3 text-h3 text-primary">
                    {dashboard.paymentRequiredInvoice.bookingTitle}
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    {dashboard.paymentRequiredInvoice.bookingAddress}{t("app.renter.dashboard.page.text.text.3f2783f4")}{" "}
                    {dashboard.paymentRequiredInvoice.bookingCity}
                  </p>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoices.booking")}{t("app.renter.dashboard.page.text.text.b339b1c4")} {dashboard.paymentRequiredInvoice.bookingNumber}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${getInvoiceStatusClass(dashboard.paymentRequiredInvoice.status)}`}
                >
                  {getInvoiceStatusLabel(dashboard.paymentRequiredInvoice.status, locale)}
                </span>

                <div className="text-left sm:text-right lg:text-right">
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">
                    {t("dashboard.renter.outstanding")}
                  </p>
                  <p className="font-h3 text-h3 text-primary">
                    {formatCurrency(dashboard.paymentRequiredInvoice.totalAmount, "EUR")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#EBEBE8] pt-6">
              <div className="space-y-1">
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("invoiceDetail.dueAt")}{t("app.renter.dashboard.page.text.text.b339b1c4")}{" "}
                  {formatFullDate(dashboard.paymentRequiredInvoice.dueAt, locale)}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("dashboard.renter.invoiceReady")}
                </p>
              </div>

              <Link
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-label-caps font-label-caps text-on-primary"
                href={`/invoices/${dashboard.paymentRequiredInvoice.id}`}
              >
                {t("dashboard.renter.openInvoice")}
              </Link>
            </div>
          </article>
        </section>
      ) : null}

      <section className="mb-14">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.pendingRequests")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {dashboard.pendingBookingsCount === 0
                ? t("dashboard.renter.noBookingRequests")
                : t("dashboard.renter.pendingRequests")}
            </p>
          </div>
          <span className="text-body-sm font-body-sm text-outline">
            {dashboard.pendingBookingsCount} {t("dashboard.renter.waitingForApproval")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {dashboard.pendingBookings.length ? (
            dashboard.pendingBookings.map((booking) => (
              <article
                className="group overflow-hidden rounded-[24px] border border-[#EBEBE8] bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,61,62,0.08)]"
                key={booking.id}
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <img
                    alt={booking.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={booking.listing.imageUrl ?? "/placeholder-listing.svg"}
                  />
                  <span className="absolute top-4 left-4 bg-[#F4E6C8] text-[#5A3A00] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {t(`status.booking.${booking.status}`)}
                  </span>
                </div>

                <div className="p-5 sm:p-6 lg:p-7">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-h3 text-h3 text-primary mb-1">{booking.listing.title}</h3>
                      <p className="font-body-sm text-body-sm text-outline">{booking.listing.address}</p>
                      <p className="font-body-sm text-body-sm text-outline">
                        {formatDateRange(booking.startDate, booking.endDate, locale)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-h3 text-h3 text-primary">
                        {formatCurrency(booking.totalMonthlyAmount, "EUR")}
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
              {t("dashboard.renter.noBookingRequests")}
            </div>
          )}
        </div>
      </section>

      <section className="mb-14">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.rejectedRequests")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {dashboard.rejectedBookings.length
                ? t("dashboard.renter.rejectedRequests")
                : t("dashboard.renter.noBookingRequests")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dashboard.rejectedBookings.length ? (
            dashboard.rejectedBookings.map((booking) => (
              <div
                className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.03)] sm:p-6 md:flex-row md:items-center"
                key={booking.id}
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
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
                      {formatDateRange(booking.startDate, booking.endDate, locale)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between md:justify-end gap-4 sm:gap-12">
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-secondary mb-1 uppercase tracking-widest">
                      {t(`status.booking.${booking.status}`)}
                    </p>
                    <p className="font-body-md text-body-md text-primary font-semibold">
                      {formatCurrency(booking.totalMonthlyAmount, "EUR")}
                    </p>
                  </div>
                  <RenterBookingActions
                    bookingId={booking.id}
                    listingId={booking.listing.id}
                    manageLabel={t("dashboard.renter.manageUnit")}
                    receiptHref={invoiceHrefByBookingId.get(booking.id) ?? null}
                    status={booking.status}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant">
              {t("dashboard.renter.noBookingRequests")}
            </div>
          )}
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {dashboard.activeBookings.length ? (
            dashboard.activeBookings.map((booking) => (
              <article
                className="group overflow-hidden rounded-[24px] border border-[#EBEBE8] bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,61,62,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,61,62,0.08)]"
                key={booking.id}
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <img
                    alt={booking.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={booking.listing.imageUrl ?? "/placeholder-listing.svg"}
                  />
                  <span className="absolute top-4 left-4 bg-[#CDEBC5] text-[#092009] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {booking.status === "ACTIVE" ? t("status.booking.ACTIVE") : t("status.booking.APPROVED")}
                  </span>
                </div>

                <div className="p-5 sm:p-6 lg:p-7">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      <section className="mb-14">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="font-h2 text-h2 text-primary">{t("dashboard.renter.documents")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.renter.documentsDescription")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 mb-8">
          <div className="rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-6 lg:p-7">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.paymentMethod")}
            </p>
            <p className="font-h2 text-h2 text-primary">{dashboard.paymentMethodLabel}</p>
            <p className="mt-3 text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.renter.paymentMethodHint")}
            </p>
          </div>

          <div className="rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-6 lg:p-7">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.documents")}
            </p>
            <p className="font-h2 text-h2 text-primary">{dashboard.documents.length}</p>
            <p className="mt-3 text-body-sm font-body-sm text-on-surface-variant">
              {t("dashboard.renter.documentsDescription")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dashboard.documents.length ? (
            dashboard.documents.map((document) => (
              <div
                className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.03)] sm:p-6 md:flex-row md:items-center"
                key={document.id}
              >
                <div>
                  <h4 className="font-body-lg text-body-lg text-primary font-bold">
                    {document.bookingTitle}
                  </h4>
                  <p className="font-body-sm text-body-sm text-outline">
                    {document.bookingNumber}
                  </p>
                  <p className="font-label-caps text-label-caps text-secondary mt-2 uppercase tracking-widest">
                    {document.contractNumber ?? t("dashboard.renter.documents")}
                  </p>
                </div>

                <Link
                  className="text-primary-container font-bold hover:underline underline-offset-4 text-sm"
                  href={document.downloadHref}
                >
                  {t("dashboard.renter.downloadContract")}
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant">
              {t("dashboard.renter.noDocuments")}
            </div>
          )}
        </div>
      </section>

      <section className="mb-14">
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
          <div className="rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-6 lg:p-7">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.totalPaid")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(dashboard.totalPaidAmount, "EUR")}
            </p>
          </div>

          <div className="rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-6 lg:p-7">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.outstanding")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatCurrency(dashboard.outstandingAmount, "EUR")}
            </p>
          </div>

          <div className="rounded-[22px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.04)] sm:p-6 lg:p-7">
            <p className="font-label-caps text-label-caps text-outline mb-2 uppercase tracking-widest">
              {t("dashboard.renter.latestPayment")}
            </p>
            <p className="font-h2 text-h2 text-primary">
              {formatFullDate(dashboard.lastPaymentDate, locale)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#EBEBE8] bg-surface-container-lowest shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
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
                  className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(15,61,62,0.03)] sm:p-6 md:flex-row md:items-center"
                  key={booking.id}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
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
                        {formatCurrency(booking.monthlyPrice)}{t("app.renter.dashboard.page.text.mo.db706c4c")}
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
            <div className="rounded-[20px] border border-[#EBEBE8] bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant">
              {t("dashboard.renter.noPastRentals")}
            </div>
          )}
        </div>
      </section>
      </div>
    </main>
  );
}
