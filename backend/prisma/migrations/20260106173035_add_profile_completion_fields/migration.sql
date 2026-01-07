-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "ageBucket" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "profileCompletionRewardGiven" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Profile_ageBucket_idx" ON "Profile"("ageBucket");
