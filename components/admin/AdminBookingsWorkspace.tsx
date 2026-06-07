"use client";

import { useEffect, useState } from "react";
import AdminPendingDocsPanel from "./AdminPendingDocsPanel";

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  monthlyPrice: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  listingTitle: string;
  listingCity: string;
  ownerName: string;
  ownerEmail: string;
  renterName: string;
  renterEmail: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-secondary-container/30 text-on-secondary-container",
  ACTIVE: "bg-[#4b6547]/10 text-[#4b6547]",
  COMPLETED: "bg-surface-container-highest text-on-surface-variant",
  CANCELLED: "bg-error-container/30 text-on-error-container",
  REJECTED: "bg-error-container/30 text-on-error-container",
  DOCUMENTS_REQUIRED: "bg-amber-100 text-amber-700",
  ADMIN_REVIEW: "bg-secondary-container/50 text-on-secondary-container",
};

const REQUEST_DOCS_ELIGIBLE = ["APPROVED", "ACTIVE"];

export default function AdminBookingsWorkspace() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter) params.set("status", filter);

    fetch(`/api/admin/bookings?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { bookings: Booking[]; total: number }) => {
        setBookings(data.bookings ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, page]);

  async function handleRequestDocs(bookingId: string) {
    setBusyId(bookingId);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/request-documents`, {
        method: "PATCH",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setNotice({ id: bookingId, msg: data.error ?? "Failed", ok: false });
      } else {
        setNotice({ id: bookingId, msg: "Documents requested — booking set to DOCUMENTS_REQUIRED", ok: true });
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "DOCUMENTS_REQUIRED" } : b)),
        );
      }
    } catch {
      setNotice({ id: bookingId, msg: "Request failed", ok: false });
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-h1 text-primary">Bookings</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {total} booking{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <select
          className="min-h-11 rounded-full border border-outline-variant/60 bg-surface px-4 py-2 text-body-sm font-medium text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
          <option value="DOCUMENTS_REQUIRED">Documents Required</option>
          <option value="ADMIN_REVIEW">Admin Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[20px] bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-[20px] border border-outline-variant/60 bg-surface px-6 py-12 text-center text-on-surface-variant">
          No bookings found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-outline-variant/60 bg-surface shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Booking #", "Listing", "Owner", "Renter", "Monthly", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant border-b border-outline-variant/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {bookings.map((b) => (
                  <>
                    <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-4 text-body-sm font-medium text-primary whitespace-nowrap">
                        {b.bookingNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm font-medium text-on-surface">{b.listingTitle}</p>
                        <p className="text-[11px] text-on-surface-variant">{b.listingCity}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface">{b.ownerName}</p>
                        <p className="text-[11px] text-on-surface-variant">{b.ownerEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-body-sm text-on-surface">{b.renterName}</p>
                        <p className="text-[11px] text-on-surface-variant">{b.renterEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-body-sm font-semibold text-on-surface whitespace-nowrap">
                        €{Number(b.monthlyPrice).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[b.status] ?? "bg-surface-container text-on-surface"}`}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                        {notice?.id === b.id && (
                          <p className={`text-[11px] mt-1 font-medium ${notice.ok ? "text-[#4b6547]" : "text-error"}`}>
                            {notice.msg}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {REQUEST_DOCS_ELIGIBLE.includes(b.status) && (
                            <button
                              className="rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-secondary hover:bg-[#d9590f] transition-colors disabled:opacity-50 whitespace-nowrap"
                              disabled={busyId === b.id}
                              type="button"
                              onClick={() => void handleRequestDocs(b.id)}
                            >
                              {busyId === b.id ? "…" : "Request Docs"}
                            </button>
                          )}
                          {(b.status === "ADMIN_REVIEW" || b.status === "DOCUMENTS_REQUIRED") && (
                            <button
                              className="rounded-full border border-secondary/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary hover:bg-secondary-container/20 transition-colors whitespace-nowrap"
                              type="button"
                              onClick={() => setExpandedDocId(expandedDocId === b.id ? null : b.id)}
                            >
                              {expandedDocId === b.id ? "Hide Docs" : "View Docs"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedDocId === b.id && (
                      <tr key={`${b.id}-docs`}>
                        <td colSpan={7} className="px-5 pb-5 pt-0 bg-surface-container-low/40">
                          <div className="rounded-[16px] border border-outline-variant/40 bg-surface p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                              Documents — {b.bookingNumber}
                            </p>
                            <AdminPendingDocsPanel
                              bookingId={b.id}
                              onDocActioned={() => {
                                setBookings((prev) =>
                                  prev.map((bk) =>
                                    bk.id === b.id ? { ...bk, status: "ADMIN_REVIEW" } : bk,
                                  ),
                                );
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="rounded-full border border-outline-variant/60 px-4 py-2 text-body-sm font-medium text-primary hover:bg-surface-container-low disabled:opacity-40"
            disabled={page === 1}
            type="button"
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-body-sm text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <button
            className="rounded-full border border-outline-variant/60 px-4 py-2 text-body-sm font-medium text-primary hover:bg-surface-container-low disabled:opacity-40"
            disabled={page === totalPages}
            type="button"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
