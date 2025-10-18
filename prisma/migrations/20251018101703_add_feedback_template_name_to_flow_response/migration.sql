/*
  Warnings:

  - Added the required column `templateName` to the `FlowResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlowResponse" ADD COLUMN     "templateName" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "FlowResponse_templateName_createdAt_idx" ON "FlowResponse"("templateName", "createdAt");
