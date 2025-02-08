import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
// Secure the cron job by checking the auth header against the env var, should both be the same
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== 'Bearer $(process.env.WHATSAPP_CRON_SECRET)') {
    return new Response("Unauthorized", { status: 401 });
  }
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

  for (const reminder of reminders) {
    console.log(`📢 Sending reminder to ${reminder.user.email}: ${reminder.title}`);
    try {
      const phoneNumber = reminder.user.phoneNumber ?? ''
      if (phoneNumber.length < 10) {
        console.log(`📢 No valid phone number found for ${reminder.user.email}: ${reminder.title}`);
        return;
      }
      const response = await sendWhatsAppMessage(phoneNumber, reminder.title);
      if (response == 200) {
        console.log(`📢 Reminder sent to ${reminder.user.email}: ${reminder.title}`);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { isSent: true },
        });
      }
    } catch (error) {
      console.error(`📢 Error sending reminder to ${reminder.user.email}: ${reminder.title}`, error);
    }
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
  const messageSent = await fetch(url, {
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

  return messageSent.status;
}