/*
  Warnings:

  - You are about to drop the column `frequency` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `isSent` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `Reminder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "frequency",
DROP COLUMN "isSent",
DROP COLUMN "scheduledAt",
ADD COLUMN     "isComplete" BOOLEAN NOT NULL DEFAULT false;
