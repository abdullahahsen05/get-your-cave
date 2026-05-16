-- CreateTable
CREATE TABLE "GeneratedContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedFilePath" TEXT NOT NULL,
    "generatedFileName" TEXT NOT NULL,
    "contractData" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedContract_contractNumber_key" ON "GeneratedContract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedContract_bookingId_key" ON "GeneratedContract"("bookingId");

-- CreateIndex
CREATE INDEX "GeneratedContract_templateId_idx" ON "GeneratedContract"("templateId");

-- CreateIndex
CREATE INDEX "GeneratedContract_contractType_idx" ON "GeneratedContract"("contractType");

-- CreateIndex
CREATE INDEX "GeneratedContract_status_idx" ON "GeneratedContract"("status");

-- CreateIndex
CREATE INDEX "GeneratedContract_generatedAt_idx" ON "GeneratedContract"("generatedAt");

-- AddForeignKey
ALTER TABLE "GeneratedContract" ADD CONSTRAINT "GeneratedContract_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContract" ADD CONSTRAINT "GeneratedContract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

