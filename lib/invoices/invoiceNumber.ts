import { prisma } from "@/lib/prisma";

function buildInvoicePrefix(date = new Date()) {
  return `INV-${date.getUTCFullYear()}`;
}

function parseInvoiceSequence(invoiceNumber: string) {
  const match = invoiceNumber.match(/^INV-\d{4}-(\d{4,})$/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export async function generateInvoiceNumber() {
  const prefix = buildInvoicePrefix();
  const latest = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `${prefix}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  const nextSequence = latest ? (parseInvoiceSequence(latest.invoiceNumber) ?? 0) + 1 : 1;
  return `${prefix}-${String(nextSequence).padStart(4, "0")}`;
}
