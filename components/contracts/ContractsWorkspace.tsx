"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SafeGeneratedContract } from "@/lib/contracts/generateContract";
import { getContractTypeBadge } from "@/lib/contracts/contractTypes";
import { normalizeLocale } from "@/lib/i18n";

type ContractsWorkspaceProps = {
  initialContracts: SafeGeneratedContract[];
  canGenerate: boolean;
  isAdmin: boolean;
  viewerRole: string;
};

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: string, locale: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusStyles(status: SafeGeneratedContract["status"]) {
  switch (status) {
    case "SIGNED":
      return "bg-secondary-container text-on-secondary-container";
    case "GENERATED":
      return "bg-secondary-container/70 text-on-secondary-container";
    case "SENT":
    case "SENT_FOR_SIGNATURE":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    case "PARTIALLY_SIGNED":
      return "bg-surface-container-highest text-on-surface-variant";
    case "CANCELLED":
      return "bg-error-container text-on-error-container";
    default:
      return "bg-surface-container-highest text-on-surface-variant";
  }
}

function getTypeStyles(contractType: SafeGeneratedContract["contractType"]) {
  switch (contractType) {
    case "SEASONAL_RENTAL":
      return "bg-secondary-container/40 text-on-secondary-container";
    case "PLATFORM_INTRODUCTION":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    default:
      return "bg-secondary-container/30 text-on-secondary-container";
  }
}

function getBookingStatusLabel(status: string, t: (key: string) => string) {
  const translated = t(`status.booking.${status}`);
  return translated === `status.booking.${status}` ? status : translated;
}

