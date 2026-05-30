import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const LOGIN_CHALLENGE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "LoginChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

const LOGIN_CHALLENGE_INDEX_SQL = [
  'CREATE INDEX IF NOT EXISTS "LoginChallenge_userId_idx" ON "LoginChallenge"("userId");',
  'CREATE INDEX IF NOT EXISTS "LoginChallenge_expiresAt_idx" ON "LoginChallenge"("expiresAt");',
  'CREATE INDEX IF NOT EXISTS "LoginChallenge_consumedAt_idx" ON "LoginChallenge"("consumedAt");',
];

export type LoginChallengeRecord = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  maxAttempts: number;
  consumedAt: Date | null;
};

let ensuredLoginChallengeTable = false;

export async function ensureLoginChallengeTable() {
  if (ensuredLoginChallengeTable) {
    return;
  }

  await prisma.$executeRawUnsafe(LOGIN_CHALLENGE_TABLE_SQL);
  for (const statement of LOGIN_CHALLENGE_INDEX_SQL) {
    await prisma.$executeRawUnsafe(statement);
  }

  ensuredLoginChallengeTable = true;
}

export async function createLoginChallenge(params: {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
}) {
  await ensureLoginChallengeTable();

  const [record] = await prisma.$queryRaw<LoginChallengeRecord[]>(Prisma.sql`
    INSERT INTO "LoginChallenge" (
      "id",
      "userId",
      "codeHash",
      "expiresAt",
      "attemptCount",
      "maxAttempts",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${params.id},
      ${params.userId},
      ${params.codeHash},
      ${params.expiresAt},
      0,
      5,
      NOW(),
      NOW()
    )
    RETURNING
      "id",
      "userId",
      "codeHash",
      "expiresAt",
      "attemptCount",
      "maxAttempts",
      "consumedAt"
  `);

  return record ?? null;
}

export async function deleteActiveLoginChallenges(userId: string) {
  await ensureLoginChallengeTable();
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "LoginChallenge"
    WHERE "userId" = ${userId}
      AND "consumedAt" IS NULL
  `);
}

export async function findLoginChallengeById(challengeId: string) {
  await ensureLoginChallengeTable();

  const [record] = await prisma.$queryRaw<LoginChallengeRecord[]>(Prisma.sql`
    SELECT
      "id",
      "userId",
      "codeHash",
      "expiresAt",
      "attemptCount",
      "maxAttempts",
      "consumedAt"
    FROM "LoginChallenge"
    WHERE "id" = ${challengeId}
    LIMIT 1
  `);

  return record ?? null;
}

export async function incrementLoginChallengeAttempts(
  challengeId: string,
  attemptCount: number,
) {
  await ensureLoginChallengeTable();
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "LoginChallenge"
    SET "attemptCount" = ${attemptCount},
        "updatedAt" = NOW()
    WHERE "id" = ${challengeId}
  `);
}

export async function consumeLoginChallenge(challengeId: string) {
  await ensureLoginChallengeTable();
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "LoginChallenge"
    SET "consumedAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = ${challengeId}
  `);
}

export async function deleteLoginChallengeById(challengeId: string) {
  await ensureLoginChallengeTable();
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "LoginChallenge"
    WHERE "id" = ${challengeId}
  `);
}
