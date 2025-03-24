import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch user-specific reminders from the database
    const reminders = await prisma.reminder.findMany({
      where: { userId: process.env.DEFAULT_USER_ID }, // Replace with actual user ID from auth
      orderBy: { createdAt: "desc" }, // Fetch most recent reminders first
      take: 10, // Limit to ten reminders for WhatsApp template
    });

    if (reminders.length === 0) {
      return NextResponse.json({ success: false, error: "No reminders found" }, { status: 404 });
    }

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
                  {
                    type: "text",
                    parameter_name: "text",
                    text: "Mobo", // User's name or greeting
                  },
                  {
                    type: "text",
                    parameter_name: "reminder_list",
                    text: reminders
                      .map((reminder) => {
                        const dateLabel = new Date(reminder.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        return `* ${reminder.title} (${dateLabel})`;
                      })
                      .join(" \r "),
                  },
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