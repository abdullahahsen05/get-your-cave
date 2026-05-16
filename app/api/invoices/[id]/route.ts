import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  getInvoiceForViewer,
  updateInvoiceForViewer,
} from "@/lib/invoices/generateInvoice";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view invoices." },
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
      { error: "Invoice not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invoice });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to update invoices." },
      { status: 401 },
    );
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can update invoices." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const statusValue =
    typeof body === "object" && body && "status" in body
      ? String((body as { status?: unknown }).status ?? "").toUpperCase()
      : "";

  const allowedStatus = [
    "DRAFT",
    "ISSUED",
    "PAID",
    "OVERDUE",
    "REFUNDED",
    "CANCELLED",
  ].includes(statusValue)
    ? (statusValue as InvoiceStatus)
    : null;

  if (!allowedStatus) {
    return NextResponse.json(
      { error: "A valid invoice status is required." },
      { status: 400 },
    );
  }

  const invoice = await updateInvoiceForViewer({
    invoiceId: id,
    viewer: {
      role: currentUser.role,
      ownerProfileId: currentUser.ownerProfile?.id ?? null,
      renterProfileId: currentUser.renterProfile?.id ?? null,
    },
    status: allowedStatus,
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found or access denied." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invoice });
}
