-- CreateEnum
CREATE TYPE "ExpiryType" AS ENUM ('SPECIFIC_DATE', 'RELATIVE_DAYS');

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "expiryDays" INTEGER,
ADD COLUMN     "expiryType" "ExpiryType",
ADD COLUMN     "publishAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Survey_publishAt_idx" ON "Survey"("publishAt");

-- CreateIndex
CREATE INDEX "Survey_expiresAt_idx" ON "Survey"("expiresAt");
