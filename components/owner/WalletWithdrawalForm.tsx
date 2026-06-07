"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  availableBalance: string;
  defaultIban: string | null;
  defaultBankName: string | null;
  defaultAccountHolder: string | null;
  defaultBicSwift: string | null;
  onSuccess: () => void;
};

type WithdrawalRecord = {
  id: string;
  amount: string;
  status: string;
};

export default function WalletWithdrawalForm({
  availableBalance,
  defaultIban,
  defaultBankName,
  defaultAccountHolder,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState(defaultIban ?? "");
  const [bankName, setBankName] = useState(defaultBankName ?? "");
  const [accountHolder, setAccountHolder] = useState(defaultAccountHolder ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const available = Number(availableBalance);
  const requested = Number(amount);
  const isOverdrawn = Number.isFinite(requested) && requested > available;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!amount || !Number.isFinite(requested) || requested <= 0) {
      setError(t("wallet.errorAmountRequired"));
      return;
    }

    if (isOverdrawn) {
      setError(t("wallet.errorInsufficientBalance"));
      return;
    }

    if (!iban.trim()) {
      setError(t("wallet.errorIbanRequired"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/owner/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: Number(requested.toFixed(2)),
          iban: iban.trim(),
          bankName: bankName.trim() || null,
          accountHolder: accountHolder.trim() || null,
        }),
      });

      const data = (await res.json()) as {
        withdrawal?: WithdrawalRecord;
        error?: string;
      };

      if (!res.ok || !data.withdrawal) {
        setError(data.error ?? t("errors.generic"));
        return;
      }

      setSuccess(true);
      setAmount("");
      onSuccess();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {success && (
        <div className="rounded-[16px] border border-[#4b6547]/25 bg-[#4b6547]/8 px-4 py-3 text-body-sm text-[#4b6547] font-medium">
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">check_circle</span>
          {t("wallet.requestSubmitted")}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase" htmlFor="wr-amount">
          {t("wallet.amount")}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant">€</span>
          <input
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low py-3 pl-8 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
            id="wr-amount"
            inputMode="decimal"
            max={availableBalance}
            min="0.01"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={amount}
            onChange={(e) => {
              setError(null);
              setSuccess(false);
              setAmount(e.target.value);
            }}
          />
        </div>
        {isOverdrawn && (
          <p className="text-xs text-error">{t("wallet.errorInsufficientBalance")}</p>
        )}
        <p className="text-[11px] text-on-surface-variant">
          {t("wallet.availableLabel")}: €{available.toFixed(2)}
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase" htmlFor="wr-iban">
          IBAN
        </label>
        <input
          className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
          id="wr-iban"
          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          type="text"
          value={iban}
          onChange={(e) => {
            setError(null);
            setIban(e.target.value);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase" htmlFor="wr-holder">
            {t("wallet.accountHolder")}
          </label>
          <input
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
            id="wr-holder"
            placeholder={t("wallet.accountHolderPlaceholder")}
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase" htmlFor="wr-bank">
            {t("wallet.bankName")}
          </label>
          <input
            className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
            id="wr-bank"
            placeholder={t("wallet.bankNamePlaceholder")}
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 font-label-caps text-label-caps uppercase text-white shadow-[0_8px_20px_rgba(242,106,27,0.2)] transition-all hover:bg-[#d9590f] disabled:opacity-60"
        disabled={submitting || isOverdrawn}
        type="submit"
      >
        <span className="material-symbols-outlined text-[18px]">account_balance</span>
        {submitting ? t("common.loading") : t("wallet.submitRequest")}
      </button>
    </form>
  );
}
