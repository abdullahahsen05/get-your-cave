import type { SafeInvoice, SafeInvoiceItem } from "@/lib/invoices/generateInvoice";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function normalizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(value: string) {
  return normalizePdfText(value).replace(/[\\()]/g, "\\$&");
}

function formatPdfDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  return `${currency} ${amount.toFixed(2)}`;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const pairs = value.length === 3
    ? value.split("").map((part) => `${part}${part}`)
    : value.match(/.{2}/g) ?? ["00", "00", "00"];

  return pairs.map((part) => Number.parseInt(part, 16) / 255) as [number, number, number];
}

function pdfColor(rgb: [number, number, number]) {
  return `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)}`;
}

function textCommands(params: {
  x: number;
  y: number;
  font: "F1" | "F2";
  size: number;
  color?: [number, number, number];
  lines: string[];
  leading?: number;
}) {
  const leading = params.leading ?? Math.round(params.size * 1.35);
  const commands: string[] = ["BT", `/${params.font} ${params.size} Tf`, `${leading} TL`, `${params.x} ${params.y} Td`];

  if (params.color) {
    commands.splice(2, 0, `${pdfColor(params.color)} rg`);
  }

  params.lines.forEach((line, index) => {
    const escaped = escapePdfText(line);
    if (index === 0) {
      commands.push(`(${escaped}) Tj`);
    } else {
      commands.push("T*");
      commands.push(`(${escaped}) Tj`);
    }
  });

  commands.push("ET");
  return commands;
}

function boxCommands(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: [number, number, number];
  stroke?: [number, number, number];
  strokeWidth?: number;
}) {
  const commands: string[] = ["q"];
  if (params.fill) {
    commands.push(`${pdfColor(params.fill)} rg`);
    commands.push(`${params.x} ${params.y} ${params.width} ${params.height} re f`);
  }

  if (params.stroke) {
    commands.push(`${pdfColor(params.stroke)} RG`);
    commands.push(`${params.strokeWidth ?? 1} w`);
    commands.push(`${params.x} ${params.y} ${params.width} ${params.height} re S`);
  }

  commands.push("Q");
  return commands;
}

function lineCommands(params: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number];
  width?: number;
}) {
  return [
    "q",
    `${pdfColor(params.color)} RG`,
    `${params.width ?? 1} w`,
    `${params.x1} ${params.y1} m`,
    `${params.x2} ${params.y2} l`,
    "S",
    "Q",
  ];
}

function circleCommands(params: {
  x: number;
  y: number;
  radius: number;
  fill?: [number, number, number];
  stroke?: [number, number, number];
}) {
  const k = 0.5522847498307936;
  const r = params.radius;
  const ox = r * k;
  const oy = r * k;

  const commands = ["q"];
  if (params.fill) {
    commands.push(`${pdfColor(params.fill)} rg`);
  }
  if (params.stroke) {
    commands.push(`${pdfColor(params.stroke)} RG`);
  }

  commands.push(
    `${params.x + r} ${params.y} m`,
    `${params.x + r} ${params.y + oy} ${params.x + ox} ${params.y + r} ${params.x} ${params.y + r} c`,
    `${params.x - ox} ${params.y + r} ${params.x - r} ${params.y + oy} ${params.x - r} ${params.y} c`,
    `${params.x - r} ${params.y - oy} ${params.x - ox} ${params.y - r} ${params.x} ${params.y - r} c`,
    `${params.x + ox} ${params.y - r} ${params.x + r} ${params.y - oy} ${params.x + r} ${params.y} c`,
  );

  if (params.fill && params.stroke) {
    commands.push("B");
  } else if (params.fill) {
    commands.push("f");
  } else {
    commands.push("S");
  }

  commands.push("Q");
  return commands;
}

function buildInvoiceItemLines(items: SafeInvoiceItem[]) {
  return items.map((item) => {
    const description = normalizePdfText(item.description);
    return `${description} x${item.quantity}`;
  });
}

