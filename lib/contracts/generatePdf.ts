import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

import type { ContractPlaceholderData } from "@/lib/contracts/placeholderMapper";

const SIGNED_DIR = path.resolve(process.cwd(), "docs", "signed");
const AUDIT_DIR = path.resolve(process.cwd(), "docs", "audit");
const GENERATED_DIR = path.resolve(process.cwd(), "docs", "generated");

export async function ensurePdfDirectories() {
  await Promise.all([
    fs.mkdir(SIGNED_DIR, { recursive: true }),
    fs.mkdir(AUDIT_DIR, { recursive: true }),
    fs.mkdir(GENERATED_DIR, { recursive: true }),
  ]);
}

export function getSignedPdfDir() {
  return SIGNED_DIR;
}

export function getAuditTrailDir() {
  return AUDIT_DIR;
}

export function getGeneratedPdfDir() {
  return GENERATED_DIR;
}

/**
 * Render a rental contract as a PDF buffer from placeholder data.
 * Uses pdfkit — pure Node.js, no external tools required.
 */
export async function renderContractAsPdfBuffer(
  data: ContractPlaceholderData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ORANGE = "#F26A1B";
    const DARK = "#111827";
    const GRAY = "#6B7280";
    const LIGHT_GRAY = "#F3F4F6";

    // ── Header ───────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor(ORANGE)
      .font("Helvetica-Bold")
      .text("GetYourCave", { align: "center" });

    doc
      .fontSize(10)
      .fillColor(GRAY)
      .font("Helvetica")
      .text(data.platform_website ?? "www.getyourcave.com", { align: "center" });

    doc.moveDown(0.5);
    doc
      .strokeColor(ORANGE)
      .lineWidth(1.5)
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // ── Title ─────────────────────────────────────────────────────────────────
    doc
      .fontSize(16)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(`${data.contract_type_label ?? "Rental Contract"} — ${data.contract_number ?? ""}`, {
        align: "center",
      });

    doc
      .fontSize(10)
      .fillColor(GRAY)
      .font("Helvetica")
      .text(`Date: ${data.today_date ?? new Date().toLocaleDateString()}`, { align: "center" });

    doc.moveDown(1.5);

    // ── Helper to draw a section ──────────────────────────────────────────────
    function section(title: string) {
      doc
        .fillColor(LIGHT_GRAY)
        .rect(60, doc.y, 475, 20)
        .fill();
      doc
        .fontSize(10)
        .fillColor(DARK)
        .font("Helvetica-Bold")
        .text(title.toUpperCase(), 68, doc.y - 16);
      doc.moveDown(0.8);
    }

    function row(label: string, value: string | null | undefined) {
      if (!value) return;
      const y = doc.y;
      doc
        .fontSize(9)
        .fillColor(GRAY)
        .font("Helvetica")
        .text(label, 68, y, { width: 160 });
      doc
        .fontSize(9)
        .fillColor(DARK)
        .font("Helvetica")
        .text(value, 240, y, { width: 295 });
      doc.moveDown(0.5);
    }

    // ── Parties ───────────────────────────────────────────────────────────────
    section("Parties");
    row("Owner / Lessor", data.owner_name ?? "");
    row("Owner Email", data.owner_email ?? "");
    row("Owner Address", data.owner_address ?? "");
    row("Tenant / Lessee", data.renter_name ?? "");
    row("Tenant Email", data.renter_email ?? "");
    row("Tenant Address", data.renter_address ?? "");
    doc.moveDown(0.5);

    // ── Property ─────────────────────────────────────────────────────────────
    section("Property");
    row("Description", data.listing_name ?? "");
    row("Storage Type", data.listing_storage_type ?? "");
    row("Address", data.listing_address ?? "");
    row("City", data.listing_city ?? "");
    row("Postal Code", data.listing_postal_code ?? "");
    doc.moveDown(0.5);

    // ── Financial Terms ───────────────────────────────────────────────────────
    section("Financial Terms");
    row("Monthly Rent", `€${data.monthly_price ?? "0.00"}`);
    row("Security Deposit", `€${data.security_deposit ?? "0.00"}`);
    row("Insurance Fee", `€${data.insurance_fee ?? "0.00"}`);
    row("Platform Commission (20%)", `€${data.platform_commission ?? "0.00"}`);
    row("Amount to Owner (80%)", `€${data.owner_amount ?? "0.00"}`);
    row("Total Monthly Amount", `€${data.total_monthly_amount ?? "0.00"}`);
    doc.moveDown(0.5);

    // ── Rental Period ─────────────────────────────────────────────────────────
    section("Rental Period");
    row("Start Date", data.start_date ?? "");
    if (data.end_date) row("End Date", data.end_date);
    if (data.duration_months) row("Duration", `${data.duration_months} month(s)`);
    doc.moveDown(0.5);

    // ── General Conditions ────────────────────────────────────────────────────
    section("General Conditions");
    doc
      .fontSize(9)
      .fillColor(DARK)
      .font("Helvetica")
      .text(
        "1. The Tenant agrees to use the storage space exclusively for personal, non-commercial storage purposes.\n" +
        "2. The Tenant shall not store hazardous, illegal, or flammable materials.\n" +
        "3. The Owner guarantees access to the storage space for the duration of this contract.\n" +
        "4. Either party may terminate this contract with 30 days written notice after the initial rental period.\n" +
        "5. The Platform (GetYourCave) acts as an intermediary and retains 20% of the monthly rental fee as a service charge.\n" +
        "6. The security deposit will be returned within 14 days of the end of the contract, minus any damages or outstanding fees.",
        { width: 475, lineGap: 4 },
      );
    doc.moveDown(1.5);

    // ── Signature Blocks — always on page 2 for predictable BoldSign placement ─
    doc.addPage();
    section("Signatures");
    doc.moveDown(0.5);

    // sigY is predictable on a fresh page: margin(60) + section header (~30) + moveDown ≈ 96
    const sigY = doc.y;

    // Owner signature block (left)
    doc
      .strokeColor("#D1D5DB")
      .lineWidth(1)
      .rect(68, sigY, 200, 80)
      .stroke();
    doc
      .fontSize(9)
      .fillColor(GRAY)
      .text("Owner / Lessor Signature", 68, sigY + 60, { width: 200, align: "center" });
    doc
      .fontSize(9)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(data.owner_name ?? "", 68, sigY + 4, { width: 200, align: "center" });

    // Tenant signature block (right)
    doc
      .strokeColor("#D1D5DB")
      .lineWidth(1)
      .rect(305, sigY, 200, 80)
      .stroke();
    doc
      .fontSize(9)
      .fillColor(GRAY)
      .text("Tenant / Lessee Signature", 305, sigY + 60, { width: 200, align: "center" });
    doc
      .fontSize(9)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text(data.renter_name ?? "", 305, sigY + 4, { width: 200, align: "center" });

    doc.moveDown(0.5);
    doc.y = sigY + 95;

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc
      .strokeColor(ORANGE)
      .lineWidth(0.5)
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor(GRAY)
      .font("Helvetica")
      .text(
        `${data.platform_company_name ?? "GetYourCave"} · ${data.platform_address ?? ""} · ${data.platform_email ?? ""} · Contract ${data.contract_number ?? ""}`,
        { align: "center" },
      );

    doc.end();
  });
}

/** Generate and save a contract PDF to docs/generated/. Returns the file path. */
export async function saveContractPdf(
  data: ContractPlaceholderData,
  contractId: string,
): Promise<string> {
  await ensurePdfDirectories();

  const fileName = `contract-${contractId}-${Date.now()}.pdf`;
  const filePath = path.join(GENERATED_DIR, fileName);
  const buffer = await renderContractAsPdfBuffer(data);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

/** Save a downloaded buffer (signed PDF or audit trail) to a local path. */
export async function saveBoldsignFile(
  buffer: Buffer,
  dir: "signed" | "audit",
  contractId: string,
  suffix: string,
): Promise<string> {
  await ensurePdfDirectories();

  const targetDir = dir === "signed" ? SIGNED_DIR : AUDIT_DIR;
  const fileName = `${dir}-${contractId}-${suffix}.pdf`;
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, buffer);

  return filePath;
}
