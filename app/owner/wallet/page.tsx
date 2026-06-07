"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import WalletWithdrawalForm from "@/components/owner/WalletWithdrawalForm";

type WalletSummary = {
  walletBalance: string;
  pendingWithdrawals: string;
  totalEarnings: string;
  iban: string | null;
  bankName: string | null;
  accountHolder: string | null;
  bicSwift: string | null;
};

type WithdrawalRow = {
  id: string;
  amount: string;
  status: string;
  iban: string;
  bankName: string | null;
  accountHolder: string | null;
  adminNote: string | null;
  paymentReference: string | null;
  requestedAt: string;
  processedAt: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-500/10 text-amber-700",
  PROCESSING: "bg-blue-500/10 text-blue-700",
  PAID: "bg-[#4b6547]/10 text-[#4b6547]",
  REJECTED: "bg-error/10 text-error",
  CANCELLED: "bg-stone-100 text-stone-500",
};

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `€${value}`;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export default function OwnerWalletPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function loadWallet() {
    try {
      const res = await fetch("/api/owner/wallet-summary", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as WalletSummary;
        setSummary(data);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingWallet(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/owner/withdrawals", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as { withdrawals: WithdrawalRow[] };
        setWithdrawals(data.withdrawals);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadWallet();
    loadHistory();
  }, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    setCancelError(null);
    try {
      const res = await fetch(`/api/owner/withdrawals/${id}/cancel`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as { cancelled?: boolean; error?: string };
      if (!res.ok || !data.cancelled) {
        setCancelError(data.error ?? t("errors.generic"));
        return;
      }
      await loadWallet();
      await loadHistory();
    } catch {
      setCancelError(t("errors.generic"));
    } finally {
      setCancellingId(null);
    }
  }

  function handleWithdrawalSuccess() {
    loadWallet();
    loadHistory();
  }

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 space-y-8 sm:space-y-10">

        {/* Header */}
        <header className="relative overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-secondary-container/25 blur-3xl" />
          <div className="relative z-10 space-y-2">
            <p className="text-label-caps font-label-caps text-secondary tracking-[0.22em] uppercase">
              {t("wallet.sectionLabel")}
            </p>
            <h1 className="text-h1 font-h1 text-primary">{t("wallet.title")}</h1>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-lg">
              {t("wallet.subtitle")}
            </p>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {loadingWallet ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-36 rounded-[24px] bg-surface-container animate-pulse" />
            ))
          ) : (
            <>
              <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 shadow-[0_10px_32px_rgba(17,24,39,0.05)] space-y-2">
                <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {t("wallet.availableBalance")}
                </p>
                <p className="text-display font-display text-primary">
                  {summary ? formatMoney(summary.walletBalance) : "—"}
                </p>
                <p className="text-body-sm font-body-sm text-secondary">
                  {t("wallet.availableDescription")}
                </p>
              </div>

              <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 shadow-[0_10px_32px_rgba(17,24,39,0.05)] space-y-2">
                <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {t("wallet.pendingWithdrawals")}
                </p>
                <p className="text-display font-display text-primary">
                  {summary ? formatMoney(summary.pendingWithdrawals) : "—"}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("wallet.pendingDescription")}
                </p>
              </div>

              <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 shadow-[0_10px_32px_rgba(17,24,39,0.05)] space-y-2">
                <p className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {t("wallet.totalEarnings")}
                </p>
                <p className="text-display font-display text-primary">
                  {summary ? formatMoney(summary.totalEarnings) : "—"}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {t("wallet.totalDescription")}
                </p>
              </div>
            </>
          )}
        </section>

        {/* Withdrawal form */}
        <section className="rounded-[28px] border border-outline-variant/60 bg-surface p-5 sm:p-7 lg:p-10 shadow-[0_16px_50px_rgba(17,24,39,0.06)] space-y-5">
          <div>
            <h2 className="text-h3 font-h3 text-primary">{t("wallet.requestWithdrawal")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              {t("wallet.requestDescription")}
            </p>
          </div>

          {loadingWallet ? (
            <div className="h-48 rounded-[20px] bg-surface-container animate-pulse" />
          ) : (
            <WalletWithdrawalForm
              availableBalance={summary?.walletBalance ?? "0.00"}
              defaultAccountHolder={summary?.accountHolder ?? null}
              defaultBankName={summary?.bankName ?? null}
              defaultBicSwift={summary?.bicSwift ?? null}
              defaultIban={summary?.iban ?? null}
              onSuccess={handleWithdrawalSuccess}
            />
          )}
        </section>

        {/* Withdrawal history */}
        <section className="rounded-[28px] border border-outline-variant/60 bg-surface overflow-hidden shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
          <div className="px-5 py-5 sm:px-7 sm:py-6 border-b border-outline-variant/10">
            <h2 className="text-h3 font-h3 text-primary">{t("wallet.historyTitle")}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
              {t("wallet.historyDescription")}
            </p>
          </div>

          {loadingHistory ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-on-surface-variant">
              {t("wallet.noHistory")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/10">
                    <th className="px-5 py-3 text-label-caps font-label-caps text-on-surface-variant">{t("wallet.amount")}</th>
                    <th className="px-5 py-3 text-label-caps font-label-caps text-on-surface-variant">{t("wallet.statusLabel")}</th>
                    <th className="px-5 py-3 text-label-caps font-label-caps text-on-surface-variant">{t("wallet.ibanLabel")}</th>
                    <th className="px-5 py-3 text-label-caps font-label-caps text-on-surface-variant">{t("wallet.requestedAt")}</th>
                    <th className="px-5 py-3 text-label-caps font-label-caps text-on-surface-variant">{t("wallet.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-body-sm text-on-surface">
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="px-5 py-4 font-semibold">{formatMoney(w.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[w.status] ?? "bg-stone-100 text-stone-500"}`}>
                          {t(`wallet.status_${w.status}`)}
                        </span>
                        {w.adminNote && (
                          <p className="text-[11px] text-error mt-0.5">{w.adminNote}</p>
                        )}
                        {w.paymentReference && (
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {t("wallet.refLabel")}: {w.paymentReference}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant font-mono text-[12px]">
                        {w.iban.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">
                        {new Date(w.requestedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {w.status === "REQUESTED" && (
                          <button
                            className="inline-flex rounded-full border border-error/30 bg-error/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                            disabled={cancellingId === w.id}
                            type="button"
                            onClick={() => handleCancel(w.id)}
                          >
                            {cancellingId === w.id ? t("common.loading") : t("wallet.cancel")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cancelError && (
                <p className="px-5 py-2 text-xs text-error font-medium">{cancelError}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
