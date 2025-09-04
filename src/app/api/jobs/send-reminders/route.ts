import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Template rotation based on day of month - easily expandable
    // const templates = ['daily_reminder', 'daily_reminder2', 'daily_reminder3'];
    // const dayIndex = new Date().getDate() % templates.length;
    // const templateName = templates[dayIndex];
    
    // Use single template for now
    const templateName = 'daily_reminder';
    
    // console.log(`Day ${new Date().getDate()}: Using template ${templateName}`);
    console.log(`Using template ${templateName}`);

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

      // TODO trigger a message to be sent that prompts user to add a reminder

      const reminderList = reminders
        .map((reminder) => `* ${reminder.title}`)
        .join(" \r");

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
              name: templateName,
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