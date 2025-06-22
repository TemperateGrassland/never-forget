import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        phoneNumber: { not: null },
      },
      include: {
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "No users found" }, { status: 404 });
    }

    let messagesSent = 0;

    for (const user of users) {
      const { firstName, phoneNumber, reminders } = user;

      if (!phoneNumber || reminders.length === 0) continue;

      const reminderList = reminders
        .map((reminder) => {
          const dateLabel = new Date(reminder.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return `* ${reminder.title} (${dateLabel})`;
        })
        .join(" \n");

      const res = await fetch(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
              name: "daily_reminder",
              language: {
                code: "en",
                policy: "deterministic",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", parameter_name: "text", text: firstName },
                    { type: "text", parameter_name: "reminder_list", text: reminderList },
                  ],
                },
              ],
            },
          }),
        }
      );

      const result = await res.json();
      if (res.ok) {
        messagesSent++;
      } else {
        console.error(`Failed to send to ${phoneNumber}: ${result.error?.message}`);
      }
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (error) {
    console.error("WhatsApp cron error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}