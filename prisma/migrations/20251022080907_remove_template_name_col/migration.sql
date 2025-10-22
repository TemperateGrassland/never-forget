/*
  Warnings:

  - You are about to drop the column `templateName` on the `FlowResponse` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FlowResponse_templateName_createdAt_idx";

-- AlterTable
ALTER TABLE "FlowResponse" DROP COLUMN "templateName";
