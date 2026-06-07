import { NextResponse } from "next/server";
import { ContractStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  getDocumentStatus,
  downloadSignedDocument,
  downloadAuditTrail,
} from "@/lib/contracts/boldsign";
import { saveBoldsignFile } from "@/lib/contracts/generatePdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const access = requireAdminAccess(currentUser);

  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: currentUser ? 403 : 401 },
    );
  }

  const contract = await prisma.generatedContract.findUnique({
    where: { id },
    select: {
      id: true,
      contractNumber: true,
      boldsignDocumentId: true,
      status: true,
      signedPdfPath: true,
      auditTrailPath: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  if (!contract.boldsignDocumentId) {
    return NextResponse.json(
      { error: "No BoldSign document ID on this contract." },
      { status: 400 },
    );
  }

  const boldsignStatus = await getDocumentStatus(contract.boldsignDocumentId);

  const updates: Record<string, unknown> = {};

  if (boldsignStatus.documentStatus === "Completed") {
    updates.status = ContractStatus.SIGNED;

    if (!contract.signedPdfPath) {
      try {
        const buf = await downloadSignedDocument(contract.boldsignDocumentId);
        updates.signedPdfPath = await saveBoldsignFile(buf, "signed", contract.id, "sync");
      } catch (err) {
        console.error("[sync-boldsign] signed PDF download failed:", err);
      }
    }

    if (!contract.auditTrailPath) {
      try {
        const buf = await downloadAuditTrail(contract.boldsignDocumentId);
        updates.auditTrailPath = await saveBoldsignFile(buf, "audit", contract.id, "sync");
      } catch (err) {
        console.error("[sync-boldsign] audit trail download failed:", err);
      }
    }
  } else if (
    boldsignStatus.documentStatus === "Declined" ||
    boldsignStatus.documentStatus === "Expired" ||
    boldsignStatus.documentStatus === "Revoked"
  ) {
    updates.status = ContractStatus.SIGNATURE_FAILED;
    updates.signatureFailedReason = boldsignStatus.documentStatus;
  } else if (boldsignStatus.documentStatus === "WaitingForOthers") {
    const ownerSigner = boldsignStatus.signers.find((s) => s.order === 1);
    if (ownerSigner?.status === "Completed") {
      updates.status = ContractStatus.OWNER_SIGNED;
    }
  }

  if (Object.keys(updates).length) {
    await prisma.generatedContract.update({
      where: { id },
      data: updates,
    });
  }

  return NextResponse.json({
    contractId: id,
    boldsignStatus: boldsignStatus.documentStatus,
    localStatus: updates.status ?? contract.status,
    updated: Object.keys(updates),
  });
}
