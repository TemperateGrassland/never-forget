/*
  Warnings:

  - None

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentMonthDeliveries" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastUsageReset" TIMESTAMP(3);