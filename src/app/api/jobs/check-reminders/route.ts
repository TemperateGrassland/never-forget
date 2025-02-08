import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  console.log("🔎 Checking for due reminders...");

  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      scheduledAt: {
        gte: new Date(now.setHours(0, 0, 0, 0)),
        lt: new Date(now.setHours(23, 59, 59, 999)),
      },
      frequency: { not: "NONE" },
    },
    include: { user: true },
  });

  for (const reminder of dueReminders) {
    console.log(`📢 Sending reminder to ${reminder.user.email}: ${reminder.title}`);
    await sendWhatsAppMessage(reminder.user.phoneNumber, reminder.title);
  
    // Todo add the logic to send the whatsapp msg

    await prisma.reminder.update({
      where: { id: reminder.id },
      // TODO add this field to the Reminder schema.  
      data: { sent: true },
    });
  }

  console.log(`📢 Sent ${reminders.length} reminders.`);

  return NextResponse.json({ message: "Checked reminders" });
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  // TODO update
  const url = `https://graph.facebook.com/v15.0/<Phone_Number_ID>/messages`;
  // TODO update
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // TODO check this works
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: { body: message },
    }),
  });
}