/**
 * Seed script for Phase 4 BoldSign testing.
 *
 * Creates 3 users (admin / owner / renter), a published listing,
 * an APPROVED booking, and a GeneratedContract ready to send for signature.
 *
 * SAFE: uses upsert/create-if-not-exists — does NOT truncate anything.
 * Run: npx tsx prisma/seed-phase4.ts
 */

import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PASSWORD = "Password123!";
const PLATFORM_COMMISSION = 0.20;

// ── helpers ──────────────────────────────────────────────────────────────────

function bookingNumber() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `BK-${stamp}-${randomUUID().slice(0, 5).toUpperCase()}`;
}

function contractNumber(bkNum: string) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `CTR-${bkNum}-${stamp}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Phase 4 seed — BoldSign test data");

  const hash = await bcrypt.hash(PASSWORD, 12);

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@getyourcave.com" },
    update: { fullName: "Admin", role: "ADMIN", status: "ACTIVE", emailVerified: true, passwordHash: hash },
    create: {
      email: "admin@getyourcave.com",
      fullName: "Admin",
      passwordHash: hash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  ✓ admin:  admin@getyourcave.com / ${PASSWORD}`);

  // ── 2. Owner ──────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@getyourcave.com" },
    update: { fullName: "Sophie Martin", role: "OWNER", status: "ACTIVE", emailVerified: true, passwordHash: hash },
    create: {
      email: "owner@getyourcave.com",
      fullName: "Sophie Martin",
      passwordHash: hash,
      role: "OWNER",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const ownerProfile = await prisma.ownerProfile.upsert({
    where: { userId: ownerUser.id },
    update: { country: "France", city: "Paris" },
    create: {
      userId: ownerUser.id,
      bio: "Property owner in Paris",
      address: "12 Rue de Rivoli",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      verificationStatus: "APPROVED",
    },
  });
  console.log(`  ✓ owner:  owner@getyourcave.com / ${PASSWORD}`);

  // ── 3. Renter ─────────────────────────────────────────────────────────────
  const renterUser = await prisma.user.upsert({
    where: { email: "renter@getyourcave.com" },
    update: { fullName: "Thomas Leblanc", role: "RENTER", status: "ACTIVE", emailVerified: true, passwordHash: hash },
    create: {
      email: "renter@getyourcave.com",
      fullName: "Thomas Leblanc",
      passwordHash: hash,
      role: "RENTER",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const renterProfile = await prisma.renterProfile.upsert({
    where: { userId: renterUser.id },
    update: { country: "France" },
    create: {
      userId: renterUser.id,
      address: "5 Avenue Montaigne",
      city: "Paris",
      postalCode: "75008",
      country: "France",
      verificationStatus: "APPROVED",
    },
  });
  console.log(`  ✓ renter: renter@getyourcave.com / ${PASSWORD}`);

  // ── 4. Listing ────────────────────────────────────────────────────────────
  const existingListing = await prisma.listing.findFirst({
    where: { ownerId: ownerProfile.id, status: "APPROVED" },
  });

  const listing = existingListing ?? await prisma.listing.create({
    data: {
      ownerId: ownerProfile.id,
      title: "Cave de Stockage — Bastille",
      slug: `cave-bastille-${randomUUID().slice(0, 6)}`,
      description: "Spacious, climate-controlled cave storage in the heart of Paris. Ideal for wine, furniture, and personal belongings. 24/7 secure access.",
      storageType: "BASEMENT",
      status: "APPROVED",
      isPublished: true,
      availability: "AVAILABLE",
      address: "8 Place de la Bastille",
      city: "Paris",
      postalCode: "75011",
      country: "France",
      latitude: 48.8533,
      longitude: 2.3692,
      sizeM2: 18,
      pricePerMonth: new (await import("@prisma/client")).Prisma.Decimal("450.00"),
      securityDeposit: new (await import("@prisma/client")).Prisma.Decimal("900.00"),
      insuranceFee: new (await import("@prisma/client")).Prisma.Decimal("15.00"),
      ratingAverage: 0,
      ratingCount: 0,
    },
  });
  console.log(`  ✓ listing: "${listing.title}" (${listing.status})`);

  // ── 5. Booking (APPROVED) ─────────────────────────────────────────────────
  const existingBooking = await prisma.booking.findFirst({
    where: {
      listingId: listing.id,
      ownerId: ownerProfile.id,
      renterId: renterProfile.id,
      status: { in: ["APPROVED", "ACTIVE"] },
    },
  });

  const monthlyPrice = listing.pricePerMonth;
  const commission = monthlyPrice.mul(PLATFORM_COMMISSION).toDecimalPlaces(2);
  const ownerAmount = monthlyPrice.sub(commission).toDecimalPlaces(2);
  const total = monthlyPrice.add(listing.insuranceFee).toDecimalPlaces(2);

  const booking = existingBooking ?? await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      listingId: listing.id,
      ownerId: ownerProfile.id,
      renterId: renterProfile.id,
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-10-01T00:00:00.000Z"),
      durationMonths: 3,
      monthlyPrice,
      securityDeposit: listing.securityDeposit,
      insuranceFee: listing.insuranceFee,
      platformCommission: commission,
      ownerAmount,
      totalMonthlyAmount: total,
      status: "APPROVED",
      approvedAt: new Date(),
      renterNote: "I need storage for furniture during my apartment renovation.",
    },
  });
  console.log(`  ✓ booking: ${booking.bookingNumber} (${booking.status})`);

  // ── 6. Contract template (upsert) ─────────────────────────────────────────
  const template = await prisma.contractTemplate.upsert({
    where: { type: "LONG_TERM_RENTAL" },
    update: { name: "Long-Term Rental", isActive: true },
    create: {
      name: "Long-Term Rental",
      type: "LONG_TERM_RENTAL",
      description: "Standard long-term rental agreement",
      isActive: true,
    },
  });

  // ── 7. GeneratedContract (GENERATED) ──────────────────────────────────────
  const existingContract = await prisma.generatedContract.findUnique({
    where: { bookingId: booking.id },
  });

  if (!existingContract) {
    const ctrNum = contractNumber(booking.bookingNumber);
    const generatedDir = path.resolve(process.cwd(), "docs", "generated");
    await ensureDir(generatedDir);
    const fileName = `${booking.id}-seed.docx`;
    const filePath = path.join("docs", "generated", fileName);

    await prisma.generatedContract.create({
      data: {
        contractNumber: ctrNum,
        bookingId: booking.id,
        templateId: template.id,
        contractType: "LONG_TERM_RENTAL",
        status: "GENERATED",
        generatedFilePath: filePath,
        generatedFileName: fileName,
        signatureProvider: null,
        contractData: {
          owner_name: ownerUser.fullName,
          owner_email: ownerUser.email,
          renter_name: renterUser.fullName,
          renter_email: renterUser.email,
          listing_name: listing.title,
          monthly_price: monthlyPrice.toFixed(2),
        },
      },
    });
    console.log(`  ✓ contract: ${ctrNum} (GENERATED) — ready to send for signature`);
  } else {
    console.log(`  ✓ contract: ${existingContract.contractNumber} (${existingContract.status}) — already exists`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━ Phase 4 Test Credentials ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Admin   admin@getyourcave.com    / ${PASSWORD}`);
  console.log(`  Owner   owner@getyourcave.com    / ${PASSWORD}`);
  console.log(`  Renter  renter@getyourcave.com   / ${PASSWORD}`);
  console.log("────────────────────────────────────────────────────────────────");
  console.log("  All passwords: Password123!");
  console.log("\n━━━ BoldSign Test Flow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  1. Login as owner → /contracts → click Generate (if needed)");
  console.log("  2. Click 'Send for Signature'");
  console.log("  3. BoldSign emails the OWNER first (check owner@getyourcave.com)");
  console.log("  4. After owner signs → BoldSign emails RENTER");
  console.log("  5. After renter signs → webhook fires → contract status = SIGNED");
  console.log("  6. Signed PDF + audit trail download appear on /contracts");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
