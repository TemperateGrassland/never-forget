import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  console.log("🔎 Checking for due reminders...");

  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: { scheduledAt: { lte: now }, sent: false },
    include: { user: true },
  });

  for (const reminder of dueReminders) {
    console.log(`📢 Sending reminder to ${reminder.user.email}: ${reminder.title}`);

    // Todo add the logic to send the whatsapp msg

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true },
    });
  }

  return NextResponse.json({ message: "Checked reminders" });
}