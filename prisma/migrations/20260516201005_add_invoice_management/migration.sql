-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "generatedFile" TEXT,
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "timeline" JSONB;
