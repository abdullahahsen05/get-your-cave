import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const result = await prisma.user.updateMany({
    data: { twoFactorEnabled: false },
  });
  console.log(`Updated ${result.count} users — 2FA disabled for all demo accounts`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
