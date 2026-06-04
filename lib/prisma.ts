import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  // Enable SSL for hosted databases (Supabase, Railway, Neon, etc.).
  // Supabase requires SSL for all external connections.
  const requiresSsl =
    connectionString.includes("supabase.co") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("railway.app") ||
    connectionString.includes("sslmode=require");

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

