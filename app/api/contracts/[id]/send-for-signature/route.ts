import { NextResponse } from "next/server";
import { ContractStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getContractForViewer,
  generateContractForBooking,
} from "@/lib/contracts/generateContract";
import { buildContractPlaceholderData } from "@/lib/contracts/placeholderMapper";
import { inferContractTypeFromBooking } from "@/lib/contracts/contractTypes";
import { saveContractPdf } from "@/lib/contracts/generatePdf";
import { sendDocumentForSignature, isBoldsignConfigured } from "@/lib/contracts/boldsign";
import { createNotificationForUser } from "@/lib/notifications";
import { getAppUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SENDABLE_STATUSES: ContractStatus[] = [
  ContractStatus.GENERATED,
  ContractStatus.SENT,
  ContractStatus.PARTIALLY_SIGNED,
  ContractStatus.APPROVED,
  ContractStatus.SIGNATURE_FAILED,
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can send contracts for signature." },
      { status: 403 },
    );
  }

  if (!isBoldsignConfigured()) {
    return NextResponse.json(
      { error: "BoldSign is not configured. Please set BOLDSIGN_API_KEY." },
      { status: 503 },
    );
  }

  const contract = await getContractForViewer(id, {
    role: currentUser.role,
    ownerProfileId: currentUser.ownerProfile?.id ?? null,
    renterProfileId: currentUser.renterProfile?.id ?? null,
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found or access denied." },
      { status: 404 },
    );
  }

  if (!SENDABLE_STATUSES.includes(contract.status as ContractStatus)) {
    return NextResponse.json(
      {
        error: `Cannot send a contract with status ${contract.status} for signature.`,
      },
      { status: 409 },
    );
  }

  // Owners can only send their own contracts.
  if (
    currentUser.role === "OWNER" &&
    currentUser.ownerProfile?.id !== contract.ownerId
  ) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Ensure a GeneratedContract record exists (may already exist from generate step).
  const gcRecord = await generateContractForBooking({ bookingId: contract.bookingId });
  if (!gcRecord) {
    return NextResponse.json({ error: "Unable to prepare contract." }, { status: 500 });
  }

  // Build PDF from placeholder data.
  const booking = await prisma.booking.findUnique({
    where: { id: contract.bookingId },
    include: {
      listing: { include: { owner: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } } } },
      owner: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
      renter: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
      generatedContract: { select: { contractNumber: true, generatedAt: true, status: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const contractType = inferContractTypeFromBooking(booking.durationMonths);
  const placeholders = buildContractPlaceholderData({
    booking,
    contractNumber: gcRecord.contract.contractNumber,
    contractType,
    locale: "fr",
  });

  let pdfBuffer: Buffer;
  try {
    const { renderContractAsPdfBuffer } = await import("@/lib/contracts/generatePdf");
    pdfBuffer = await renderContractAsPdfBuffer(placeholders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Save PDF locally.
  const { saveContractPdf: _save } = await import("@/lib/contracts/generatePdf");
  let generatedPdfPath: string;
  try {
    generatedPdfPath = await _save(placeholders, gcRecord.contract.id);
  } catch {
    return NextResponse.json({ error: "Failed to save generated PDF." }, { status: 500 });
  }

  // Send to BoldSign.
  let boldsignDocumentId: string;
  try {
    const result = await sendDocumentForSignature({
      pdfBuffer,
      contractNumber: gcRecord.contract.contractNumber,
      contractId: gcRecord.contract.id,
      owner: {
        name: contract.ownerName,
        email: contract.ownerEmail,
        order: 1,
      },
      tenant: {
        name: contract.renterName,
        email: contract.renterEmail,
        order: 2,
      },
    });
    boldsignDocumentId = result.documentId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "BoldSign request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist BoldSign document ID + status.
  const updated = await prisma.generatedContract.update({
    where: { id: gcRecord.contract.id },
    data: {
      boldsignDocumentId,
      signatureProvider: "BOLDSIGN",
      generatedPdfPath,
      status: ContractStatus.SENT_FOR_SIGNATURE,
    },
  });

  // Notify both parties.
  const ownerUserId = booking.owner.user.id;
  const renterUserId = booking.renter.user.id;

  await Promise.all([
    createNotificationForUser({
      userId: ownerUserId,
      title: "Contract sent for signature",
      body: `Contract ${gcRecord.contract.contractNumber} has been sent. Please check your email to sign.`,
      linkUrl: "/contracts",
    }),
    createNotificationForUser({
      userId: renterUserId,
      title: "Contract sent for signature",
      body: `A rental contract has been sent for signature. The owner must sign first.`,
      linkUrl: "/contracts",
    }),
  ]);

  return NextResponse.json({
    contractId: updated.id,
    boldsignDocumentId,
    status: updated.status,
  });
}
