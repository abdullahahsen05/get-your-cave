"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  ownerName: string;
  ownerEmail: string;
};

type Props = {
  initialWithdrawals: WithdrawalRow[];
  total: number;
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
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function AdminWithdrawalsWorkspace({ initialWithdrawals, total }: Props) {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>(initialWithdrawals);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<Record<string, string>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  async function markProcessing(id: string) {
    setBusyId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "PROCESSING" }),
      });
      const data = (await res.json()) as { withdrawal?: WithdrawalRow; error?: string };
      if (!res.ok || !data.withdrawal) {
        setErrorId(id);
        setErrorMsg(data.error ?? t("errors.generic"));
        return;
      }
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "PROCESSING" } : w)),
      );
    } catch {
      setErrorId(id);
      setErrorMsg(t("errors.generic"));
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(id: string) {
    setBusyId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "PAID", paymentReference: paymentRef[id] || null }),
      });
      const data = (await res.json()) as { withdrawal?: WithdrawalRow; error?: string };
      if (!res.ok || !data.withdrawal) {
        setErrorId(id);
        setErrorMsg(data.error ?? t("errors.generic"));
        return;
      }
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, status: "PAID", paymentReference: paymentRef[id] ?? null }
            : w,
        ),
      );
    } catch {
      setErrorId(id);
      setErrorMsg(t("errors.generic"));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ adminNote: rejectNote[id] || null }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setErrorId(id);
        setErrorMsg(data.error ?? t("errors.generic"));
        return;
      }
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: "REJECTED", adminNote: rejectNote[id] ?? null } : w,
        ),
      );
    } catch {
      setErrorId(id);
      setErrorMsg(t("errors.generic"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-h2 text-primary">{t("withdrawal.adminTitle")}</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {total === 0
            ? t("withdrawal.adminNone")
            : t("withdrawal.adminCount", { count: total })}
        </p>
      </div>

      {withdrawals.length === 0 ? (
        <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-10 text-center text-body-sm text-on-surface-variant">
          {t("withdrawal.adminNone")}
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => {
            const isActionable = w.status === "REQUESTED" || w.status === "PROCESSING";
            return (
              <article
                key={w.id}
                className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 shadow-[0_10px_32px_rgba(17,24,39,0.05)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-h3 font-h3 text-primary">{formatMoney(w.amount)}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[w.status] ?? ""}`}>
                        {t(`wallet.status_${w.status}`)}
                      </span>
                    </div>
                    <p className="text-body-sm font-medium text-on-surface">
                      {w.ownerName}
                      <span className="text-on-surface-variant font-normal"> — {w.ownerEmail}</span>
                    </p>
                    <p className="text-body-sm text-on-surface-variant font-mono text-[12px]">
                      IBAN: {w.iban}
                      {w.bankName ? ` · ${w.bankName}` : ""}
                      {w.accountHolder ? ` · ${w.accountHolder}` : ""}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {t("wallet.requestedAt")}: {new Date(w.requestedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      {w.processedAt && ` · ${t("withdrawal.processedAt")}: ${new Date(w.processedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                    {w.paymentReference && (
                      <p className="text-[11px] text-[#4b6547]">
                        {t("wallet.refLabel")}: {w.paymentReference}
                      </p>
                    )}
                    {w.adminNote && (
                      <p className="text-[11px] text-error">{w.adminNote}</p>
                    )}
                  </div>

                  {isActionable && (
                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                      {w.status === "REQUESTED" && (
                        <button
                          className="inline-flex justify-center rounded-full border border-outline-variant/70 bg-surface-container-low px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-surface-container transition-colors disabled:opacity-60"
                          disabled={busyId !== null}
                          type="button"
                          onClick={() => markProcessing(w.id)}
                        >
                          {busyId === w.id ? t("common.loading") : t("withdrawal.markProcessing")}
                        </button>
                      )}

                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none"
                          placeholder={t("withdrawal.paymentRefPlaceholder")}
                          type="text"
                          value={paymentRef[w.id] ?? ""}
                          onChange={(e) =>
                            setPaymentRef((prev) => ({ ...prev, [w.id]: e.target.value }))
                          }
                        />
                        <button
                          className="inline-flex justify-center rounded-full bg-[#4b6547] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                          disabled={busyId !== null}
                          type="button"
                          onClick={() => markPaid(w.id)}
                        >
                          {busyId === w.id ? t("common.loading") : t("withdrawal.markPaid")}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-xl border border-error/30 bg-error/5 px-3 py-1.5 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                          placeholder={t("withdrawal.rejectNotePlaceholder")}
                          type="text"
                          value={rejectNote[w.id] ?? ""}
                          onChange={(e) =>
                            setRejectNote((prev) => ({ ...prev, [w.id]: e.target.value }))
                          }
                        />
                        <button
                          className="inline-flex justify-center rounded-full border border-error/30 bg-error/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                          disabled={busyId !== null}
                          type="button"
                          onClick={() => reject(w.id)}
                        >
                          {busyId === w.id ? t("common.loading") : t("withdrawal.reject")}
                        </button>
                      </div>

                      {errorId === w.id && errorMsg && (
                        <p className="text-xs text-error font-medium">{errorMsg}</p>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
