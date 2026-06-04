import { redirect, notFound } from "next/navigation";

import InvoiceDetailPage from "@/components/invoices/InvoiceDetailPage";
import { getCurrentUser } from "@/lib/auth";
import { getInvoiceForViewer } from "@/lib/invoices/generateInvoice";
import { syncInvoiceRefundStatusFromStripe } from "@/lib/payments/syncRefundStatus";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailRoutePage({ params }: Props) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login?next=/invoices");
  }

  const { id } = await params;
  const viewer = {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  };

  let invoice = await getInvoiceForViewer(id, viewer);

  if (!invoice) {
    notFound();
  }

  // Fallback sync: if invoice is PAID, check Stripe in case a refund occurred
  // but the webhook was never delivered (common in local development).
  if (invoice.status === "PAID") {
    const wasRefunded = await syncInvoiceRefundStatusFromStripe(id).catch(() => false);
    if (wasRefunded) {
      invoice = await getInvoiceForViewer(id, viewer) ?? invoice;
    }
  }

  return (
    <InvoiceDetailPage
      canGenerate={currentUser.role === "OWNER" || currentUser.role === "ADMIN"}
      canPay={
        currentUser.role === "RENTER" &&
        invoice.status !== "PAID" &&
        invoice.status !== "CANCELLED" &&
        invoice.status !== "REFUNDED"
      }
      invoice={invoice}
    />
  );
}
