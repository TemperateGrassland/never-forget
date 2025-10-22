/*
  Warnings:

  - You are about to drop the column `templateName` on the `FlowResponse` table. All the data in the column will be lost.

*/
-- DropIndex (only if it exists)
DROP INDEX IF EXISTS "FlowResponse_templateName_createdAt_idx";

-- AlterTable (only if column exists)
ALTER TABLE "FlowResponse" DROP COLUMN IF EXISTS "templateName";
