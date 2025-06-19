import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Fetch user-specific reminders from the database
    const reminders = await prisma.reminder.findMany({
      where: { userId: process.env.DEFAULT_USER_ID }, // Replace with actual user ID from auth
      orderBy: { createdAt: "desc" }, // Fetch most recent reminders first
      take: 3, // Limit to 3 reminders for WhatsApp template
    });

    if (reminders.length === 0) {
      return NextResponse.json({ success: false, error: "No reminders found" }, { status: 404 });
    }

    // Format reminders into WhatsApp template structure
    const formattedReminders = reminders.map((reminder, index) => ({
      type: "text",
      text: reminder.title, // ✅ Fetch title dynamically
      parameter_name: `reminder_${index + 1}`,
    }));

    const whenReminders = reminders.map((reminder, index) => ({
      type: "text",
      text: new Date(reminder.createdAt).toLocaleDateString(), // ✅ Fetch created date
      parameter_name: `when_${index + 1}`,
    }));

    // Send the formatted WhatsApp message
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: process.env.WHATSAPP_RECIPIENT_PHONE,
          type: "template",
          template: {
            name: "reminder",
            language: {
              code: "en_GB",
              policy: "deterministic",
            },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", parameter_name: "text", text: "Mobo" },
                  ...formattedReminders,
                  ...whenReminders,
                ],
              },
            ],
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Error: ${result.error?.message || "Failed to send message"}`);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}