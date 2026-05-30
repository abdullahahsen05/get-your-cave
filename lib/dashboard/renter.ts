import { BookingStatus } from "@prisma/client";

import { getRenterBookings } from "@/lib/bookings";
import { getInvoicesForViewer, type SafeInvoice } from "@/lib/invoices/generateInvoice";

type RenterBooking = Awaited<ReturnType<typeof getRenterBookings>>[number];

export type RenterDashboardSnapshot = {
  renterBookings: RenterBooking[];
  activeBookings: RenterBooking[];
  pendingBookings: RenterBooking[];
  rejectedBookings: RenterBooking[];
  pastBookings: RenterBooking[];
  documents: Array<{
    id: string;
    bookingId: string;
    bookingNumber: string;
    bookingTitle: string;
    contractId: string;
    contractNumber: string | null;
    contractStatus: string | null;
    downloadHref: string;
  }>;
  pendingBookingsCount: number;
  totalPaidAmount: string;
  outstandingAmount: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  paymentRequiredInvoice: SafeInvoice | null;
  recentInvoices: SafeInvoice[];
  paymentMethodLabel: string;
};

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

export function formatRenterDateRange(startDate: Date, endDate: Date | null) {
  const start = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(startDate);

  const end = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate ?? startDate);

  return `${start} - ${end}`;
}

export async function getRenterDashboardSnapshot(renterProfileId: string) {
  const [renterBookings, invoicesResult] = await Promise.all([
    getRenterBookings(renterProfileId),
    getInvoicesForViewer(
      {
        role: "RENTER",
        ownerProfileId: null,
        renterProfileId,
      },
      {
        pageSize: 10,
      },
    ),
  ]);

  const activeBookings = renterBookings.filter(
    (booking) =>
      booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.ACTIVE,
  );
  const pendingBookings = renterBookings.filter(
    (booking) => booking.status === BookingStatus.PENDING,
  );
  const rejectedBookings = renterBookings.filter(
    (booking) => booking.status === BookingStatus.REJECTED,
  );
  const pastBookings = renterBookings.filter(
    (booking) =>
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED,
  );
  const pendingBookingsCount = pendingBookings.length;

  const invoiceRows = invoicesResult.invoices.slice(0, 3);
  const paidInvoices = invoicesResult.invoices.filter((invoice) => invoice.status === "PAID");
  const openInvoices = invoicesResult.invoices.filter((invoice) =>
    ["DRAFT", "ISSUED", "OVERDUE"].includes(invoice.status),
  );

  const latestPaidInvoice = paidInvoices[0] ?? null;
  const documentBookings = renterBookings.filter((booking) => Boolean(booking.contractId));
  const paymentRequiredInvoice = openInvoices
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.dueAt ?? a.issuedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.dueAt ?? b.issuedAt ?? b.createdAt).getTime();
      return dateA - dateB;
    })[0] ?? null;

  const nextPaymentDate = paymentRequiredInvoice
    ? new Date(
        paymentRequiredInvoice.dueAt ??
          paymentRequiredInvoice.issuedAt ??
          paymentRequiredInvoice.createdAt,
      )
    : activeBookings[0]
      ? addMonths(new Date(activeBookings[0].startDate), 1)
      : null;

  return {
    renterBookings,
    activeBookings,
    pendingBookings,
    rejectedBookings,
    pastBookings,
    pendingBookingsCount,
    documents: documentBookings.map((booking) => ({
      id: booking.contractId as string,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bookingTitle: booking.listing.title,
      contractId: booking.contractId as string,
      contractNumber: booking.contractNumber,
      contractStatus: booking.contractStatus,
      downloadHref: `/api/contracts/${booking.contractId}/download`,
    })),
    totalPaidAmount: invoicesResult.summary.paidAmount,
    outstandingAmount: invoicesResult.summary.openAmount,
    lastPaymentDate: latestPaidInvoice
      ? latestPaidInvoice.paidAt ?? latestPaidInvoice.issuedAt ?? latestPaidInvoice.createdAt
      : null,
    nextPaymentDate: nextPaymentDate?.toISOString() ?? null,
    paymentRequiredInvoice,
    recentInvoices: invoiceRows,
    paymentMethodLabel: latestPaidInvoice ? "Stripe" : "Not set",
  };
}
