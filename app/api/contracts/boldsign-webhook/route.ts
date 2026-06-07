import { NextResponse } from "next/server";
import { ContractStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  verifyBoldsignWebhookSignature,
  downloadSignedDocument,
  downloadAuditTrail,
  type BoldsignWebhookPayload,
} from "@/lib/contracts/boldsign";
import { saveBoldsignFile } from "@/lib/contracts/generatePdf";
import { createNotificationForUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Idempotency: event IDs we have already processed in this process lifetime.
// For production, consider storing in Redis or DB; for MVP this prevents
// duplicate processing within a single server instance.
const processedEventIds = new Set<string>();

async function getBookingUserIds(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      owner: { select: { user: { select: { id: true } } } },
      renter: { select: { user: { select: { id: true } } } },
    },
  });
  return {
    ownerUserId: booking?.owner.user.id ?? null,
    renterUserId: booking?.renter.user.id ?? null,
  };
}

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV !== "production";

  // Read raw body for event parsing.
  const rawBody = Buffer.from(await request.arrayBuffer());

  // BoldSign uses a custom static header for webhook authentication.
  const incomingSecret = request.headers.get("X-BoldSign-Webhook-Secret");

  if (isDev) {
    console.log("[boldsign-webhook] incoming — secret header present:", Boolean(incomingSecret), "body bytes:", rawBody.length);
  }

  if (!verifyBoldsignWebhookSignature(rawBody, incomingSecret)) {
    console.warn("[boldsign-webhook] Invalid secret header — rejected.");
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  // BoldSign verification requests may have an empty body — return 200 immediately.
  const bodyText = rawBody.toString("utf8").trim();
  if (!bodyText) {
    if (isDev) console.log("[boldsign-webhook] empty body — verification ping, returning 200");
    return NextResponse.json({ received: true });
  }

  let payload: BoldsignWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as BoldsignWebhookPayload;
  } catch {
    if (isDev) console.log("[boldsign-webhook] non-JSON body, returning 200");
    return NextResponse.json({ received: true });
  }

  const eventType = payload.event?.eventType ?? "";
  const eventId = payload.event?.eventId ?? "";
  const documentId = payload.data?.documentId ?? "";

  if (isDev) {
    console.log("[boldsign-webhook] eventType:", eventType, "| documentId:", documentId, "| eventId:", eventId);
  }

  if (!documentId) {
    if (isDev) console.log("[boldsign-webhook] no documentId in payload, skipping");
    return NextResponse.json({ received: true });
  }

  // Idempotency check.
  if (eventId && processedEventIds.has(eventId)) {
    return NextResponse.json({ received: true, skipped: "duplicate" });
  }

  if (eventId) {
    processedEventIds.add(eventId);
  }

  // Look up the contract by BoldSign document ID.
  const contract = await prisma.generatedContract.findUnique({
    where: { boldsignDocumentId: documentId },
    select: {
      id: true,
      bookingId: true,
      contractNumber: true,
      status: true,
      lastBoldsignEventId: true,
      booking: {
        select: {
          owner: { select: { user: { select: { id: true } } } },
          renter: { select: { user: { select: { id: true } } } },
        },
      },
    },
  });

  if (!contract) {
    // Document not in our system — ignore.
    return NextResponse.json({ received: true, skipped: "unknown-document" });
  }

  // Prevent reprocessing the same event even across restarts.
  if (eventId && contract.lastBoldsignEventId === eventId) {
    return NextResponse.json({ received: true, skipped: "already-processed" });
  }

  const ownerUserId = contract.booking.owner.user.id;
  const renterUserId = contract.booking.renter.user.id;

  const signers = payload.data?.signers ?? [];

  // ── Handle individual signer events ──────────────────────────────────────
  if (eventType === "signer.Signed") {
    const completedSigner = signers.find((s) => s.status === "Completed");
    if (completedSigner) {
      if (completedSigner.order === 1) {
        // Owner signed
        await prisma.generatedContract.update({
          where: { id: contract.id },
          data: {
            status: ContractStatus.OWNER_SIGNED,
            ownerSignedAt: new Date(),
            lastBoldsignEventId: eventId || null,
          },
        });
        await createNotificationForUser({
          userId: renterUserId,
          title: "Owner signed the contract",
          body: `The owner has signed contract ${contract.contractNumber}. You will receive an email to sign next.`,
          linkUrl: "/contracts",
        });
        await createNotificationForUser({
          userId: ownerUserId,
          title: "You signed the contract",
          body: `You have signed contract ${contract.contractNumber}. Waiting for the tenant to sign.`,
          linkUrl: "/contracts",
        });
      } else if (completedSigner.order === 2) {
        // Tenant signed — document may complete via document.Completed event
        await prisma.generatedContract.update({
          where: { id: contract.id },
          data: {
            status: ContractStatus.TENANT_SIGNED,
            tenantSignedAt: new Date(),
            lastBoldsignEventId: eventId || null,
          },
        });
        await createNotificationForUser({
          userId: ownerUserId,
          title: "Tenant signed the contract",
          body: `The tenant has signed contract ${contract.contractNumber}.`,
          linkUrl: "/contracts",
        });
      }
    }
    return NextResponse.json({ received: true });
  }

  // ── Document fully completed ──────────────────────────────────────────────
  if (eventType === "document.Completed") {
    // Download signed PDF and audit trail.
    let signedPdfPath: string | null = null;
    let auditTrailPath: string | null = null;

    try {
      const signedPdfBuffer = await downloadSignedDocument(documentId);
      signedPdfPath = await saveBoldsignFile(signedPdfBuffer, "signed", contract.id, Date.now().toString());
    } catch (err) {
      console.error("[boldsign-webhook] Failed to download signed PDF:", err);
    }

    try {
      const auditBuffer = await downloadAuditTrail(documentId);
      auditTrailPath = await saveBoldsignFile(auditBuffer, "audit", contract.id, Date.now().toString());
    } catch (err) {
      console.error("[boldsign-webhook] Failed to download audit trail:", err);
    }

    await prisma.generatedContract.update({
      where: { id: contract.id },
      data: {
        status: ContractStatus.SIGNED,
        tenantSignedAt: contract.status !== "TENANT_SIGNED" ? new Date() : undefined,
        signedPdfPath,
        auditTrailPath,
        signatureFailedReason: null,
        lastBoldsignEventId: eventId || null,
      },
    });

    await Promise.all([
      createNotificationForUser({
        userId: ownerUserId,
        title: "Contract fully signed",
        body: `Contract ${contract.contractNumber} is now fully signed by all parties.`,
        linkUrl: "/contracts",
      }),
      createNotificationForUser({
        userId: renterUserId,
        title: "Contract fully signed",
        body: `Contract ${contract.contractNumber} is now fully signed by all parties.`,
        linkUrl: "/contracts",
      }),
    ]);

    return NextResponse.json({ received: true });
  }

  // ── Declined / Expired / Revoked ──────────────────────────────────────────
  if (
    eventType === "document.Declined" ||
    eventType === "document.Expired" ||
    eventType === "document.Revoked" ||
    eventType === "signer.Declined"
  ) {
    const declinedSigner = signers.find((s) => s.status === "Declined");
    const reason = declinedSigner
      ? `Declined by ${declinedSigner.name ?? declinedSigner.emailAddress ?? "a signer"}`
      : eventType.replace("document.", "").replace("signer.", "Signer ");

    await prisma.generatedContract.update({
      where: { id: contract.id },
      data: {
        status: ContractStatus.SIGNATURE_FAILED,
        signatureFailedReason: reason,
        lastBoldsignEventId: eventId || null,
      },
    });

    await Promise.all([
      createNotificationForUser({
        userId: ownerUserId,
        title: "Contract signature failed",
        body: `Contract ${contract.contractNumber}: ${reason}. You may resend the contract.`,
        linkUrl: "/contracts",
      }),
      createNotificationForUser({
        userId: renterUserId,
        title: "Contract signature failed",
        body: `Contract ${contract.contractNumber}: ${reason}.`,
        linkUrl: "/contracts",
      }),
    ]);

    return NextResponse.json({ received: true });
  }

  // ── document.Sent (informational) ─────────────────────────────────────────
  if (eventType === "document.Sent") {
    await prisma.generatedContract.update({
      where: { id: contract.id },
      data: {
        status: ContractStatus.SENT_FOR_SIGNATURE,
        lastBoldsignEventId: eventId || null,
      },
    });
    return NextResponse.json({ received: true });
  }

  // Unknown event — acknowledge without error.
  return NextResponse.json({ received: true, eventType });
}
