import { redirect } from "next/navigation";

import InvoicesWorkspace from "@/components/invoices/InvoicesWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { getInvoicesForViewer } from "@/lib/invoices/generateInvoice";
import {
  normalizeInvoiceSort,
  normalizeInvoiceStatusFilter,
} from "@/lib/invoices/invoiceTypes";
import { syncRecentPaidInvoicesRefundStatus } from "@/lib/payments/syncRefundStatus";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function InvoicesPage({ searchParams }: Props) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login?next=/invoices");
  }

  const params = await searchParams;
  const page = Number(getSingleValue(params.page) || "1");
  const pageSize = Number(getSingleValue(params.pageSize) || "10");
  const search = getSingleValue(params.q);
  const status = normalizeInvoiceStatusFilter(getSingleValue(params.status));
  const sort = normalizeInvoiceSort(getSingleValue(params.sort));

  // Sync refund status for recently-paid invoices before rendering the list.
  // This ensures the list reflects Stripe refunds even when the webhook was not
  // delivered (e.g. ngrok URL changed, charge.refunded event not enabled).
  await syncRecentPaidInvoicesRefundStatus({
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  }).catch(() => {
    // Non-fatal — Stripe API errors must not prevent the page from rendering.
  });

  const invoicesResult = await getInvoicesForViewer(
    {
      role: currentUser.role,
      ownerProfileId: currentUser.ownerProfile?.id ?? null,
      renterProfileId: currentUser.renterProfile?.id ?? null,
    },
    {
      page,
      pageSize,
      search,
      status,
      sort,
    },
  );

  return (
    <InvoicesWorkspace
      currentRole={currentUser.role}
      currentSearch={search}
      currentSort={sort}
      currentStatus={status ?? ""}
      pagination={invoicesResult.pagination}
      totals={invoicesResult.totals}
      invoices={invoicesResult.invoices}
    />
  );
}
