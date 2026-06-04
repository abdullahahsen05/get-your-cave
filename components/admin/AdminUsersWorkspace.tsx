"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/components/ui/UserAvatar";

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  ownerProfile: { verificationStatus: string } | null;
  renterProfile: { verificationStatus: string } | null;
};

type AdminDetailUser = AdminUserRow & {
  emailVerified: boolean;
  updatedAt: string;
  ownerProfile: {
    id: string;
    userId: string;
    bio: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
    iban: string | null;
    responseRate: number | null;
    verificationStatus: string;
    walletBalance: string;
    pendingPayout: string;
    totalEarnings: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  renterProfile: {
    id: string;
    userId: string;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
    verificationStatus: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type DetailListing = {
  id: string;
  title: string;
  status: string;
  availability: string;
  isPublished: boolean;
  city: string;
  address: string;
  pricePerMonth: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type DetailBooking = {
  id: string;
  bookingNumber: string;
  status: string;
  startDate: string;
  endDate: string | null;
  monthlyPrice: string;
  securityDeposit: string;
  insuranceFee: string;
  platformCommission: string;
  ownerAmount: string;
  totalMonthlyAmount: string;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    address: string;
    imageUrl: string | null;
  };
  owner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  renter: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  generatedContract: {
    id: string;
    contractNumber: string;
    status: string;
    generatedAt: string;
    generatedFileName: string;
    generatedFilePath: string;
  } | null;
  paymentStatus: string | null;
  invoiceStatus: string | null;
};

type DetailContract = {
  id: string;
  contractNumber: string;
  type: string;
  status: string;
  generatedPdfUrl: string | null;
  signedPdfUrl: string | null;
  sentAt: string | null;
  ownerSignedAt: string | null;
  renterSignedAt: string | null;
  fullySignedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    listing: {
      id: string;
      title: string;
      city: string;
      address: string;
      imageUrl: string | null;
    };
    owner: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
    renter: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
  };
  signatures: Array<{
    id: string;
    signerUserId: string;
    party: string;
    signatureText: string | null;
    signatureImageUrl: string | null;
    signedAt: string;
  }>;
};

type DetailInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: string;
  platformFee: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  pdfUrl: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    listing: {
      id: string;
      title: string;
      city: string;
      address: string;
      imageUrl: string | null;
    };
    owner: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
    renter: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
  };
  payment: {
    id: string;
    status: string;
    amount: string;
    platformCommission: string;
    ownerAmount: string;
    paidAt: string | null;
    failedAt: string | null;
    refundedAt: string | null;
    createdAt: string;
  } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
};

type DetailPayment = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  platformCommission: string;
  ownerAmount: string;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    listing: {
      id: string;
      title: string;
      city: string;
      address: string;
      imageUrl: string | null;
    };
    owner: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
    renter: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
  };
};

