/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import type { SafeUser } from "@/lib/auth";
import {
  type VerificationDocumentView,
  type VerificationSummary,
} from "@/lib/verification";
import {
  verificationDocumentTypeLabels,
  verificationStatusLabels,
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
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

function getStatusLabel(status: VerificationStatusValue) {
  return verificationStatusLabels[status];
}

function formatDocumentType(type: VerificationDocumentType) {
  return verificationDocumentTypeLabels[type];
}

export default function VerificationDocumentsWorkspace({ currentUser }: Props) {
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
        throw new Error(data.error ?? "Unable to load verification documents.");
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
          : "Unable to load verification documents.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVerificationDocuments();
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
        throw new Error(data.error ?? "Unable to upload document.");
      }

      setActionMessage(`${formatDocumentType(uploadType)} uploaded successfully.`);
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to upload document.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm(
      "Delete this document? Approved documents cannot be deleted.",
    );

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

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete document.");
      }

      setActionMessage("Document deleted successfully.");
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete document.",
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
        throw new Error(data.error ?? "Unable to submit documents for review.");
      }

      if (data.documents) {
        setDocuments(data.documents);
      }
      if (data.verification) {
        setVerification(data.verification);
      }

      setActionMessage("Documents submitted for review.");
      await loadVerificationDocuments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit documents for review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-on-background pt-32 pb-32 mx-auto max-w-[1200px] px-6">
      <header className="mb-12 text-center md:text-left">
        <h1 className="font-h1 text-h1 text-primary mb-1">
          Complete Your Verification
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Verify your identity to unlock all features, including high-value item
          coverage and priority access to premium storage caves.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-surface-container-lowest border border-surface-variant p-6 rounded-lg shadow-[0_4px_20px_rgba(15,61,62,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-h3 text-h3 text-primary">Account Status</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Finalize your profile for complete security.
              </p>
            </div>
            <span
              className={`px-6 py-1 rounded-full font-label-caps text-label-caps flex items-center gap-1 w-fit ${getStatusBadgeClasses(verification.accountStatus)}`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {getStatusBadgeIcon(verification.accountStatus)}
              </span>
              {getStatusLabel(verification.accountStatus)}
            </span>
          </section>

          <section className="bg-secondary-container/20 border border-secondary-fixed-dim/30 p-6 rounded-lg flex gap-4 items-start">
            <span className="material-symbols-outlined text-secondary scale-125 mt-1">
              verified_user
            </span>
            <div>
              <p className="font-body-md text-body-md text-secondary-fixed-variant font-bold">
                End-to-End Encryption
              </p>
              <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">
                All documents are encrypted and stored in an isolated, secure
                vault. Only authorized compliance officers can review your
                details.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-h2 text-h2 text-primary mb-6">
              Documentation
            </h2>

            {errorMessage ? (
              <p className="mb-4 text-sm text-error">{errorMessage}</p>
            ) : null}
            {actionMessage ? (
              <p className="mb-4 text-sm text-secondary">{actionMessage}</p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                className="group border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low transition-colors duration-300 p-12 rounded-lg text-center flex flex-col items-center justify-center gap-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!canUploadDocuments || isUploading}
                onClick={() => openUploadDialog("ID_CARD")}
              >
                <span className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                  <span className="material-symbols-outlined">upload</span>
                </span>
                <span>
                  <span className="font-h3 text-h3 text-primary block">
                    Upload ID Card
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                    Passport, Driver&apos;s License or National ID
                  </span>
                </span>
                <span className="text-label-caps font-label-caps text-on-surface-variant/60">
                  MAX FILE SIZE 10MB
                </span>
              </button>

              <button
                className="group border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low transition-colors duration-300 p-12 rounded-lg text-center flex flex-col items-center justify-center gap-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!canUploadProofOfOwnership || isUploading}
                onClick={() => openUploadDialog("PROOF_OF_OWNERSHIP")}
              >
                <span className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                  <span className="material-symbols-outlined">home_storage</span>
                </span>
                <span>
                  <span className="font-h3 text-h3 text-primary block">
                    Upload Proof of Ownership
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                    Utility bill, lease, or insurance certificate
                  </span>
                  {!canUploadProofOfOwnership ? (
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-2 block">
                      Not required for renters
                    </span>
                  ) : null}
                </span>
                <span className="text-label-caps font-label-caps text-on-surface-variant/60">
                  MAX FILE SIZE 10MB
                </span>
              </button>
            </div>
          </section>

          <section className="overflow-hidden">
            <h2 className="font-h2 text-h2 text-primary mb-6">
              Recent Documents
            </h2>

            <div className="bg-surface-container-lowest border border-surface-variant rounded-lg overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-surface-container font-label-caps text-label-caps text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant font-body-sm text-body-sm">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-6 text-primary font-bold" colSpan={4}>
                        Loading documents...
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
                              {document.fileName ?? "Uploaded document"}
                            </div>
                            <div className="text-on-surface-variant text-sm">
                              {formatDocumentType(document.type)}
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
                              {getStatusLabel(document.status)}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-on-surface-variant">
                            {formatDate(document.createdAt)}
                          </td>
                          <td className="px-6 py-6 text-right space-x-4">
                            <a
                              className="text-primary hover:underline"
                              href={document.fileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              View
                            </a>
                            {document.status === "REJECTED" ? (
                              <button
                                className="text-primary hover:underline disabled:opacity-60"
                                disabled={isUploading}
                                type="button"
                                onClick={() => openUploadDialog(document.type)}
                              >
                                Re-upload
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
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-6 py-6 text-primary font-bold" colSpan={4}>
                        No documents uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-12">
          <section className="bg-primary-container text-on-primary p-12 rounded-lg shadow-xl lg:sticky lg:top-[120px]">
            <h3 className="font-h3 text-h3 mb-4">Ready to Proceed?</h3>
            <p className="font-body-md text-body-md mb-12 opacity-80">
              Once you&apos;ve uploaded all required documents, our team will review
              your application within 24-48 business hours.
            </p>

            <button
              className="w-full bg-white text-primary font-bold py-4 px-12 rounded-full hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-4 disabled:opacity-70"
              disabled={isSubmitting || loading}
              type="button"
              onClick={() => {
                void handleSubmitForReview();
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
              <span className="material-symbols-outlined">send</span>
            </button>

            <div className="mt-12 pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px] text-on-primary-container">
                  contact_support
                </span>
                <span className="font-body-sm text-body-sm">
                  Verification help center
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px] text-on-primary-container">
                  lock_reset
                </span>
                <span className="font-body-sm text-body-sm">
                  Change privacy settings
                </span>
              </div>
              {!loading && verification.missingDocumentTypes.length ? (
                <p className="text-sm text-white/90">
                  Missing required documents:{" "}
                  {verification.missingDocumentTypes
                    .map((type) => formatDocumentType(type))
                    .join(", ")}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg overflow-hidden h-64 relative">
            <img
              alt="Architectural Luxury Storage"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVuMKlAGqph302zWz7GYOacx2lOwa1QsfZ2Dgy1wsqmhCrtDaGqIBXoXVpETBKXrmOukCzSgGwsqNwnN-gMHmgDFWWx-yD8YVfXfIWSRisi3qZPRn3E3T5Lw8J4pGI5n8qkby2pTkZ8B1Km2KORWrE3eMiQZ-09K5LnNkojMdSJbN4QFFuyMqZPEtXARnavjikoo5_1yJqtOm4mWz7j4RKzjTsoBMAnGeVoIpradJdhP4X3nG51hhq-QZdrttHrUMpYxlhs_AyhYM"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex items-end p-6">
              <p className="text-white font-body-sm italic">
                &quot;Security is the ultimate luxury.&quot;
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
