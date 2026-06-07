
// ─── Config ──────────────────────────────────────────────────────────────────

function getBoldsignApiKey(): string | null {
  return process.env.BOLDSIGN_API_KEY?.trim() || null;
}

function getBoldsignBaseUrl(): string {
  return process.env.BOLDSIGN_API_BASE_URL?.trim() || "https://api.boldsign.com";
}

function getBoldsignWebhookSecret(): string | null {
  return process.env.BOLDSIGN_WEBHOOK_SECRET?.trim() || null;
}

function isConfigured() {
  return Boolean(getBoldsignApiKey());
}

function requireApiKey(): string {
  const key = getBoldsignApiKey();
  if (!key) {
    throw new Error("BoldSign is not configured. Please set BOLDSIGN_API_KEY.");
  }
  return key;
}

function boldsignHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  return {
    "X-API-KEY": requireApiKey(),
    ...extraHeaders,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoldsignSigner = {
  name: string;
  email: string;
  order: 1 | 2;
};

export type BoldsignSendResult = {
  documentId: string;
};

export type BoldsignSignerStatus = {
  emailAddress: string;
  name: string;
  status: "Awaiting" | "Completed" | "Declined";
  order: number;
};

export type BoldsignDocumentStatus = {
  documentId: string;
  documentStatus: "WaitingForOthers" | "Completed" | "Declined" | "Expired" | "Revoked" | string;
  signers: BoldsignSignerStatus[];
};

export type BoldsignWebhookPayload = {
  event?: {
    eventType?: string;
    created?: string;
    eventId?: string;
  };
  data?: {
    documentId?: string;
    documentStatus?: string;
    signers?: Array<{
      emailAddress?: string;
      name?: string;
      status?: string;
      order?: number;
      signerType?: string;
    }>;
  };
};

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify the BoldSign webhook using a custom header secret.
 *
 * BoldSign does not use HMAC — instead it sends a plain custom header
 * (X-BoldSign-Webhook-Secret) whose value matches BOLDSIGN_WEBHOOK_SECRET.
 *
 * Returns true if the header matches, or if the secret is not configured (dev bypass).
 */
export function verifyBoldsignWebhookSignature(
  _rawBody: Buffer,
  incomingSecretHeader: string | null,
): boolean {
  const secret = getBoldsignWebhookSecret();

  if (!secret) {
    console.warn(
      "[boldsign-webhook] BOLDSIGN_WEBHOOK_SECRET not set — skipping verification (dev mode).",
    );
    return true;
  }

  if (!incomingSecretHeader) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks.
  if (incomingSecretHeader.length !== secret.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= incomingSecretHeader.charCodeAt(i) ^ secret.charCodeAt(i);
  }

  return mismatch === 0;
}

// ─── Send document for signature ─────────────────────────────────────────────

/**
 * Upload a contract PDF to BoldSign and create a sequential signing request.
 * Owner signs first (order 1), tenant signs second (order 2).
 * Returns the BoldSign documentId.
 */
export async function sendDocumentForSignature(params: {
  pdfBuffer: Buffer;
  contractNumber: string;
  contractId: string;
  owner: BoldsignSigner;
  tenant: BoldsignSigner;
  webhookUrl?: string;
}): Promise<BoldsignSendResult> {
  requireApiKey();

  const baseUrl = getBoldsignBaseUrl();

  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log("[boldsign] pdfBuffer size:", params.pdfBuffer.length, "bytes");
    console.log("[boldsign] contractNumber:", params.contractNumber);
    console.log("[boldsign] owner email:", params.owner.email);
    console.log("[boldsign] tenant email:", params.tenant.email);
  }

  if (!params.pdfBuffer.length) {
    throw new Error("PDF buffer is empty — cannot send to BoldSign.");
  }

  const pdfFile = new File(
    [new Uint8Array(params.pdfBuffer)],
    `contract-${params.contractNumber}.pdf`,
    { type: "application/pdf" },
  );

  const form = new FormData();
  form.append("Files", pdfFile);

  if (isDev) {
    console.log("[boldsign] Files field appended, file size:", pdfFile.size);
  }
  form.append("Title", `Rental Contract ${params.contractNumber}`);
  form.append(
    "Message",
    "Please review and sign the attached rental contract. Signing is sequential — the owner must sign first, then the tenant.",
  );
  form.append("EnableSigningOrder", "true");
  form.append("UseTextTags", "false");
  form.append("ExpiryDays", "30");
  form.append("ReminderSettings[ReminderDays]", "3");
  form.append("ReminderSettings[ReminderCount]", "5");

  // Owner — order 1
  form.append("Signers[0][Name]", params.owner.name);
  form.append("Signers[0][EmailAddress]", params.owner.email);
  form.append("Signers[0][SignerType]", "Signer");
  form.append("Signers[0][SignerOrder]", "1");
  form.append("Signers[0][DeliveryMode]", "Email");
  form.append("Signers[0][FormFields][0][Id]", "owner_sig");
  form.append("Signers[0][FormFields][0][FieldType]", "Signature");
  form.append("Signers[0][FormFields][0][PageNumber]", "2");
  form.append("Signers[0][FormFields][0][Bounds][X]", "68");
  form.append("Signers[0][FormFields][0][Bounds][Y]", "100");
  form.append("Signers[0][FormFields][0][Bounds][Width]", "200");
  form.append("Signers[0][FormFields][0][Bounds][Height]", "65");
  form.append("Signers[0][FormFields][0][IsRequired]", "true");

  // Tenant — order 2
  form.append("Signers[1][Name]", params.tenant.name);
  form.append("Signers[1][EmailAddress]", params.tenant.email);
  form.append("Signers[1][SignerType]", "Signer");
  form.append("Signers[1][SignerOrder]", "2");
  form.append("Signers[1][DeliveryMode]", "Email");
  form.append("Signers[1][FormFields][0][Id]", "tenant_sig");
  form.append("Signers[1][FormFields][0][FieldType]", "Signature");
  form.append("Signers[1][FormFields][0][PageNumber]", "2");
  form.append("Signers[1][FormFields][0][Bounds][X]", "305");
  form.append("Signers[1][FormFields][0][Bounds][Y]", "100");
  form.append("Signers[1][FormFields][0][Bounds][Width]", "200");
  form.append("Signers[1][FormFields][0][Bounds][Height]", "65");
  form.append("Signers[1][FormFields][0][IsRequired]", "true");

  const response = await fetch(`${baseUrl}/v1/document/send`, {
    method: "POST",
    headers: boldsignHeaders(),
    body: form,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[boldsign] response status:", response.status);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`BoldSign send failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as { documentId?: string };

  if (!json.documentId) {
    throw new Error("BoldSign did not return a documentId.");
  }

  return { documentId: json.documentId };
}

// ─── Download signed document ─────────────────────────────────────────────────

/** Download the signed PDF binary from BoldSign after all signers have signed. */
export async function downloadSignedDocument(documentId: string): Promise<Buffer> {
  requireApiKey();

  const baseUrl = getBoldsignBaseUrl();
  const url = `${baseUrl}/v1/document/download?documentId=${encodeURIComponent(documentId)}&onlySigned=true`;

  const response = await fetch(url, {
    method: "GET",
    headers: boldsignHeaders(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`BoldSign download signed doc failed (${response.status}): ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Download audit trail ─────────────────────────────────────────────────────

/** Download the audit trail PDF from BoldSign. */
export async function downloadAuditTrail(documentId: string): Promise<Buffer> {
  requireApiKey();

  const baseUrl = getBoldsignBaseUrl();
  const url = `${baseUrl}/v1/document/downloadauditlog?documentId=${encodeURIComponent(documentId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: boldsignHeaders(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`BoldSign download audit log failed (${response.status}): ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Get document status ──────────────────────────────────────────────────────

/** Fetch the current status of a BoldSign document (useful for manual sync). */
export async function getDocumentStatus(documentId: string): Promise<BoldsignDocumentStatus> {
  requireApiKey();

  const baseUrl = getBoldsignBaseUrl();
  const url = `${baseUrl}/v1/document/properties?documentId=${encodeURIComponent(documentId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: boldsignHeaders({ Accept: "application/json" }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`BoldSign get document failed (${response.status}): ${text}`);
  }

  // BoldSign properties endpoint uses `status` and `signerDetails[]`
  // Map to our internal BoldsignDocumentStatus shape.
  const raw = await response.json() as {
    documentId: string;
    status: string;
    signerDetails?: Array<{
      signerEmail: string;
      signerName: string;
      status: string;
      order: number;
    }>;
  };

  return {
    documentId: raw.documentId,
    documentStatus: raw.status as BoldsignDocumentStatus["documentStatus"],
    signers: (raw.signerDetails ?? []).map((s) => ({
      emailAddress: s.signerEmail,
      name: s.signerName,
      status: s.status as BoldsignSignerStatus["status"],
      order: s.order,
    })),
  };
}

export { isConfigured as isBoldsignConfigured };
