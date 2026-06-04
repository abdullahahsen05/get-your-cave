/**
 * Debug script: inspect local DB for Stripe refund mapping.
 * READ-ONLY — does not modify any data.
 * Run: npx tsx scripts/debug-refund-mapping.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// IDs from the charge.refunded event — safe to hardcode (non-secret Stripe object IDs)
const CHARGE_ID  = "ch_3Tdc16BErJr4sfSZ1mS7ZBzh";
const PI_ID      = "pi_3Tdc16BErJr4sfSZ1gMJNFNW";
const CUSTOMER_ID = "cus_UcrkhqTziBCCps";

const paymentSelect = {
  id: true,
  status: true,
  amount: true,
  bookingId: true,
  stripePaymentIntentId: true,
  stripeChargeId: true,
  stripeCustomerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function main() {
  console.log("=== SEARCHING FOR STRIPE IDs IN LOCAL DB ===\n");

  const [byPI, byCharge, byCustomer] = await Promise.all([
    prisma.payment.findFirst({ where: { stripePaymentIntentId: PI_ID }, select: paymentSelect }),
    prisma.payment.findFirst({ where: { stripeChargeId: CHARGE_ID }, select: paymentSelect }),
    prisma.payment.findMany({ where: { stripeCustomerId: CUSTOMER_ID }, select: paymentSelect }),
  ]);

  console.log(`stripePaymentIntentId=${PI_ID}`);
  console.log("  Found:", byPI ? `YES — id=${byPI.id}, status=${byPI.status}` : "NO MATCH");

  console.log(`\nstripeChargeId=${CHARGE_ID}`);
  console.log("  Found:", byCharge ? `YES — id=${byCharge.id}, status=${byCharge.status}` : "NO MATCH");

  console.log(`\nstripeCustomerId=${CUSTOMER_ID}`);
  if (byCustomer.length === 0) {
    console.log("  Found: NO MATCH");
  } else {
    byCustomer.forEach((p) =>
      console.log(`  Found: id=${p.id}, status=${p.status}, piId=${p.stripePaymentIntentId ?? "NULL"}, chargeId=${p.stripeChargeId ?? "NULL"}`)
    );
  }

  console.log("\n=== LATEST 10 PAYMENTS ===");
  const latestPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: paymentSelect,
  });
  latestPayments.forEach((p) =>
    console.log(
      `  id=${p.id.slice(0, 8)}.. status=${p.status} amount=${p.amount} piId=${p.stripePaymentIntentId ?? "NULL"} chargeId=${p.stripeChargeId ?? "NULL"} cusId=${p.stripeCustomerId ?? "NULL"} booking=${p.bookingId.slice(0, 8)}.. at=${p.createdAt.toISOString()}`
    )
  );

  console.log("\n=== LATEST 10 INVOICES ===");
  const latestInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, invoiceNumber: true, status: true, totalAmount: true, paymentId: true, bookingId: true, createdAt: true },
  });
  latestInvoices.forEach((i) =>
    console.log(
      `  id=${i.id.slice(0, 8)}.. num=${i.invoiceNumber} status=${i.status} amount=${i.totalAmount} paymentId=${i.paymentId?.slice(0, 8) ?? "NULL"}.. booking=${i.bookingId.slice(0, 8)}.. at=${i.createdAt.toISOString()}`
    )
  );

  console.log("\n=== PAYMENTS WITH NULL STRIPE IDs ===");
  const nullPIPayments = await prisma.payment.findMany({
    where: { stripePaymentIntentId: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: paymentSelect,
  });
  console.log(`  Count with NULL stripePaymentIntentId (latest 5): ${nullPIPayments.length}`);
  nullPIPayments.forEach((p) =>
    console.log(`    id=${p.id.slice(0, 8)}.. status=${p.status} amount=${p.amount} cusId=${p.stripeCustomerId ?? "NULL"} at=${p.createdAt.toISOString()}`)
  );

  console.log("\n=== SUMMARY ===");
  console.log(`PI_ID in DB:     ${byPI ? "YES" : "NO ← ROOT CAUSE"}`);
  console.log(`CHARGE_ID in DB: ${byCharge ? "YES" : "NO"}`);
  console.log(`CUSTOMER in DB:  ${byCustomer.length > 0 ? `YES (${byCustomer.length} rows)` : "NO"}`);
}

main()
  .catch((err) => console.error("Script error:", err.message))
  .finally(() => prisma.$disconnect());
