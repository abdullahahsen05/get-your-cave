import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getInvoiceForViewer } from "@/lib/invoices/generateInvoice";
import {
  buildInvoicePdfBytes,
  buildInvoicePdfFileName,
} from "@/lib/invoices/renderInvoicePdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to download invoices." },
      { status: 401 },
    );
  }

  const invoice = await getInvoiceForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found or access denied." },
      { status: 404 },
    );
  }

  const pdf = buildInvoicePdfBytes(invoice);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildInvoicePdfFileName(invoice.invoiceNumber)}"`,
      "Cache-Control": "no-store",
    },
  });
}
