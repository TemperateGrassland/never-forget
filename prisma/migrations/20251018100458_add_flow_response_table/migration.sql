/*
  Warnings:

  - The values [DAILY] on the enum `ReminderFrequency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReminderFrequency_new" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY', 'YEARLY');
ALTER TABLE "Reminder" ALTER COLUMN "frequency" DROP DEFAULT;
ALTER TABLE "Reminder" ALTER COLUMN "frequency" TYPE "ReminderFrequency_new" USING ("frequency"::text::"ReminderFrequency_new");
ALTER TYPE "ReminderFrequency" RENAME TO "ReminderFrequency_old";
ALTER TYPE "ReminderFrequency_new" RENAME TO "ReminderFrequency";
DROP TYPE "ReminderFrequency_old";
ALTER TABLE "Reminder" ALTER COLUMN "frequency" SET DEFAULT 'NONE';
COMMIT;

-- CreateTable
CREATE TABLE "AnonymousFeedback" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowResponse" (
    "id" TEXT NOT NULL,
    "flowToken" TEXT NOT NULL,
    "flowName" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowResponse_flowToken_key" ON "FlowResponse"("flowToken");

-- CreateIndex
CREATE INDEX "FlowResponse_flowName_createdAt_idx" ON "FlowResponse"("flowName", "createdAt");

-- CreateIndex
CREATE INDEX "FlowResponse_phoneNumber_idx" ON "FlowResponse"("phoneNumber");

-- AddForeignKey
ALTER TABLE "FlowResponse" ADD CONSTRAINT "FlowResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
