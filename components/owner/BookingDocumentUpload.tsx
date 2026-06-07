"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TemporaryDocumentType } from "@prisma/client";

type TempDoc = {
  id: string;
  type: TemporaryDocumentType;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type DocListResponse = {
  bookingId: string;
  bookingStatus: string;
  documents: TempDoc[];
  requiredTypes: TemporaryDocumentType[];
};

type Props = {
  bookingId: string;
  bookingNumber: string;
  bookingStatus: string;
};

const REQUIRED_TYPES: TemporaryDocumentType[] = [
  TemporaryDocumentType.IDENTITY,
  TemporaryDocumentType.OWNERSHIP_PROOF,
];

function statusBadge(status: TempDoc["status"], t: (k: string) => string) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#4b6547]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#4b6547]">
        <span className="material-symbols-outlined text-[12px]">check_circle</span>
        {t("bookingDocs.approved")}
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-error">
        <span className="material-symbols-outlined text-[12px]">cancel</span>
        {t("bookingDocs.rejected")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
      <span className="material-symbols-outlined text-[12px]">schedule</span>
      {t("bookingDocs.pending")}
    </span>
  );
}

export default function BookingDocumentUpload({
  bookingId,
  bookingNumber,
  bookingStatus,
}: Props) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<TempDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<TemporaryDocumentType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<TemporaryDocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<TemporaryDocumentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings/${bookingId}/documents`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as DocListResponse;
        if (!cancelled) {
          setDocs(data.documents);
        }
      } catch {
        // fail silently — not critical
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDocs();
    return () => { cancelled = true; };
  }, [bookingId]);

  function getLatestDocForType(type: TemporaryDocumentType) {
    return docs.find((d) => d.type === type && d.status !== "REJECTED") ?? null;
  }

  function canUploadType(type: TemporaryDocumentType) {
    if (bookingStatus !== "DOCUMENTS_REQUIRED") return false;
    const existing = getLatestDocForType(type);
    // Allow re-upload if no non-rejected doc exists
    return !existing;
  }

  function handleUploadClick(type: TemporaryDocumentType) {
    pendingTypeRef.current = type;
    setUploadError(null);
    setUploadSuccess(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const type = pendingTypeRef.current;
    e.target.value = "";

    if (!file || !type) return;

    setUploadingType(type);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);

      const res = await fetch(`/api/bookings/${bookingId}/documents`, {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as { document?: TempDoc; error?: string };

      if (!res.ok || !data.document) {
        setUploadError(data.error ?? t("bookingDocs.uploadError"));
        return;
      }

      setDocs((prev) => [data.document!, ...prev]);
      setUploadSuccess(type);
    } catch {
      setUploadError(t("bookingDocs.uploadError"));
    } finally {
      setUploadingType(null);
    }
  }

  const isAdminReview = bookingStatus === "ADMIN_REVIEW";
  const typeLabels: Record<TemporaryDocumentType, string> = {
    IDENTITY: t("bookingDocs.identity"),
    OWNERSHIP_PROOF: t("bookingDocs.ownershipProof"),
  };

  return (
    <div className="mt-4 rounded-[20px] border border-secondary/20 bg-secondary-container/10 px-5 py-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">
          {isAdminReview ? "hourglass_top" : "upload_file"}
        </span>
        <div>
          <p className="font-semibold text-primary text-body-sm">
            {isAdminReview ? t("bookingDocs.adminReview") : t("bookingDocs.title")}
          </p>
          <p className="text-on-surface-variant text-[12px] mt-0.5">
            {isAdminReview
              ? t("bookingDocs.adminReviewSubtitle")
              : t("bookingDocs.subtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-8 rounded-xl bg-surface-container animate-pulse" />
      ) : (
        <div className="space-y-3">
          {REQUIRED_TYPES.map((type) => {
            const existing = getLatestDocForType(type);
            const canUpload = canUploadType(type);
            const isUploading = uploadingType === type;
            const wasJustUploaded = uploadSuccess === type;

            return (
              <div
                key={type}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-[14px] border border-outline-variant/40 bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    {type === TemporaryDocumentType.IDENTITY ? "badge" : "home_work"}
                  </span>
                  <span className="text-body-sm font-medium text-on-surface">
                    {typeLabels[type]}
                  </span>
                  {existing && statusBadge(existing.status, t)}
                </div>

                <div className="flex items-center gap-2">
                  {wasJustUploaded && (
                    <span className="text-[11px] text-[#4b6547] font-semibold">
                      {t("bookingDocs.uploaded")}
                    </span>
                  )}
                  {existing && (
                    <a
                      className="text-[11px] font-semibold text-secondary hover:underline"
                      href={existing.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("bookingDocs.viewDocument")}
                    </a>
                  )}
                  {canUpload && (
                    <button
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#d9590f] transition-colors disabled:opacity-60"
                      disabled={isUploading}
                      type="button"
                      onClick={() => handleUploadClick(type)}
                    >
                      <span className="material-symbols-outlined text-[14px]">upload</span>
                      {isUploading ? t("bookingDocs.uploading") : t("bookingDocs.upload")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-error font-medium">{uploadError}</p>
      )}

      <p className="text-[11px] text-on-surface-variant">
        {t("bookingDocs.maxFileSize")}
      </p>

      <input
        ref={fileInputRef}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}
