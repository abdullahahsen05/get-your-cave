/*
  Warnings:

  - You are about to drop the column `fileMimeType` on the `Message` table. All the data in the column will be lost.
  - Made the column `body` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Message_conversationId_idx";

-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- DropIndex
DROP INDEX "Message_readAt_idx";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "fileMimeType",
ALTER COLUMN "body" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_type_idx" ON "Message"("type");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_renterUserId_fkey" FOREIGN KEY ("renterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
