// Read-only signup diagnostic. Prints NO secrets (no hashes/tokens/urls).
// Run: node --env-file=.env scripts/diag-signup.mjs
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      ownerProfile: { select: { id: true } },
      renterProfile: { select: { id: true } },
    },
  });

  console.log("\n=== Latest users ===");
  for (const u of users) {
    console.log(
      `${u.createdAt.toISOString()} | ${u.role.padEnd(6)} | ${u.status.padEnd(20)} | owner:${u.ownerProfile ? "YES" : "no "} | renter:${u.renterProfile ? "YES" : "no "} | ${u.email}`,
    );
  }

  const profiles = await prisma.ownerProfile.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, userId: true, createdAt: true },
  });

  console.log("\n=== Latest owner profiles ===");
  for (const p of profiles) {
    console.log(`${p.createdAt.toISOString()} | profile:${p.id} | userId:${p.userId}`);
  }

  const counts = await prisma.user.groupBy({
    by: ["role", "status"],
    _count: { _all: true },
  });
  console.log("\n=== Counts by role/status ===");
  for (const c of counts) {
    console.log(`${c.role.padEnd(6)} | ${c.status.padEnd(20)} | ${c._count._all}`);
  }
} finally {
  await prisma.$disconnect();
}
