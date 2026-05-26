import Link from "next/link";

import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function PaymentCancelPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const invoiceId = firstValue(params.invoice_id);

  return (
    <main className="min-h-screen bg-background text-on-background px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:gap-8">
        <div className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface-container-lowest/95 shadow-[0_12px_40px_rgba(15,61,62,0.05)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5 sm:p-8 lg:p-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary-container/25 px-4 py-2 font-label-caps text-[11px] uppercase tracking-[0.24em] text-secondary">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                {t("payments.payment")}
              </p>

              <div className="mt-6 max-w-3xl space-y-4">
                <h1 className="font-h1 text-[clamp(2.5rem,4vw,4.2rem)] leading-[0.95] text-primary">
                  {t("payments.cancelTitle")}
                </h1>
                <p className="max-w-2xl text-body-lg text-on-surface-variant">
                  {t("payments.cancelDescription")}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 font-label-caps text-label-caps text-on-primary transition-opacity hover:opacity-90 sm:w-auto"
                  href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"}
                >
                  {t("payments.returnToInvoice")}
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant px-6 py-3 font-label-caps text-label-caps text-primary transition-colors hover:bg-surface-container sm:w-auto"
                  href="/renter/dashboard"
                >
                  {t("payments.goBack")}
                </Link>
              </div>
            </div>

            <aside className="border-t border-outline-variant/30 bg-background/55 p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
              <div className="flex h-full flex-col justify-between gap-6 rounded-[28px] border border-outline-variant/30 bg-surface-container-low px-5 py-6">
                <div className="space-y-3">
                  <div className="inline-flex rounded-full bg-secondary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                    {t("payments.cancelTitle")}
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {invoiceId
                      ? t("payments.invoiceReference", { value: invoiceId })
                      : t("payments.cancelDescription")}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#cfa7a7]/50 bg-[#fff6f6] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b2d2d]">
                    {t("payments.payment")}
                  </p>
                  <p className="mt-2 text-sm text-[#7b2d2d]/85">
                    {t("payments.cancelDescription")}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
