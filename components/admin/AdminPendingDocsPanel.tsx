"use client";

import { useEffect, useState } from "react";

type Doc = {
  id: string;
  type: "IDENTITY" | "OWNERSHIP_PROOF";
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    ownerName: string;
    ownerEmail: string;
    listingTitle: string;
    listingCity: string;
  } | null;
};

const TYPE_LABELS: Record<string, string> = {
  IDENTITY: "Identity",
  OWNERSHIP_PROOF: "Ownership Proof",
};

const TYPE_ICONS: Record<string, string> = {
  IDENTITY: "badge",
  OWNERSHIP_PROOF: "home_work",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-[#4b6547]/10 text-[#4b6547]",
  REJECTED: "bg-error/10 text-error",
};

type Props = {
  /** When set, fetches docs for that specific booking. When omitted, fetches all pending docs. */
  bookingId?: string;
  onDocActioned?: () => void;
};

export default function AdminPendingDocsPanel({ bookingId, onDocActioned }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const url = bookingId
    ? `/api/admin/bookings/${bookingId}/documents`
    : `/api/admin/temporary-documents?limit=50`;

  useEffect(() => {
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { documents: Doc[] }) => setDocs(data.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  async function handleAction(docId: string, action: "approve" | "reject") {
    setBusyId(docId);
    setErrors((prev) => { const next = { ...prev }; delete next[docId]; return next; });

    try {
      const res = await fetch(`/api/admin/temporary-documents/${docId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setErrors((prev) => ({ ...prev, [docId]: data.error ?? "Action failed" }));
        return;
      }

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: action === "approve" ? "APPROVED" : "REJECTED" }
            : d,
        ),
      );
      onDocActioned?.();
    } catch {
      setErrors((prev) => ({ ...prev, [docId]: "Request failed" }));
    } finally {
      setBusyId(null);
    }
  }

  const pendingDocs = docs.filter((d) => d.status === "PENDING");
  const otherDocs = docs.filter((d) => d.status !== "PENDING");

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-[14px] bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="text-body-sm text-on-surface-variant py-2">No documents uploaded yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {pendingDocs.length === 0 && otherDocs.length > 0 && (
        <p className="text-[11px] text-[#4b6547] font-semibold py-1">All documents reviewed.</p>
      )}

      {[...pendingDocs, ...otherDocs].map((doc) => (
        <div
          key={doc.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[14px] border border-outline-variant/40 bg-surface px-4 py-3"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
              {TYPE_ICONS[doc.type] ?? "description"}
            </span>
            <span className="text-body-sm font-medium text-on-surface">
              {TYPE_LABELS[doc.type] ?? doc.type}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[doc.status] ?? ""}`}>
              {doc.status}
            </span>
            {!bookingId && doc.booking && (
              <span className="text-[11px] text-on-surface-variant truncate">
                {doc.booking.listingTitle} · {doc.booking.bookingNumber} · {doc.booking.ownerName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors"
              href={doc.fileUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              View
            </a>

            {doc.status === "PENDING" && (
              <>
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-[#4b6547] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={busyId !== null}
                  type="button"
                  onClick={() => void handleAction(doc.id, "approve")}
                >
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  {busyId === doc.id ? "…" : "Approve"}
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                  disabled={busyId !== null}
                  type="button"
                  onClick={() => void handleAction(doc.id, "reject")}
                >
                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                  {busyId === doc.id ? "…" : "Reject"}
                </button>
              </>
            )}

            {errors[doc.id] && (
              <span className="text-[10px] text-error font-medium">{errors[doc.id]}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
