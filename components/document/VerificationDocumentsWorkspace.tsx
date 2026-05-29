/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import type { SafeUser } from "@/lib/auth";
import { normalizeLocale, type Locale } from "@/lib/i18n";
import {
  type VerificationDocumentView,
  type VerificationSummary,
} from "@/lib/verification";
import {
  getVerificationDocumentTypeLabel,
  getVerificationStatusLabel,
  type VerificationDocumentType,
  type VerificationStatusValue,
} from "@/lib/verification-types";

type VerificationDocumentsResponse = {
  documents: VerificationDocumentView[];
  verification: VerificationSummary;
};

type Props = {
  currentUser: SafeUser;
};

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeClasses(status: VerificationStatusValue) {
  switch (status) {
    case "APPROVED":
      return "bg-secondary-container/40 text-on-secondary-container";
    case "REJECTED":
      return "bg-error-container text-on-error-container";
    case "PENDING":
      return "bg-secondary-container text-on-secondary-container";
    case "NOT_SUBMITTED":
    default:
      return "bg-surface-container-low text-on-surface-variant";
  }
}

function getStatusBadgeIcon(status: VerificationStatusValue) {
  switch (status) {
    case "APPROVED":
      return "verified";
    case "REJECTED":
      return "error";
    case "PENDING":
      return "pending";
    case "NOT_SUBMITTED":
    default:
      return "draft";
  }
}

function getStatusLabel(status: VerificationStatusValue, locale: Locale) {
  return getVerificationStatusLabel(status, locale);
}

function formatDocumentType(type: VerificationDocumentType, locale: Locale) {
  return getVerificationDocumentTypeLabel(type, locale);
}