type AdminUserDetailResponse = {
  user: AdminDetailUser;
  verificationDocuments: Array<{
    id: string;
    type: string;
    fileUrl: string;
    fileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
    status: string;
    rejectionReason: string | null;
    reviewedById: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  ownerData: {
    listings: DetailListing[];
    bookings: DetailBooking[];
    contracts: DetailContract[];
    invoices: DetailInvoice[];
    payments: DetailPayment[];
  } | null;
  renterData: {
    bookings: DetailBooking[];
    contracts: DetailContract[];
    invoices: DetailInvoice[];
    payments: DetailPayment[];
  } | null;
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    linkUrl: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
  adminLogs: Array<{
    id: string;
    entityType: string;
    entityId: string | null;
    action: string;
    details: unknown;
    createdAt: string;
    admin: { id: string; fullName: string; email: string; avatarUrl: string | null } | null;
    targetUser: { id: string; fullName: string; email: string; avatarUrl: string | null } | null;
  }>;
};

type Props = {
  users: AdminUserRow[];
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatEnum(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}


function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-outline-variant/60 bg-surface-container-low/40 p-4">
      <div className="mb-4">
        <h4 className="font-semibold text-primary">{title}</h4>
        {subtitle ? <p className="text-xs text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-primary">{value}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
      {children}
    </span>
  );
}

export default function AdminUsersWorkspace({ users }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const marketplaceSplitLabel = t("adminUsers.detail.marketplaceSplitValue");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<"suspend" | "reactivate" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeUserId = useMemo(() => {
    if (!users.length) {
      return "";
    }

    return users.some((user) => user.id === selectedUserId) ? selectedUserId : users[0].id;
  }, [selectedUserId, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === activeUserId) ?? users[0] ?? null,
    [activeUserId, users],
  );

  async function loadUserDetail(userId: string) {
    if (!userId) {
      setSelectedUserDetail(null);
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? t("adminUsers.unableToLoad"));
      }

      const payload = (await response.json()) as AdminUserDetailResponse;
      setSelectedUserDetail(payload);
    } catch (fetchError) {
      setSelectedUserDetail(null);
      setError(fetchError instanceof Error ? fetchError.message : t("adminUsers.unableToLoad"));
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!activeUserId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadUserDetail(activeUserId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  async function runAction(userId: string, action: "suspend" | "reactivate" | "delete") {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? t("adminUsers.unableToUpdate"));
      }

      router.refresh();
      if (action !== "delete") {
        void loadUserDetail(userId);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("adminUsers.unableToUpdate"));
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteUser(userId: string) {
    setBusyAction("delete");
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? t("adminUsers.unableToDelete"));
      }

      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("adminUsers.unableToDelete"));
    } finally {
      setBusyAction(null);
    }
  }

  if (!users.length) {
    return (
      <div className="rounded-[28px] border border-outline-variant/60 bg-surface p-8 text-on-surface-variant">
        {t("adminUsers.empty")}
      </div>
    );
  }

  const detailUser = selectedUserDetail?.user ?? null;
  const ownerData = selectedUserDetail?.ownerData ?? null;
  const renterData = selectedUserDetail?.renterData ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_16px_50px_rgba(17,24,39,0.05)]">
        <div className="border-b border-outline-variant/60 px-5 py-4 sm:px-6">
          <h2 className="font-h3 text-h3 text-primary">{t("adminUsers.allUsers")}</h2>
          <p className="text-body-sm text-on-surface-variant">{t("adminUsers.subtitle")}</p>
        </div>
        <div className="divide-y divide-outline-variant/30">
          {users.map((user) => {
            const isActive = user.id === selectedUser?.id;

            return (
              <button
                key={user.id}
                type="button"
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container-low ${
                  isActive ? "bg-secondary-container/15" : ""
                }`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{user.fullName}</p>
                  <p className="truncate text-sm text-on-surface-variant">{user.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    {user.role}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{user.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[28px] border border-outline-variant/60 bg-surface p-6 shadow-[0_16px_50px_rgba(17,24,39,0.05)] sm:p-8">
          <div className="flex items-start gap-4">
            <UserAvatar avatarUrl={detailUser?.avatarUrl ?? selectedUser?.avatarUrl ?? null} name={detailUser?.fullName ?? selectedUser?.fullName ?? ""} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-h2 text-h2 text-primary">{detailUser?.fullName ?? selectedUser?.fullName}</h3>
                {detailLoading ? <Badge>{t("common.loading")}</Badge> : null}
              </div>
              <p className="mt-1 break-all text-body-sm text-on-surface-variant">
                {detailUser?.email ?? selectedUser?.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                <Badge>{detailUser?.role ?? selectedUser?.role}</Badge>
                <Badge>{detailUser?.status ?? selectedUser?.status}</Badge>
                {detailUser?.emailVerified ? <Badge>{t("adminUsers.detail.verifiedEmail")}</Badge> : <Badge>{t("adminUsers.detail.unverifiedEmail")}</Badge>}
              </div>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

          <div className="mt-6 grid gap-3 rounded-[24px] border border-outline-variant/60 bg-surface-container-low p-4 text-sm">
            <StatRow label={t("profile.phone")} value={detailUser?.phone ?? selectedUser?.phone ?? "—"} />
            <StatRow label={t("profile.createdAt")} value={formatDate(detailUser?.createdAt ?? selectedUser?.createdAt)} />
            <StatRow label={t("adminUsers.detail.updated")} value={formatDate(detailUser?.updatedAt)} />
            <StatRow
              label={t("adminUsers.detail.ownerVerification")}
              value={detailUser?.ownerProfile?.verificationStatus ?? selectedUser?.ownerProfile?.verificationStatus ?? "—"}
            />
            <StatRow
              label={t("adminUsers.detail.renterVerification")}
              value={detailUser?.renterProfile?.verificationStatus ?? selectedUser?.renterProfile?.verificationStatus ?? "—"}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f] disabled:opacity-60"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void runAction(selectedUser?.id ?? "", "suspend")}
            >
              {busyAction === "suspend" ? t("common.loading") : t("adminUsers.suspendUser")}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant/60 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-60"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void runAction(selectedUser?.id ?? "", "reactivate")}
            >
              {busyAction === "reactivate" ? t("common.loading") : t("adminUsers.reactivateUser")}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-error/40 px-4 py-3 text-sm font-bold text-error transition-colors hover:bg-error-container/20 disabled:opacity-60"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void deleteUser(selectedUser?.id ?? "")}
            >
              {busyAction === "delete" ? t("common.loading") : t("common.delete")}
            </button>
          </div>
        </section>

        <div className="space-y-4">
          <SectionShell title={t("adminUsers.detail.profileDetails")} subtitle={t("adminUsers.detail.profileDetailsSubtitle")}>
            <StatRow label={t("profile.email")} value={detailUser?.email ?? selectedUser?.email ?? "—"} />
            <StatRow label={t("profile.phone")} value={detailUser?.phone ?? selectedUser?.phone ?? "—"} />
            <StatRow label={t("profile.role")} value={detailUser?.role ?? selectedUser?.role ?? "—"} />
            <StatRow label={t("profile.status")} value={detailUser?.status ?? selectedUser?.status ?? "—"} />
            <StatRow label={t("adminUsers.detail.emailVerified")} value={detailUser?.emailVerified ? t("common.yes") : t("common.no")} />
          </SectionShell>

          {detailUser?.ownerProfile ? (
            <SectionShell title={t("adminUsers.detail.ownerProfile")} subtitle={t("adminUsers.detail.ownerProfileSubtitle")}>
              <StatRow label={t("profile.address")} value={detailUser.ownerProfile.address ?? "—"} />
              <StatRow label={t("profile.city")} value={detailUser.ownerProfile.city ?? "—"} />
              <StatRow label={t("profile.postalCode")} value={detailUser.ownerProfile.postalCode ?? "—"} />
              <StatRow label={t("adminUsers.detail.country")} value={detailUser.ownerProfile.country ?? "—"} />
              <StatRow label={t("profile.iban")} value={detailUser.ownerProfile.iban ?? "—"} />
              <StatRow label={t("adminUsers.detail.responseRate")} value={detailUser.ownerProfile.responseRate ?? "—"} />
              <StatRow label={t("adminUsers.detail.walletBalance")} value={detailUser.ownerProfile.walletBalance} />
              <StatRow label={t("dashboard.owner.pendingPayout")} value={detailUser.ownerProfile.pendingPayout} />
              <StatRow label={t("dashboard.owner.totalEarnings")} value={detailUser.ownerProfile.totalEarnings} />
            </SectionShell>
          ) : null}

          {detailUser?.renterProfile ? (
            <SectionShell title={t("adminUsers.detail.renterProfile")} subtitle={t("adminUsers.detail.renterProfileSubtitle")}>
              <StatRow label={t("profile.address")} value={detailUser.renterProfile.address ?? "—"} />
              <StatRow label={t("profile.city")} value={detailUser.renterProfile.city ?? "—"} />
              <StatRow label={t("profile.postalCode")} value={detailUser.renterProfile.postalCode ?? "—"} />
              <StatRow label={t("adminUsers.detail.country")} value={detailUser.renterProfile.country ?? "—"} />
            </SectionShell>
          ) : null}

          <SectionShell title={t("adminUsers.detail.verificationDocuments")} subtitle={t("adminUsers.detail.verificationDocumentsSubtitle")}>
            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {selectedUserDetail?.verificationDocuments?.length ? (
                selectedUserDetail.verificationDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">{formatEnum(document.type)}</p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(document.createdAt)} · {document.fileName ?? t("adminUsers.detail.unnamedFile")}
                        </p>
                      </div>
                      <Badge>{document.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <StatRow label={t("adminUsers.detail.file")} value={<a className="text-secondary underline" href={document.fileUrl} target="_blank" rel="noreferrer">{t("common.open")}</a>} />
                      <StatRow label={t("adminUsers.detail.reviewedAt")} value={formatDate(document.reviewedAt)} />
                      <StatRow label={t("adminUsers.detail.rejectionReason")} value={document.rejectionReason ?? "—"} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noVerificationDocuments")}</p>
              )}
            </div>
          </SectionShell>

          {ownerData ? (
            <>
              <SectionShell title={t("adminUsers.detail.ownerListings")} subtitle={t("adminUsers.detail.ownerListingsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {ownerData.listings.length ? (
                    ownerData.listings.map((listing) => (
                      <article
                        key={listing.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">{listing.title}</p>
                            <p className="text-sm text-on-surface-variant">
                              {listing.city} · {listing.address}
                            </p>
                          </div>
                          <Badge>{listing.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("listing.availability")} value={listing.availability} />
                          <StatRow label={t("adminUsers.detail.published")} value={listing.isPublished ? t("common.yes") : t("common.no")} />
                          <StatRow label={t("adminUsers.detail.monthlyPrice")} value={listing.pricePerMonth} />
                          <StatRow label={t("adminUsers.detail.created")} value={formatDate(listing.createdAt)} />
                          <StatRow label={t("adminUsers.detail.updated")} value={formatDate(listing.updatedAt)} />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noListings")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.ownerBookings")} subtitle={t("adminUsers.detail.ownerBookingsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {ownerData.bookings.length ? (
                    ownerData.bookings.map((booking) => (
                      <article
                        key={booking.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {booking.bookingNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">{booking.listing.title}</p>
                          </div>
                          <Badge>{booking.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("common.renter")} value={booking.renter.fullName} />
                          <StatRow label={t("adminUsers.detail.monthlyPrice")} value={booking.monthlyPrice} />
                          <StatRow label={t("adminUsers.detail.marketplaceSplit")} value={marketplaceSplitLabel} />
                          <StatRow label={t("adminUsers.detail.totalMonthly")} value={booking.totalMonthlyAmount} />
                          <StatRow label={t("adminUsers.detail.contract")} value={booking.generatedContract?.contractNumber ?? "—"} />
                          <StatRow label={t("adminUsers.detail.invoice")} value={booking.invoiceStatus ?? "—"} />
                          <StatRow label={t("adminUsers.detail.payment")} value={booking.paymentStatus ?? "—"} />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noBookings")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.ownerContracts")} subtitle={t("adminUsers.detail.ownerContractsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {ownerData.contracts.length ? (
                    ownerData.contracts.map((contract) => (
                      <article
                        key={contract.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {contract.contractNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {contract.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{contract.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("contracts.type")} value={formatEnum(contract.type)} />
                          <StatRow label={t("common.renter")} value={contract.booking.renter.fullName} />
                          <StatRow label={t("adminUsers.detail.signedAt")} value={formatDate(contract.fullySignedAt)} />
                          <StatRow
                            label={t("common.download")}
                            value={
                              contract.signedPdfUrl || contract.generatedPdfUrl ? (
                                <a
                                  className="text-secondary underline"
                                  href={contract.signedPdfUrl ?? contract.generatedPdfUrl ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("adminUsers.detail.openFile")}
                                </a>
                              ) : (
                                "—"
                              )
                            }
                          />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noContracts")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.ownerInvoices")} subtitle={t("adminUsers.detail.ownerInvoicesSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {ownerData.invoices.length ? (
                    ownerData.invoices.map((invoice) => (
                      <article
                        key={invoice.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {invoice.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{invoice.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("invoices.total")} value={invoice.totalAmount} />
                          <StatRow label={t("adminUsers.detail.platformFee")} value={invoice.platformFee} />
                          <StatRow label={t("invoiceDetail.paidAt")} value={formatDate(invoice.paidAt)} />
                          <StatRow
                            label={t("adminUsers.detail.pdf")}
                            value={
                              invoice.pdfUrl ? (
                                <a
                                  className="text-secondary underline"
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("adminUsers.detail.openFile")}
                                </a>
                              ) : (
                                "—"
                              )
                            }
                          />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noInvoices")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.ownerPayments")} subtitle={t("adminUsers.detail.ownerPaymentsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {ownerData.payments.length ? (
                    ownerData.payments.map((payment) => (
                      <article
                        key={payment.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {payment.booking.bookingNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {payment.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{payment.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("invoiceDetail.amount")} value={payment.amount} />
                          <StatRow label={t("adminUsers.detail.marketplaceSplit")} value={marketplaceSplitLabel} />
                          <StatRow label={t("adminUsers.detail.ownerAmount")} value={payment.ownerAmount} />
                          <StatRow label={t("listingDetail.platformCommission")} value={payment.platformCommission} />
                          <StatRow label={t("invoiceDetail.paidAt")} value={formatDate(payment.paidAt)} />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noPayments")}</p>
                  )}
                </div>
              </SectionShell>
            </>
          ) : null}

          {renterData ? (
            <>
              <SectionShell title={t("adminUsers.detail.renterBookings")} subtitle={t("adminUsers.detail.renterBookingsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {renterData.bookings.length ? (
                    renterData.bookings.map((booking) => (
                      <article
                        key={booking.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {booking.bookingNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">{booking.listing.title}</p>
                          </div>
                          <Badge>{booking.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("common.owner")} value={booking.owner.fullName} />
                          <StatRow label={t("adminUsers.detail.monthlyPrice")} value={booking.monthlyPrice} />
                          <StatRow label={t("adminUsers.detail.marketplaceSplit")} value={marketplaceSplitLabel} />
                          <StatRow label={t("adminUsers.detail.totalMonthly")} value={booking.totalMonthlyAmount} />
                          <StatRow label={t("adminUsers.detail.contract")} value={booking.generatedContract?.contractNumber ?? "—"} />
                          <StatRow label={t("adminUsers.detail.invoice")} value={booking.invoiceStatus ?? "—"} />
                          <StatRow label={t("adminUsers.detail.payment")} value={booking.paymentStatus ?? "—"} />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noBookings")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.renterContracts")} subtitle={t("adminUsers.detail.renterContractsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {renterData.contracts.length ? (
                    renterData.contracts.map((contract) => (
                      <article
                        key={contract.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {contract.contractNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {contract.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{contract.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("contracts.type")} value={formatEnum(contract.type)} />
                          <StatRow label={t("common.owner")} value={contract.booking.owner.fullName} />
                          <StatRow label={t("adminUsers.detail.signedAt")} value={formatDate(contract.fullySignedAt)} />
                          <StatRow
                            label={t("common.download")}
                            value={
                              contract.signedPdfUrl || contract.generatedPdfUrl ? (
                                <a
                                  className="text-secondary underline"
                                  href={contract.signedPdfUrl ?? contract.generatedPdfUrl ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("adminUsers.detail.openFile")}
                                </a>
                              ) : (
                                "—"
                              )
                            }
                          />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noContracts")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.renterInvoices")} subtitle={t("adminUsers.detail.renterInvoicesSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {renterData.invoices.length ? (
                    renterData.invoices.map((invoice) => (
                      <article
                        key={invoice.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {invoice.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{invoice.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("invoices.total")} value={invoice.totalAmount} />
                          <StatRow label={t("adminUsers.detail.platformFee")} value={invoice.platformFee} />
                          <StatRow label={t("invoiceDetail.paidAt")} value={formatDate(invoice.paidAt)} />
                          <StatRow
                            label={t("adminUsers.detail.pdf")}
                            value={
                              invoice.pdfUrl ? (
                                <a
                                  className="text-secondary underline"
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("adminUsers.detail.openFile")}
                                </a>
                              ) : (
                                "—"
                              )
                            }
                          />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noInvoices")}</p>
                  )}
                </div>
              </SectionShell>

              <SectionShell title={t("adminUsers.detail.renterPayments")} subtitle={t("adminUsers.detail.renterPaymentsSubtitle")}>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {renterData.payments.length ? (
                    renterData.payments.map((payment) => (
                      <article
                        key={payment.id}
                        className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">
                              {payment.booking.bookingNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {payment.booking.listing.title}
                            </p>
                          </div>
                          <Badge>{payment.status}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          <StatRow label={t("invoiceDetail.amount")} value={payment.amount} />
                          <StatRow label={t("adminUsers.detail.marketplaceSplit")} value={marketplaceSplitLabel} />
                          <StatRow label={t("adminUsers.detail.ownerAmount")} value={payment.ownerAmount} />
                          <StatRow label={t("listingDetail.platformCommission")} value={payment.platformCommission} />
                          <StatRow label={t("invoiceDetail.paidAt")} value={formatDate(payment.paidAt)} />
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noPayments")}</p>
                  )}
                </div>
              </SectionShell>
            </>
          ) : null}

          <SectionShell title={t("adminUsers.detail.notifications")} subtitle={t("adminUsers.detail.notificationsSubtitle")}>
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {selectedUserDetail?.notifications?.length ? (
                selectedUserDetail.notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">{notification.title}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{notification.body ?? "—"}</p>
                      </div>
                      <Badge>{notification.readAt ? t("adminUsers.detail.read") : t("adminUsers.detail.unread")}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <StatRow label={t("adminUsers.detail.created")} value={formatDate(notification.createdAt)} />
                      <StatRow label={t("adminUsers.detail.link")} value={notification.linkUrl ?? "—"} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noNotifications")}</p>
              )}
            </div>
          </SectionShell>

          <SectionShell title={t("adminUsers.detail.adminLogs")} subtitle={t("adminUsers.detail.adminLogsSubtitle")}>
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {selectedUserDetail?.adminLogs?.length ? (
                selectedUserDetail.adminLogs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-[20px] border border-outline-variant/60 bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">{log.action}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {formatEnum(log.entityType)} · {log.entityId ?? "—"}
                        </p>
                      </div>
                      <Badge>{formatDate(log.createdAt)}</Badge>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">{t("adminUsers.detail.noAdminLogs")}</p>
              )}
            </div>
          </SectionShell>
        </div>
      </aside>
    </div>
  );
}
