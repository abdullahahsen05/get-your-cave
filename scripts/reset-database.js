/* eslint-disable @typescript-eslint/no-require-imports */

require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

function hasConfirmationFlag(argv) {
  return argv.includes("--yes") || argv.includes("--force");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_DB_RESET !== "true") {
    throw new Error(
      "Refusing to reset the database in production. Set ALLOW_PROD_DB_RESET=true only if you are sure.",
    );
  }

  if (!hasConfirmationFlag(process.argv.slice(2))) {
    throw new Error("Missing confirmation flag. Run this script with --yes.");
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    const { rows: tables } = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN ('_prisma_migrations', 'prisma_migrations')
      ORDER BY tablename ASC
    `);

    if (!tables.length) {
      console.log("No public tables found to reset.");
      return;
    }

    const tableNames = tables.map((table) => `"${table.tablename.replace(/"/g, '""')}"`);
    const statement = `TRUNCATE TABLE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`;

    await prisma.$executeRawUnsafe(statement);

    console.log(
      `Reset complete. Cleared ${tables.length} table${tables.length === 1 ? "" : "s"}: ${tables
        .map((table) => table.tablename)
        .join(", ")}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
