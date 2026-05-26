"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  durationMonths: number | null;
  monthlyPrice: string;
  totalMonthlyAmount: string;
  renterNote: string | null;
};

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function OwnerBookingDetails({
  durationMonths,
  monthlyPrice,
  totalMonthlyAmount,
  renterNote,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const months = durationMonths ?? 1;
  const estimatedTotal = (Number(totalMonthlyAmount) * months).toFixed(2);

  return (
    <div className="pt-1">
      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-full border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container sm:w-auto"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined text-sm leading-none">
          {open ? "expand_less" : "expand_more"}
        </span>
        {open ? t("common.collapse") : t("dashboard.owner.bookingDetails")}
      </button>

      {open ? (
        <div className="mt-3 space-y-3 rounded-[20px] border border-outline-variant/30 bg-surface-container-low px-4 py-4 text-body-sm font-body-sm text-on-surface-variant sm:px-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
            <span>{t("dashboard.owner.duration")}</span>
            <span className="font-semibold text-on-surface">
              {months} {months === 1 ? t("dashboard.owner.month") : t("dashboard.owner.months")}
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
            <span>{t("dashboard.owner.monthlyRent")}</span>
            <span className="font-semibold text-on-surface">{formatMoney(monthlyPrice)}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-outline-variant/20 pt-3">
            <span>{t("dashboard.owner.estimatedTotal")}</span>
            <span className="font-bold text-primary">{formatMoney(estimatedTotal)}</span>
          </div>
          {renterNote ? (
            <div className="border-t border-outline-variant/20 pt-3 space-y-1">
              <span className="text-label-caps font-label-caps uppercase">
                {t("dashboard.owner.renterNote")}
              </span>
              <p className="text-on-surface italic leading-relaxed">{renterNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
