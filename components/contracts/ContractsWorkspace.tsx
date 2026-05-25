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
      return "bg-primary-fixed text-on-primary-fixed-variant";
    case "GENERATED":
      return "bg-secondary-container text-on-secondary-container";
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
      return "bg-secondary-container/50 text-on-secondary-container";
    case "PLATFORM_INTRODUCTION":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    default:
      return "bg-primary-fixed/40 text-on-primary-fixed-variant";
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
  }, [contracts, filter, sort, t]);

  const selectedContract =
    filteredContracts.find((contract) => contract.id === selectedContractId) ??
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className="lg:col-span-7 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {t("contracts.filterStatus")}
            </span>
            <select
              className="bg-surface border-none rounded-full px-6 py-1 font-body-sm text-body-sm text-on-surface ring-1 ring-outline-variant focus:ring-primary transition-shadow"
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {t("common.sortBy")}
            </span>
            <select
              className="bg-surface border-none rounded-full px-6 py-1 font-body-sm text-body-sm text-on-surface ring-1 ring-outline-variant focus:ring-primary transition-shadow"
              value={sort}
              onChange={(event) => setSort(event.target.value as "newest" | "oldest" | "amount")}
            >
              <option value="newest">{t("contracts.newestFirst")}</option>
              <option value="oldest">{t("contracts.oldestFirst")}</option>
              <option value="amount">{t("contracts.amountHighLow")}</option>
            </select>
          </div>
        </div>

        {isAdmin ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-body-sm text-primary">
            {t("contracts.adminAllContractsNote")}
          </div>
        ) : null}

        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 overflow-x-auto shadow-[0_4px_20px_rgba(15,61,62,0.02)]">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                  {t("contracts.booking")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                  {t("contracts.type")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                  {t("contracts.status")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30">
                  {t("contracts.date")}
                </th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30 text-right">
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
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : "hover:bg-surface-container-low transition-colors"
                    }
                    key={contract.id}
                  >
                    <td className="px-6 py-4">
                      <button
                        className="text-left w-full"
                        type="button"
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <div className="font-h3 text-body-md text-primary">
                          {contract.listingTitle}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          {t("contracts.bookingNumber", { number: contract.bookingNumber })}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${getTypeStyles(contract.contractType)} px-2 py-1 rounded font-label-caps text-[10px]`}
                      >
                        {getContractTypeBadge(contract.contractType, locale)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${getStatusStyles(contract.status)} px-4 py-1 rounded-full font-label-caps text-[11px]`}
                      >
                        {t(`status.contract.${contract.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                      {formatDate(contract.generatedAt, locale)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="text-primary font-label-caps text-label-caps hover:underline mr-4"
                        type="button"
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        {t("common.viewDetails")}
                      </button>
                      <button
                        className="text-primary font-label-caps text-label-caps hover:underline disabled:opacity-50"
                        disabled={!canGenerate || busyId === contract.id}
                        type="button"
                        onClick={() => handleGenerate(contract)}
                      >
                        {busyId === contract.id ? t("common.loading") : t("contracts.generate")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-on-surface-variant"
                    colSpan={5}
                  >
                    {t("contracts.noContracts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="lg:col-span-5">
        <section className="lg:sticky lg:top-32 bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-[0_8px_40px_rgba(15,61,62,0.06)] overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-start gap-4">
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
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                href={downloadHref(selectedContract.id)}
                aria-label={t("contracts.download")}
                download={selectedContract.generatedFileName}
              >
                download
              </a>
            ) : (
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                type="button"
              >
                close
              </button>
            )}
          </div>

          <div className="bg-surface-container-high h-[500px] flex items-center justify-center relative overflow-hidden">
            <div className="pdf-preview-canvas absolute inset-0 opacity-40" />

            {selectedContract ? (
              <div className="relative z-10 w-4/5 h-[400px] bg-white shadow-xl rounded-sm p-12 flex flex-col gap-4">
                <div className="h-10 bg-surface-container w-2/3 rounded-sm" />

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

                <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                  <div className="bg-primary/90 text-on-primary px-6 py-4 rounded-full font-label-caps text-label-caps flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined">zoom_in</span>
                    {t("contracts.fullscreenPreview")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 w-4/5 h-[400px] bg-white shadow-xl rounded-sm p-12 flex flex-col items-center justify-center text-center gap-4">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t("contracts.generatedPreview")}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 bg-surface-container-low space-y-4">
            {notice ? (
              <p className="text-body-sm font-body-sm text-primary">{notice}</p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                className={`flex-1 bg-primary-container text-on-primary py-3 rounded-full text-sm font-bold text-center ${selectedContract ? "" : "opacity-50 pointer-events-none"}`}
                href={
                  selectedContract
                    ? downloadHref(selectedContract.id)
                    : "#"
                }
                download={selectedContract?.generatedFileName}
              >
                {t("contracts.download")}
              </a>

              <button
                className="flex-1 border border-outline-variant text-primary py-3 rounded-full text-sm font-bold hover:bg-surface-container transition-colors disabled:opacity-50"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-lg p-4 border border-outline-variant/20">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {t("contracts.bookingLink")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">
                    {selectedContract.bookingNumber}
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-outline-variant/20">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {t("contracts.generated")}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">
                    {formatDate(selectedContract.generatedAt, locale)}
                  </p>
                </div>
              </div>
            ) : null}

            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest text-[10px]">
              {t("contracts.timeline")}
            </h3>

            <div className="relative space-y-4">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-outline-variant" />

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
