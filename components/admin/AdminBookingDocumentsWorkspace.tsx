"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type TempDoc = {
  id: string;
  type: "IDENTITY" | "OWNERSHIP_PROOF";
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    ownerName: string;
    ownerEmail: string;
    listingTitle: string;
    listingCity: string;
  } | null;
};

type Props = {
  initialDocs: TempDoc[];
  total: number;
};

const TYPE_LABELS: Record<TempDoc["type"], string> = {
  IDENTITY: "Identity Document",
  OWNERSHIP_PROOF: "Ownership Proof",
};

const TYPE_ICONS: Record<TempDoc["type"], string> = {
  IDENTITY: "badge",
  OWNERSHIP_PROOF: "home_work",
};

export default function AdminBookingDocumentsWorkspace({ initialDocs, total }: Props) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<TempDoc[]>(initialDocs);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleApprove(docId: string) {
    setBusyId(docId);
    setErrorId(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/temporary-documents/${docId}/approve`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setErrorId(docId);
        setErrorMsg(data.error ?? t("errors.generic"));
        return;
      }

      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setErrorId(docId);
      setErrorMsg(t("errors.generic"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(docId: string) {
    setBusyId(docId);
    setErrorId(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/temporary-documents/${docId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setErrorId(docId);
        setErrorMsg(data.error ?? t("errors.generic"));
        return;
      }

      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setErrorId(docId);
      setErrorMsg(t("errors.generic"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-h2 text-primary">{t("bookingDocs.adminPendingTitle")}</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {total === 0
              ? t("bookingDocs.adminNoPending")
              : t("bookingDocs.adminPendingCount", { count: total })}
          </p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-10 text-center text-on-surface-variant text-body-sm">
          {t("bookingDocs.adminNoPending")}
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <article
              key={doc.id}
              className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      {TYPE_ICONS[doc.type]}
                    </span>
                    <span className="text-body-sm font-semibold text-primary">
                      {TYPE_LABELS[doc.type]}
                    </span>
                    <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                      {t("bookingDocs.pending")}
                    </span>
                  </div>

                  {doc.booking && (
                    <div className="text-body-sm text-on-surface-variant space-y-0.5">
                      <p className="font-medium text-on-surface">
                        {doc.booking.listingTitle} — {doc.booking.listingCity}
                      </p>
                      <p>
                        {t("bookingDocs.bookingRef")}: {doc.booking.bookingNumber}
                      </p>
                      <p>
                        {doc.booking.ownerName} ({doc.booking.ownerEmail})
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-on-surface-variant">
                    {t("bookingDocs.submittedAt")}:{" "}
                    {new Date(doc.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
                  <a
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant/70 bg-surface-container-low px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-surface-container transition-colors"
                    href={doc.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    {t("bookingDocs.viewDocument")}
                  </a>

                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-[#4b6547] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                    disabled={busyId !== null}
                    type="button"
                    onClick={() => handleApprove(doc.id)}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {busyId === doc.id ? t("common.loading") : t("bookingDocs.adminApprove")}
                  </button>

                  <button
                    className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                    disabled={busyId !== null}
                    type="button"
                    onClick={() => handleReject(doc.id)}
                  >
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                    {busyId === doc.id ? t("common.loading") : t("bookingDocs.adminReject")}
                  </button>

                  {errorId === doc.id && errorMsg && (
                    <p className="text-xs text-error font-medium">{errorMsg}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
