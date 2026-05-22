import Link from "next/link";

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
  const params = await searchParams;
  const invoiceId = firstValue(params.invoice_id);

  return (
    <main className="min-h-screen bg-background text-on-background pt-28 sm:pt-32 pb-24 mx-auto max-w-[960px] px-4 sm:px-6">
      <div className="bg-surface-container-lowest rounded-lg border border-[#EBEBE8] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,61,62,0.04)]">
        <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-3">
          Payment
        </p>
        <h1 className="font-h1 text-h1 text-primary">Checkout was canceled</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 max-w-2xl">
          No payment was captured. You can return to your invoice and try again whenever you are
          ready.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-label-caps text-label-caps text-on-primary"
            href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"}
          >
            Back to invoice
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-outline-variant px-5 py-3 font-label-caps text-label-caps text-primary"
            href="/renter/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