function buildInvoicePdfCommands(invoice: SafeInvoice) {
  const currency = invoice.currency.toUpperCase();
  const accent = hexToRgb("#0F3D3E");
  const accentSoft = hexToRgb("#DDE9E7");
  const accentMuted = hexToRgb("#4B6547");
  const surface = hexToRgb("#F7F7F5");
  const border = hexToRgb("#D8D8D2");
  const textPrimary = hexToRgb("#11211F");
  const textSecondary = hexToRgb("#59605E");
  const white = hexToRgb("#FFFFFF");
  const paid = hexToRgb("#4B6547");
  const refunded = hexToRgb("#7A7A75");
  const issued = hexToRgb("#A77A2A");
  const overdue = hexToRgb("#A44D4D");

  const statusColor =
    invoice.status === "PAID"
      ? paid
      : invoice.status === "REFUNDED"
        ? refunded
        : invoice.status === "OVERDUE"
          ? overdue
          : issued;

  const commands: string[] = [];

  // Background
  commands.push(...boxCommands({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    fill: white,
  }));

  // Top banner
  commands.push(...boxCommands({
    x: 0,
    y: PAGE_HEIGHT - 128,
    width: PAGE_WIDTH,
    height: 128,
    fill: accent,
  }));
  commands.push(...boxCommands({
    x: 0,
    y: PAGE_HEIGHT - 132,
    width: PAGE_WIDTH,
    height: 4,
    fill: accentSoft,
  }));

  commands.push(
    ...textCommands({
      x: 46,
      y: PAGE_HEIGHT - 44,
      font: "F2",
      size: 26,
      color: white,
      lines: ["GETYOURCAVE"],
      leading: 28,
    }),
  );
  commands.push(
    ...textCommands({
      x: 46,
      y: PAGE_HEIGHT - 76,
      font: "F1",
      size: 11,
      color: white,
      lines: ["Secure storage marketplace", "Invoice export"],
      leading: 14,
    }),
  );

  commands.push(
    ...textCommands({
      x: 360,
      y: PAGE_HEIGHT - 48,
      font: "F2",
      size: 18,
      color: white,
      lines: [invoice.invoiceNumber],
      leading: 20,
    }),
  );
  commands.push(
    ...textCommands({
      x: 360,
      y: PAGE_HEIGHT - 74,
      font: "F1",
      size: 10,
      color: white,
      lines: ["Invoice status"],
      leading: 12,
    }),
  );
  commands.push(...boxCommands({
    x: 360,
    y: PAGE_HEIGHT - 108,
    width: 110,
    height: 22,
    fill: statusColor,
  }));
  commands.push(
    ...textCommands({
      x: 374,
      y: PAGE_HEIGHT - 102,
      font: "F2",
      size: 10,
      color: white,
      lines: [invoice.statusLabel.toUpperCase()],
      leading: 11,
    }),
  );
  commands.push(
    ...textCommands({
      x: 486,
      y: PAGE_HEIGHT - 74,
      font: "F1",
      size: 9,
      color: white,
      lines: ["Generated"],
      leading: 11,
    }),
  );
  commands.push(
    ...textCommands({
      x: 486,
      y: PAGE_HEIGHT - 92,
      font: "F2",
      size: 12,
      color: white,
      lines: [formatPdfDate(invoice.createdAt)],
      leading: 14,
    }),
  );

  // Main cards
  const topCardY = 516;
  commands.push(...boxCommands({
    x: 40,
    y: topCardY,
    width: 330,
    height: 182,
    fill: surface,
    stroke: border,
    strokeWidth: 1,
  }));
  commands.push(...boxCommands({
    x: 385,
    y: topCardY,
    width: 170,
    height: 182,
    fill: surface,
    stroke: border,
    strokeWidth: 1,
  }));

  commands.push(
    ...textCommands({
      x: 56,
      y: 670,
      font: "F2",
      size: 14,
      color: textPrimary,
      lines: ["Booking details"],
      leading: 16,
    }),
  );
  commands.push(...lineCommands({
    x1: 56,
    y1: 658,
    x2: 354,
    y2: 658,
    color: accentSoft,
    width: 1,
  }));
  commands.push(
    ...textCommands({
      x: 56,
      y: 640,
      font: "F2",
      size: 16,
      color: textPrimary,
      lines: [invoice.bookingTitle],
      leading: 18,
    }),
  );
  commands.push(
    ...textCommands({
      x: 56,
      y: 620,
      font: "F1",
      size: 10,
      color: textSecondary,
      lines: [invoice.bookingAddress, `${invoice.bookingCity}  -  ${invoice.bookingStorageType}`],
      leading: 13,
    }),
  );
  commands.push(
    ...textCommands({
      x: 56,
      y: 585,
      font: "F2",
      size: 11,
      color: textPrimary,
      lines: ["Renter"],
      leading: 12,
    }),
  );
  commands.push(
    ...textCommands({
      x: 56,
      y: 567,
      font: "F1",
      size: 10,
      color: textSecondary,
      lines: [invoice.renterName, invoice.renterEmail],
      leading: 12,
    }),
  );
  commands.push(
    ...textCommands({
      x: 178,
      y: 585,
      font: "F2",
      size: 11,
      color: textPrimary,
      lines: ["Owner"],
      leading: 12,
    }),
  );
  commands.push(
    ...textCommands({
      x: 178,
      y: 567,
      font: "F1",
      size: 10,
      color: textSecondary,
      lines: [invoice.ownerName, invoice.ownerEmail],
      leading: 12,
    }),
  );

  commands.push(
    ...textCommands({
      x: 400,
      y: 670,
      font: "F2",
      size: 14,
      color: textPrimary,
      lines: ["Amount due"],
      leading: 16,
    }),
  );
  commands.push(...lineCommands({
    x1: 400,
    y1: 658,
    x2: 540,
    y2: 658,
    color: accentSoft,
    width: 1,
  }));
  commands.push(
    ...textCommands({
      x: 400,
      y: 625,
      font: "F2",
      size: 24,
      color: accent,
      lines: [formatMoney(invoice.totalAmount, currency)],
      leading: 26,
    }),
  );
  commands.push(
    ...textCommands({
      x: 400,
      y: 593,
      font: "F1",
      size: 10,
      color: textSecondary,
      lines: [
        `Subtotal  ${formatMoney(invoice.subtotal, currency)}`,
        `Fees      ${formatMoney(invoice.platformFee, currency)}`,
        `Deposit   ${formatMoney(invoice.securityDeposit, currency)}`,
      ],
      leading: 13,
    }),
  );
  commands.push(
    ...boxCommands({
      x: 400,
      y: 538,
      width: 118,
      height: 26,
      fill: accentSoft,
      stroke: accentSoft,
    }),
  );
  commands.push(
    ...textCommands({
      x: 414,
      y: 546,
      font: "F2",
      size: 10,
      color: accentMuted,
      lines: [`${invoice.paymentStatus ?? invoice.statusLabel}`.toUpperCase()],
      leading: 11,
    }),
  );
  commands.push(
    ...textCommands({
      x: 400,
      y: 510,
      font: "F1",
      size: 10,
      color: textSecondary,
      lines: [`Due ${formatPdfDate(invoice.dueAt)}`],
      leading: 12,
    }),
  );

  // Billing summary table card
  commands.push(...boxCommands({
    x: 40,
    y: 306,
    width: 515,
    height: 180,
    fill: white,
    stroke: border,
    strokeWidth: 1,
  }));
  commands.push(
    ...textCommands({
      x: 56,
      y: 466,
      font: "F2",
      size: 14,
      color: textPrimary,
      lines: ["Billing summary"],
      leading: 16,
    }),
  );
  commands.push(...lineCommands({
    x1: 56,
    y1: 454,
    x2: 539,
    y2: 454,
    color: accentSoft,
    width: 1,
  }));

  const summaryRows = [
    ["Subtotal", formatMoney(invoice.subtotal, currency)],
    ["Platform fee", formatMoney(invoice.platformFee, currency)],
    ["Taxes", formatMoney(invoice.taxAmount, currency)],
    ["Security deposit", formatMoney(invoice.securityDeposit, currency)],
  ];
  let rowY = 428;
  for (const [label, value] of summaryRows) {
    commands.push(
      ...textCommands({
        x: 56,
        y: rowY,
        font: "F1",
        size: 10,
        color: textSecondary,
        lines: [label],
        leading: 12,
      }),
    );
    commands.push(
      ...textCommands({
        x: 418,
        y: rowY,
        font: "F2",
        size: 11,
        color: textPrimary,
        lines: [value],
        leading: 12,
      }),
    );
    rowY -= 25;
  }

  commands.push(...lineCommands({
    x1: 56,
    y1: 334,
    x2: 539,
    y2: 334,
    color: border,
    width: 1,
  }));
  commands.push(
    ...textCommands({
      x: 56,
      y: 318,
      font: "F2",
      size: 12,
      color: textPrimary,
      lines: ["Total"],
      leading: 13,
    }),
  );
  commands.push(
    ...textCommands({
      x: 418,
      y: 316,
      font: "F2",
      size: 16,
      color: accent,
      lines: [formatMoney(invoice.totalAmount, currency)],
      leading: 18,
    }),
  );

  // Items table
  commands.push(...boxCommands({
    x: 40,
    y: 92,
    width: 515,
    height: 196,
    fill: surface,
    stroke: border,
    strokeWidth: 1,
  }));
  commands.push(
    ...textCommands({
      x: 56,
      y: 272,
      font: "F2",
      size: 14,
      color: textPrimary,
      lines: ["Line items"],
      leading: 16,
    }),
  );
  commands.push(...lineCommands({
    x1: 56,
    y1: 260,
    x2: 539,
    y2: 260,
    color: accentSoft,
    width: 1,
  }));
  commands.push(
    ...textCommands({
      x: 56,
      y: 246,
      font: "F2",
      size: 9,
      color: textSecondary,
      lines: ["Description"],
      leading: 11,
    }),
  );
  commands.push(
    ...textCommands({
      x: 430,
      y: 246,
      font: "F2",
      size: 9,
      color: textSecondary,
      lines: ["Amount"],
      leading: 11,
    }),
  );

  const itemLines = buildInvoiceItemLines(invoice.items);
  let itemY = 224;
  invoice.items.forEach((item, index) => {
    const alternatingFill = index % 2 === 0 ? white : surface;
    commands.push(...boxCommands({
      x: 50,
      y: itemY - 14,
      width: 496,
      height: 24,
      fill: alternatingFill,
    }));
    commands.push(
      ...textCommands({
        x: 56,
        y: itemY,
        font: "F1",
        size: 10,
        color: textPrimary,
        lines: [itemLines[index] ?? normalizePdfText(item.description)],
        leading: 12,
      }),
    );
    commands.push(
      ...textCommands({
        x: 430,
        y: itemY,
        font: "F2",
        size: 10,
        color: textPrimary,
        lines: [formatMoney(item.total, currency)],
        leading: 12,
      }),
    );
    itemY -= 28;
  });

  // Footer
  commands.push(...lineCommands({
    x1: 40,
    y1: 72,
    x2: 555,
    y2: 72,
    color: accentSoft,
    width: 1,
  }));
  commands.push(
    ...textCommands({
      x: 40,
      y: 58,
      font: "F1",
      size: 9,
      color: textSecondary,
      lines: ["Generated by GETYOURCAVE. This export is for records and reconciliation."],
      leading: 11,
    }),
  );

  commands.push(...circleCommands({
    x: 545,
    y: 58,
    radius: 6,
    fill: accentMuted,
  }));
  commands.push(
    ...textCommands({
      x: 513,
      y: 48,
      font: "F2",
      size: 9,
      color: textSecondary,
      lines: [normalizePdfText(invoice.statusLabel.toUpperCase())],
      leading: 11,
    }),
  );

  return commands;
}

