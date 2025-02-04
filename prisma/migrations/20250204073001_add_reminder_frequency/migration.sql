-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('NONE', 'DAILY', 'EVERY_OTHER_DAY', 'WEEKLY', 'WEEKEND', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "frequency" "ReminderFrequency" NOT NULL DEFAULT 'NONE';
