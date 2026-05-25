import Link from "next/link";
import { revalidatePath } from "next/cache";

import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";
import { confirmStripeSessionIfPaid } from "@/lib/payments/confirmStripeSession";

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

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const invoiceId = firstValue(params.invoice_id);
  const sessionId = firstValue(params.session_id);

  // Fallback: verify the Stripe session server-side in case the webhook hasn't arrived yet.
  // This is idempotent — the webhook handler uses the same guards so no double-credit occurs.
  if (sessionId) {
    await confirmStripeSessionIfPaid(sessionId);
    if (invoiceId) {
      revalidatePath(`/invoices/${invoiceId}`);
      revalidatePath("/invoices");
      revalidatePath("/renter/dashboard");
    }
  }
  const invoiceHref = invoiceId
    ? `/invoices/${invoiceId}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`
    : "/invoices";

  return (
    <main className="min-h-screen bg-background text-on-background pt-28 sm:pt-32 pb-24 mx-auto max-w-[960px] px-4 sm:px-6">
      <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
        <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-3">
          {t("payments.payment")}
        </p>
        <h1 className="font-h1 text-h1 text-primary">{t("payments.successTitle")}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 max-w-2xl">
          {t("payments.successDescription")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-label-caps text-label-caps text-on-primary"
            href={invoiceHref}
          >
            {t("payments.viewInvoices")}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-outline-variant px-5 py-3 font-label-caps text-label-caps text-primary"
            href="/renter/dashboard"
          >
            {t("payments.goBack")}
          </Link>
        </div>
      </div>
    </main>
  );
}
