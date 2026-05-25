/* eslint-disable @typescript-eslint/no-require-imports */

require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const pg = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const pool = new pg.Pool({
  connectionString,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const adminEmail = "admin@getyourcave.com";
  const adminPassword = "Password123!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_DB_RESET !== "true") {
    throw new Error(
      "Refusing to reset the database in production. Set ALLOW_PROD_DB_RESET=true only if you are sure.",
    );
  }

  if (!process.argv.slice(2).some((arg) => arg === "--yes" || arg === "--force")) {
    throw new Error("Missing confirmation flag. Run this script with --yes.");
  }

  const { rows: tables } = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations', 'prisma_migrations')
    ORDER BY tablename ASC
  `);

  if (tables.length > 0) {
    const tableNames = tables.map((table) => `"${table.tablename.replace(/"/g, '""')}"`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`);
    console.log(
      `Reset complete. Cleared ${tables.length} table${tables.length === 1 ? "" : "s"}: ${tables
        .map((table) => table.tablename)
        .join(", ")}`,
    );
  } else {
    console.log("No public tables found to reset.");
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Seed Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: "Seed Admin",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Admin user seeded.");
  console.log(`Login: ${adminEmail} / ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
