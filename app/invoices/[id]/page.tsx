import { redirect, notFound } from "next/navigation";

import InvoiceDetailPage from "@/components/invoices/InvoiceDetailPage";
import { getCurrentUser } from "@/lib/auth";
import { getInvoiceForViewer } from "@/lib/invoices/generateInvoice";

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
  const invoice = await getInvoiceForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!invoice) {
    notFound();
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