export default function VerificationDocumentsWorkspace({ currentUser }: Props) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUploadTypeRef = useRef<VerificationDocumentType | null>(null);

  const [documents, setDocuments] = useState<VerificationDocumentView[]>([]);
  const [verification, setVerification] = useState<VerificationSummary>({
    role: currentUser.role,
    accountStatus: "NOT_SUBMITTED",
    requiredDocumentTypes: currentUser.role === "OWNER"
      ? ["ID_CARD", "PROOF_OF_OWNERSHIP"]
      : ["ID_CARD"],
    missingDocumentTypes: currentUser.role === "OWNER"
      ? ["ID_CARD", "PROOF_OF_OWNERSHIP"]
      : ["ID_CARD"],
    canSubmit: false,
  });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canUploadDocuments = currentUser.role === "OWNER" || currentUser.role === "RENTER";
  const canUploadProofOfOwnership = currentUser.role === "OWNER";

  async function loadVerificationDocuments() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/verification-documents", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as Partial<VerificationDocumentsResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(t("verification.loadError"));
      }

      setDocuments(data.documents ?? []);
      if (data.verification) {
        setVerification(data.verification);
      }
    } catch (error) {
      setDocuments([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("verification.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVerificationDocuments();
    // loadVerificationDocuments is intentionally called once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openUploadDialog(type: VerificationDocumentType) {
    if (!canUploadDocuments) {
      return;
    }

    if (type === "PROOF_OF_OWNERSHIP" && !canUploadProofOfOwnership) {
      return;
    }

    pendingUploadTypeRef.current = type;
    uploadInputRef.current?.click();
  }

  async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const uploadType = pendingUploadTypeRef.current;
    pendingUploadTypeRef.current = null;

    if (!uploadType) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      const formData = new FormData();
      formData.append("type", uploadType);
      formData.append("file", file);

      const response = await fetch("/api/uploads/verification-documents", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        document?: VerificationDocumentView;
        error?: string;
      };

      if (!response.ok || !data.document) {
        throw new Error(t("errors.unableToUploadDocument"));
      }

      setActionMessage(t("verification.documentUploaded", { type: formatDocumentType(uploadType, locale) }));
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("errors.unableToUploadDocument"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm(t("verification.deleteConfirmation"));

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/verification-documents/${documentId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const deleteResult = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(deleteResult.error ?? t("verification.deleteError"));
      }

      setActionMessage(t("verification.documentDeleted"));
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("verification.deleteError"),
      );
    }
  }

  async function handleSubmitForReview() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/verification/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = (await response.json()) as {
        error?: string;
        documents?: VerificationDocumentView[];
        verification?: VerificationSummary;
      };

      if (!response.ok) {
        throw new Error(t("verification.submitError"));
      }

      if (data.documents) {
        setDocuments(data.documents);
      }
      if (data.verification) {
        setVerification(data.verification);
      }

      setActionMessage(t("verification.submitted"));
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("verification.submitError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-on-background pt-24 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 lg:pb-32 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <header className="mb-8 sm:mb-10 lg:mb-12 text-center md:text-left">
        <h1 className="font-h1 text-[34px] leading-[1.08] sm:text-h1 text-primary mb-3 tracking-[-0.02em]">
          {t("verification.title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto md:mx-0">
          {t("verification.subtitle")}
        </p>
      </header>

      {currentUser.status !== "ACTIVE" ? (
        <section className="mb-8 sm:mb-10 lg:mb-12 rounded-[28px] border border-secondary-fixed-dim/20 bg-secondary-container/15 p-5 sm:p-7 lg:p-8 shadow-[0_10px_30px_rgba(15,61,62,0.06)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary-fixed-variant">
                {t("verification.bannerLabel")}
              </p>
              <h2 className="font-h2 text-h2 text-primary">
                {t("verification.bannerTitle")}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                {currentUser.role === "OWNER"
                  ? t("verification.bannerOwnerDescription")
                  : t("verification.bannerRenterDescription")}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-3 rounded-full border border-outline-variant/60 bg-surface px-4 py-3 text-sm font-semibold text-primary shadow-[0_8px_20px_rgba(15,61,62,0.06)] w-fit">
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>{t("verification.bannerAction")}</span>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] gap-8 lg:gap-10 xl:gap-12 items-start">
        <div className="space-y-8 sm:space-y-10 lg:space-y-12 min-w-0">
          <section className="bg-surface-container-lowest border border-outline-variant/60 p-5 sm:p-6 lg:p-8 rounded-[26px] shadow-[0_10px_30px_rgba(15,61,62,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h3 className="font-h3 text-h3 text-primary leading-tight">{t("verification.accountStatusTitle")}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {t("verification.accountStatusDescription")}
              </p>
            </div>
            <span
              className={`px-5 py-2 rounded-full font-label-caps text-label-caps flex items-center gap-2 w-fit shrink-0 ${getStatusBadgeClasses(verification.accountStatus)}`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {getStatusBadgeIcon(verification.accountStatus)}
              </span>
              {getStatusLabel(verification.accountStatus, locale)}
            </span>
          </section>

          <section className="bg-secondary-container/15 border border-secondary-fixed-dim/20 p-5 sm:p-6 rounded-[26px] flex gap-4 items-start">
            <span className="material-symbols-outlined text-secondary scale-125 mt-1">
              verified_user
            </span>
            <div>
              <p className="font-body-md text-body-md text-secondary-fixed-variant font-bold">
                {t("verification.securityTitle")}
              </p>
              <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
                {t("verification.securityDescription")}
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-h2 text-h2 text-primary mb-5 sm:mb-6">
              {t("verification.documentsTitle")}
            </h2>

            {errorMessage ? (
              <p className="mb-4 text-sm text-error">{errorMessage}</p>
            ) : null}
            {actionMessage ? (
              <p className="mb-4 text-sm text-secondary">{actionMessage}</p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <button
                className="group min-h-[260px] border-2 border-dashed border-outline-variant/70 hover:border-secondary bg-surface-container-low transition-colors duration-300 p-6 sm:p-8 lg:p-10 rounded-[26px] text-center flex flex-col items-center justify-center gap-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_10px_28px_rgba(15,61,62,0.04)]"
                type="button"
                disabled={!canUploadDocuments || isUploading}
                onClick={() => openUploadDialog("ID_CARD")}
              >
                <span className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined">upload</span>
                </span>
                <span>
                  <span className="font-h3 text-h3 text-primary block">
                    {t("verification.uploadId")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                    {t("verification.uploadIdDescription")}
                  </span>
                </span>
                <span className="text-label-caps font-label-caps text-on-surface-variant/60">
                  {t("verification.maxFileSize")}
                </span>
              </button>

              <button
                className="group min-h-[260px] border-2 border-dashed border-outline-variant/70 hover:border-secondary bg-surface-container-low transition-colors duration-300 p-6 sm:p-8 lg:p-10 rounded-[26px] text-center flex flex-col items-center justify-center gap-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_10px_28px_rgba(15,61,62,0.04)]"
                type="button"
                disabled={!canUploadProofOfOwnership || isUploading}
                onClick={() => openUploadDialog("PROOF_OF_OWNERSHIP")}
              >
                <span className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined">home_storage</span>
                </span>
                <span>
                  <span className="font-h3 text-h3 text-primary block">
                    {t("verification.uploadOwnership")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                    {t("verification.uploadOwnershipDescription")}
                  </span>
                  {!canUploadProofOfOwnership ? (
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-2 block">
                      {t("verification.notRequiredForRenters")}
                    </span>
                  ) : null}
                </span>
                <span className="text-label-caps font-label-caps text-on-surface-variant/60">
                  {t("verification.maxFileSize")}
                </span>
              </button>
            </div>
          </section>

          <section className="overflow-hidden">
            <h2 className="font-h2 text-h2 text-primary mb-5 sm:mb-6">
              {t("verification.recentDocuments")}
            </h2>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-[24px] overflow-x-auto shadow-[0_10px_30px_rgba(15,61,62,0.04)]">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">{t("verification.type")}</th>
                    <th className="px-6 py-4">{t("verification.status")}</th>
                    <th className="px-6 py-4">{t("verification.date")}</th>
                    <th className="px-6 py-4 text-right">{t("verification.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant font-body-sm text-body-sm">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-6 text-primary font-bold" colSpan={4}>
                        {t("verification.loadingDocuments")}
                      </td>
                    </tr>
                  ) : documents.length ? (
                    documents.map((document) => {
                      const canDelete =
                        document.status === "PENDING" ||
                        document.status === "NOT_SUBMITTED" ||
                        document.status === "REJECTED";

                      return (
                        <tr key={document.id}>
                          <td className="px-6 py-6">
                            <div className="text-primary font-bold">
                              {document.fileName ?? t("verification.uploadedDocument")}
                            </div>
                            <div className="text-on-surface-variant text-sm">
                              {formatDocumentType(document.type, locale)}
                            </div>
                            {document.status === "REJECTED" &&
                            document.rejectionReason ? (
                              <div className="text-error text-sm mt-1">
                                {document.rejectionReason}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-6">
                            <span
                              className={`px-4 py-1 rounded-full text-[12px] font-bold ${getStatusBadgeClasses(document.status)}`}
                            >
                              {getStatusLabel(document.status, locale)}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-on-surface-variant">
                            {formatDate(document.createdAt, locale)}
                          </td>
                          <td className="px-6 py-6 text-right space-x-4">
                            <a
                              className="text-secondary hover:underline"
                              href={`/api/verification-documents/${document.id}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {t("common.viewDetails")}
                            </a>
                            {document.status === "REJECTED" ? (
                              <button
                                className="text-secondary hover:underline disabled:opacity-60"
                                disabled={isUploading}
                                type="button"
                                onClick={() => openUploadDialog(document.type)}
                              >
                                {t("verification.reupload")}
                              </button>
                            ) : null}
                            <button
                              className="text-error hover:underline disabled:opacity-60"
                              disabled={!canDelete || isUploading}
                              type="button"
                              onClick={() => {
                                void handleDeleteDocument(document.id);
                              }}
                            >
                              {t("common.delete")}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-6 py-6 text-primary font-bold" colSpan={4}>
                        {t("verification.noDocuments")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-12">
          <section className="bg-[#181d28] text-white p-6 sm:p-8 lg:p-9 xl:p-10 rounded-[28px] shadow-[0_20px_50px_rgba(15,61,62,0.22)] lg:sticky lg:top-[120px]">
            <h3 className="font-h3 text-h3 mb-4">{t("verification.readyTitle")}</h3>
            <p className="font-body-md text-body-md mb-8 sm:mb-10 lg:mb-12 opacity-80">
              {t("verification.readyDescription")}
            </p>

            <button
              className="w-full bg-secondary text-on-secondary font-bold py-4 px-6 sm:px-8 rounded-full hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-3 disabled:opacity-70 shadow-[0_10px_22px_rgba(242,106,27,0.2)]"
              disabled={isSubmitting || loading || !verification.canSubmit}
              type="button"
              onClick={() => {
                void handleSubmitForReview();
              }}
            >
              {isSubmitting ? t("verification.submitting") : t("verification.submitForReview")}
              <span className="material-symbols-outlined">send</span>
            </button>

            <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  contact_support
                </span>
                <span className="font-body-sm text-body-sm">
                  {t("verification.helpCenter")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  lock_reset
                </span>
                <span className="font-body-sm text-body-sm">
                  {t("verification.privacySettings")}
                </span>
              </div>
              {!loading && verification.missingDocumentTypes.length ? (
                <p className="text-sm text-white/90">
                  {t("verification.missingDocuments")}{" "}
                  {verification.missingDocumentTypes
                    .map((type) => formatDocumentType(type, locale))
                    .join(", ")}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] overflow-hidden h-56 sm:h-64 lg:h-[280px] relative shadow-[0_10px_30px_rgba(15,61,62,0.08)]">
            <img
              alt={t("home.featuredTitle")}
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVuMKlAGqph302zWz7GYOacx2lOwa1QsfZ2Dgy1wsqmhCrtDaGqIBXoXVpETBKXrmOukCzSgGwsqNwnN-gMHmgDFWWx-yD8YVfXfIWSRisi3qZPRn3E3T5Lw8J4pGI5n8qkby2pTkZ8B1Km2KORWrE3eMiQZ-09K5LnNkojMdSJbN4QFFuyMqZPEtXARnavjikoo5_1yJqtOm4mWz7j4RKzjTsoBMAnGeVoIpradJdhP4X3nG51hhq-QZdrttHrUMpYxlhs_AyhYM"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181d28]/70 to-transparent flex items-end p-6">
              <p className="text-white font-body-sm italic">
                {t("verification.quote")}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <input
        ref={uploadInputRef}
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        type="file"
        onChange={(event) => {
          void handleUploadChange(event);
        }}
      />
    </main>
  );
}
