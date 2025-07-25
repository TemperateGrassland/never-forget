/*
  Warnings:

  - The values [DAILY,EVERY_OTHER_DAY,WEEKEND] on the enum `ReminderFrequency` will be removed. If these variants are still used in the database, this will fail.

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