export function ContractsWorkspace({
  initialContracts,
  canGenerate,
  isAdmin,
  viewerRole,
}: ContractsWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const downloadHref = (contractId: string) => `/api/contracts/${contractId}/download`;
  const [filter, setFilter] = useState<"all" | "generated" | "sent" | "signed" | "cancelled">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "amount">("newest");
  const [selectedContractId, setSelectedContractId] = useState(
    initialContracts[0]?.id ?? "",
  );
  const [contracts, setContracts] = useState(initialContracts);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredContracts = useMemo(() => {
    const visible =
      filter === "all"
        ? contracts
        : contracts.filter((contract) => {
            if (filter === "generated") {
              return contract.status === "GENERATED";
            }
            if (filter === "sent") {
              return contract.status === "SENT" || contract.status === "SENT_FOR_SIGNATURE";
            }
            if (filter === "signed") {
              return contract.status === "SIGNED";
            }
            if (filter === "cancelled") {
              return contract.status === "CANCELLED";
            }
            return true;
          });

    const sorted = [...visible].sort((a, b) => {
      const dateA = new Date(a.generatedAt).getTime();
      const dateB = new Date(b.generatedAt).getTime();
      const amountA = Number(a.monthlyPrice);
      const amountB = Number(b.monthlyPrice);

      if (sort === "oldest") {
        return dateA - dateB;
      }
      if (sort === "amount") {
        return amountB - amountA;
      }
      return dateB - dateA;
    });

    return sorted;
  }, [contracts, filter, sort]);

  const activeSelectedContractId =
    filteredContracts.some((contract) => contract.id === selectedContractId)
      ? selectedContractId
      : filteredContracts[0]?.id ?? "";

  const selectedContract =
    filteredContracts.find((contract) => contract.id === activeSelectedContractId) ??
    filteredContracts[0] ??
    null;

  async function handleGenerate(contract: SafeGeneratedContract) {
    setBusyId(contract.id);
    setNotice(null);
    try {
      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: contract.bookingId,
        }),
      });

      const payload = (await response.json()) as {
        contract?: SafeGeneratedContract;
        error?: string;
      };

      if (!response.ok || !payload.contract) {
        throw new Error(payload.error ?? t("contracts.unableToGenerate"));
      }

      setContracts((current) => {
        const next = current.some((item) => item.id === payload.contract?.id)
          ? current.map((item) => (item.id === payload.contract?.id ? payload.contract! : item))
          : [payload.contract!, ...current];

        return next;
      });
      setSelectedContractId(payload.contract.id);
      setNotice(t("contracts.generatedSuccess"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("contracts.unableToGenerate"));
    } finally {
      setBusyId(null);
    }
  }

  function canSignContract(contract: SafeGeneratedContract) {
    if (contract.status === "SIGNED" || contract.status === "CANCELLED") {
      return false;
    }

    return viewerRole === "OWNER" || viewerRole === "RENTER" || viewerRole === "ADMIN";
  }

  async function handleSign(contract: SafeGeneratedContract) {
    setBusyId(contract.id);
    setNotice(null);

    try {
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const payload = (await response.json()) as {
        contract?: SafeGeneratedContract;
        error?: string;
      };

      if (!response.ok || !payload.contract) {
        throw new Error(payload.error ?? t("contracts.unableToSign"));
      }

      setContracts((current) =>
        current.map((item) => (item.id === payload.contract?.id ? payload.contract! : item)),
      );
      setSelectedContractId(payload.contract.id);
      setNotice(t("contracts.signedSuccess"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("contracts.unableToSign"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)] xl:items-start">
      <section className="space-y-6">
        <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low/70 p-4 shadow-[0_10px_32px_rgba(17,24,39,0.05)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                {t("contracts.filterStatus")}
              </span>
              <select
                className="min-h-11 rounded-full border border-outline-variant/60 bg-surface px-4 py-2 text-body-sm font-medium text-on-surface ring-0 transition-shadow focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as "all" | "generated" | "sent" | "signed" | "cancelled")
                }
              >
                <option value="all">
                  {isAdmin ? t("contracts.allContracts") : t("contracts.allStatuses")}
                </option>
                <option value="generated">{t("contracts.statusGenerated")}</option>
                <option value="sent">{t("contracts.statusSent")}</option>
                <option value="signed">{t("contracts.statusSigned")}</option>
                <option value="cancelled">{t("contracts.statusCancelled")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                {t("common.sortBy")}
              </span>
              <select
                className="min-h-11 rounded-full border border-outline-variant/60 bg-surface px-4 py-2 text-body-sm font-medium text-on-surface ring-0 transition-shadow focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                value={sort}
                onChange={(event) => setSort(event.target.value as "newest" | "oldest" | "amount")}
              >
                <option value="newest">{t("contracts.newestFirst")}</option>
                <option value="oldest">{t("contracts.oldestFirst")}</option>
                <option value="amount">{t("contracts.amountHighLow")}</option>
              </select>
            </div>
          </div>
        </div>

        {isAdmin ? (
        <div className="rounded-[24px] border border-secondary/20 bg-secondary-container/15 px-4 py-3 text-body-sm text-primary shadow-[0_8px_24px_rgba(15,61,62,0.04)]">
            {t("contracts.adminAllContractsNote")}
          </div>
        ) : null}

        <div className="space-y-4 lg:hidden">
          {filteredContracts.length ? (
            filteredContracts.map((contract) => (
              <article
                className={`rounded-[24px] border p-4 shadow-[0_8px_24px_rgba(15,61,62,0.04)] transition-all ${
                  contract.id === activeSelectedContractId
                    ? "border-secondary/40 bg-secondary-container/10"
                    : "border-outline-variant/60 bg-surface-container-lowest"
                }`}
                key={contract.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      className="block text-left"
                      type="button"
                      onClick={() => setSelectedContractId(contract.id)}
                    >
                      <div className="line-clamp-2 font-h3 text-h3 text-primary">
                        {contract.listingTitle}
                      </div>
                      <div className="mt-1 text-body-sm text-on-surface-variant">
                        {t("contracts.bookingNumber", { number: contract.bookingNumber })}
                      </div>
                    </button>
                  </div>
                  <span
                    className={`${getStatusStyles(contract.status)} shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}
                  >
                    {t(`status.contract.${contract.status}`)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className={`${getTypeStyles(contract.contractType)} rounded-2xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                    {getContractTypeBadge(contract.contractType, locale)}
                  </div>
                    <div className="rounded-2xl border border-outline-variant/60 bg-background/60 px-3 py-2 text-body-sm text-on-surface-variant">
                    {formatDate(contract.generatedAt, locale)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant/60 px-4 py-2 text-label-caps text-[11px] uppercase tracking-[0.18em] text-primary transition-colors hover:bg-surface-container-low"
                    type="button"
                    onClick={() => setSelectedContractId(contract.id)}
                  >
                    {t("common.viewDetails")}
                  </button>
                  <button
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-secondary px-4 py-2 text-label-caps text-[11px] uppercase tracking-[0.18em] text-on-secondary transition-opacity hover:bg-[#d9590f] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canGenerate || busyId === contract.id}
                    type="button"
                    onClick={() => handleGenerate(contract)}
                  >
                    {busyId === contract.id ? t("common.loading") : t("contracts.generate")}
                  </button>
                  {canSignContract(contract) ? (
                    <button
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-secondary/35 px-4 py-2 text-label-caps text-[11px] uppercase tracking-[0.18em] text-secondary transition-colors hover:bg-secondary-container/20 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === contract.id}
                      type="button"
                      onClick={() => handleSign(contract)}
                    >
                      {busyId === contract.id ? t("common.loading") : t("sign")}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-outline-variant/60 bg-surface-container-lowest px-5 py-10 text-center text-on-surface-variant">
              {t("contracts.noContracts")}
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_10px_30px_rgba(17,24,39,0.05)] lg:block">
          <table className="min-w-[780px] w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="border-b border-outline-variant/60 px-6 py-4 font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  {t("contracts.booking")}
                </th>
                <th className="border-b border-outline-variant/60 px-6 py-4 font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  {t("contracts.type")}
                </th>
                <th className="border-b border-outline-variant/60 px-6 py-4 font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  {t("contracts.status")}
                </th>
                <th className="border-b border-outline-variant/60 px-6 py-4 font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  {t("contracts.date")}
                </th>
                <th className="border-b border-outline-variant/60 px-6 py-4 text-right font-label-caps text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  {t("contracts.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/20">
              {filteredContracts.length ? (
                filteredContracts.map((contract) => (
                  <tr
                    className={
                      contract.id === selectedContractId
                        ? "border-l-4 border-l-secondary bg-secondary-container/10"
                        : "transition-colors hover:bg-surface-container-low"
                    }
                    key={contract.id}
                  >
                    <td className="px-6 py-4 align-top">
                      <button
                        className="w-full text-left"
                        type="button"
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <div className="font-h3 text-body-md text-primary">
                          {contract.listingTitle}
                        </div>
                        <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                          {t("contracts.bookingNumber", { number: contract.bookingNumber })}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`${getTypeStyles(contract.contractType)} inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}
                      >
                        {getContractTypeBadge(contract.contractType, locale)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`${getStatusStyles(contract.status)} inline-flex rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]`}
                      >
                        {t(`status.contract.${contract.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top font-body-sm text-body-sm text-on-surface-variant">
                      {formatDate(contract.generatedAt, locale)}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-3">
                        <button
                        className="rounded-full border border-outline-variant/60 px-4 py-2 font-label-caps text-[11px] uppercase tracking-[0.18em] text-primary transition-colors hover:bg-surface-container-low"
                          type="button"
                          onClick={() => setSelectedContractId(contract.id)}
                        >
                          {t("common.viewDetails")}
                        </button>
                        <button
                        className="rounded-full bg-secondary px-4 py-2 font-label-caps text-[11px] uppercase tracking-[0.18em] text-on-secondary transition-opacity hover:bg-[#d9590f] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!canGenerate || busyId === contract.id}
                          type="button"
                          onClick={() => handleGenerate(contract)}
                        >
                          {busyId === contract.id ? t("common.loading") : t("contracts.generate")}
                        </button>
                        {canSignContract(contract) ? (
                          <button
                            className="rounded-full border border-secondary/35 px-4 py-2 font-label-caps text-[11px] uppercase tracking-[0.18em] text-secondary transition-colors hover:bg-secondary-container/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={busyId === contract.id}
                            type="button"
                            onClick={() => handleSign(contract)}
                          >
                            {busyId === contract.id ? t("common.loading") : t("sign")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-12 text-center text-on-surface-variant" colSpan={5}>
                    {t("contracts.noContracts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="xl:sticky xl:top-32 self-start">
        <section className="overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 p-5 sm:p-6">
            <div>
              <h2 className="font-h2 text-h2 text-primary">
                {selectedContract?.listingTitle ?? t("contracts.noSelected")}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {selectedContract
                  ? t("contracts.contractDocument", { number: selectedContract.contractNumber })
                  : t("contracts.selectPreview")}
              </p>
            </div>
            {selectedContract ? (
              <a
                className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors"
                href={downloadHref(selectedContract.id)}
                aria-label={t("contracts.download")}
                download={selectedContract.generatedFileName}
              >
                download
              </a>
            ) : (
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors"
                type="button"
              >
                close
              </button>
            )}
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-surface-container-high sm:min-h-[420px] xl:min-h-[500px]">
            <div className="pdf-preview-canvas absolute inset-0 opacity-40" />

            {selectedContract ? (
              <div className="relative z-10 flex h-[260px] w-[82%] max-w-[360px] flex-col gap-4 rounded-[20px] border border-outline-variant/60 bg-surface p-6 shadow-[0_20px_50px_rgba(17,24,39,0.12)] sm:h-[340px] sm:max-w-[420px] sm:p-8">
                <div className="h-10 w-2/3 rounded-sm bg-surface-container" />

                <div className="space-y-2">
                  <div className="h-4 bg-surface-container-low w-full rounded-sm" />
                  <div className="h-4 bg-surface-container-low w-full rounded-sm" />
                  <div className="h-4 bg-surface-container-low w-5/6 rounded-sm" />
                </div>

                <div className="mt-auto flex justify-between border-t border-outline-variant pt-6">
                  <div className="text-left">
                    <p className="text-xs text-on-surface-variant">{t("contracts.monthly")}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(selectedContract.monthlyPrice, locale)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-on-surface-variant">{t("contracts.deposit")}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(selectedContract.depositAmount, locale)}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 flex cursor-pointer items-center justify-center group">
                  <div className="flex items-center gap-2 rounded-full bg-secondary/90 px-5 py-3 font-label-caps text-[11px] uppercase tracking-[0.18em] text-on-secondary opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined">zoom_in</span>
                    {t("contracts.fullscreenPreview")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex h-[260px] w-[82%] max-w-[360px] flex-col items-center justify-center gap-4 rounded-[20px] border border-outline-variant/60 bg-surface p-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.12)] sm:h-[340px] sm:max-w-[420px] sm:p-8">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t("contracts.generatedPreview")}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 bg-surface-container-low p-5 sm:p-6">
            {notice ? (
              <p className="text-body-sm font-body-sm text-primary">{notice}</p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                className={`flex-1 rounded-full bg-secondary py-3 text-center text-sm font-bold text-on-secondary transition-opacity ${selectedContract ? "" : "pointer-events-none opacity-50"}`}
                href={
                  selectedContract
                    ? downloadHref(selectedContract.id)
                    : "#"
                }
                download={selectedContract?.generatedFileName}
                >
                  {t("contracts.download")}
                </a>

              {selectedContract && canSignContract(selectedContract) ? (
                <button
                  className="flex-1 rounded-full border border-secondary/35 py-3 text-sm font-bold text-secondary transition-colors hover:bg-secondary-container/20 disabled:opacity-50"
                  disabled={busyId === selectedContract.id}
                  type="button"
                  onClick={() => {
                    void handleSign(selectedContract);
                  }}
                >
                  {busyId === selectedContract.id ? t("common.loading") : t("sign")}
                </button>
              ) : null}

              <button
                className="flex-1 rounded-full border border-outline-variant/60 py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
                disabled={!selectedContract || !canGenerate || busyId === selectedContract?.id}
                type="button"
                onClick={() => {
                  if (selectedContract) {
                    void handleGenerate(selectedContract);
                  }
                }}
              >
                {busyId === selectedContract?.id ? t("common.loading") : t("contracts.generate")}
              </button>
            </div>

            {selectedContract ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-outline-variant/60 bg-surface/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                    {t("contracts.bookingLink")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">
                    {selectedContract.bookingNumber}
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/60 bg-surface/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                    {t("contracts.generated")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">
                    {formatDate(selectedContract.generatedAt, locale)}
                  </p>
                </div>
              </div>
            ) : null}

            <h3 className="mb-4 font-label-caps text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
              {t("contracts.timeline")}
            </h3>

            <div className="relative space-y-4">
              <div className="absolute bottom-2 top-2 left-2.5 w-px bg-outline-variant" />

              {selectedContract ? (
                <>
                  <div className="flex items-start gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-[14px] text-on-secondary fill-icon">
                        check
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md text-on-surface leading-none">
                        {t("contracts.generated")}
                      </p>
                      <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                        {formatDate(selectedContract.generatedAt, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-surface-container-highest border border-outline-variant z-10" />
                    <div>
                      <p className="font-body-md text-body-md text-on-surface leading-none">
                        {t("contracts.currentStatus")}
                      </p>
                      <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                        {t(`status.contract.${selectedContract.status}`)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-surface-container-highest border border-outline-variant z-10" />
                    <div>
                      <p className="font-body-md text-body-md text-on-surface leading-none">
                        {t("contracts.bookingReady")}
                      </p>
                      <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                        {getBookingStatusLabel(selectedContract.bookingStatus, t)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pl-8 text-body-sm text-on-surface-variant">
                  {t("contracts.noSelected")}
                </div>
              )}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
