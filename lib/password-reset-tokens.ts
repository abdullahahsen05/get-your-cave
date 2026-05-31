import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TOKEN_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

const PASSWORD_RESET_TOKEN_INDEX_SQL = [
  'CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");',
  'CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");',
  'CREATE INDEX IF NOT EXISTS "PasswordResetToken_usedAt_idx" ON "PasswordResetToken"("usedAt");',
];

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

let ensuredPasswordResetTokenTable = false;

export async function ensurePasswordResetTokenTable() {
  if (ensuredPasswordResetTokenTable) {
    return;
  }

  await prisma.$executeRawUnsafe(PASSWORD_RESET_TOKEN_TABLE_SQL);
  for (const statement of PASSWORD_RESET_TOKEN_INDEX_SQL) {
    await prisma.$executeRawUnsafe(statement);
  }

  ensuredPasswordResetTokenTable = true;
}

export async function createPasswordResetToken(params: {
  id: string;
  userId: string;
  expiresAt: Date;
}) {
  await ensurePasswordResetTokenTable();

  const [record] = await prisma.$queryRaw<PasswordResetTokenRecord[]>(Prisma.sql`
    INSERT INTO "PasswordResetToken" (
      "id",
      "userId",
      "expiresAt",
      "usedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${params.id},
      ${params.userId},
      ${params.expiresAt},
      NULL,
      NOW(),
      NOW()
    )
    RETURNING
      "id",
      "userId",
      "expiresAt",
      "usedAt"
  `);

  return record ?? null;
}

export async function deleteActivePasswordResetTokens(userId: string) {
  await ensurePasswordResetTokenTable();
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "PasswordResetToken"
    WHERE "userId" = ${userId}
      AND "usedAt" IS NULL
  `);
}

export async function findPasswordResetTokenById(tokenId: string) {
  await ensurePasswordResetTokenTable();

  const [record] = await prisma.$queryRaw<PasswordResetTokenRecord[]>(Prisma.sql`
    SELECT
      "id",
      "userId",
      "expiresAt",
      "usedAt"
    FROM "PasswordResetToken"
    WHERE "id" = ${tokenId}
    LIMIT 1
  `);

  return record ?? null;
}

export async function consumePasswordResetToken(tokenId: string) {
  await ensurePasswordResetTokenTable();
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = ${tokenId}
  `);
}

export async function deletePasswordResetTokenById(tokenId: string) {
  await ensurePasswordResetTokenTable();
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "PasswordResetToken"
    WHERE "id" = ${tokenId}
  `);
}