function buildPdfContentStream(commands: string[]) {
  return Buffer.from(commands.join("\n"), "utf8");
}

function buildPdfObject(objectNumber: number, body: string | Buffer) {
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
  return Buffer.concat([
    Buffer.from(`${objectNumber} 0 obj\n`, "utf8"),
    bodyBuffer,
    Buffer.from("\nendobj\n", "utf8"),
  ]);
}

function buildPdfWithObjects(objects: Buffer[]) {
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
  const chunks: Buffer[] = [header];
  const offsets: number[] = [0];
  let length = header.length;

  for (const object of objects) {
    offsets.push(length);
    chunks.push(object);
    length += object.length;
  }

  const xrefStart = length;
  const xrefLines = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ];

  chunks.push(Buffer.from(xrefLines.join("\n"), "utf8"));
  return Buffer.concat(chunks);
}

export function buildInvoicePdfBytes(invoice: SafeInvoice) {
  const commands = buildInvoicePdfCommands(invoice);
  const contentStream = buildPdfContentStream(commands);

  const objects = [
    buildPdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    buildPdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    buildPdfObject(
      3,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    ),
    buildPdfObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    buildPdfObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
    buildPdfObject(6, `<< /Length ${contentStream.length} >>\nstream\n${contentStream.toString("utf8")}\nendstream`),
  ];

  return buildPdfWithObjects(objects);
}

export function buildInvoicePdfFileName(invoiceNumber: string) {
  const safeName = normalizePdfText(invoiceNumber).trim().replace(/[^A-Za-z0-9._-]+/g, "-") || "invoice";
  return `${safeName}.pdf`;
}
