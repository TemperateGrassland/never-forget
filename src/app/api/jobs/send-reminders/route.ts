import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user with reminders
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user || user.reminders.length === 0) {
      return NextResponse.json({ success: false, error: "No reminders found" }, { status: 404 });
    }

    const { firstName, phoneNumber, reminders } = user;

    const reminderList = reminders
      .map((reminder) => {
        const dateLabel = new Date(reminder.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `* ${reminder.title} (${dateLabel})`;
      })
      .join(" \r ");

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
          to: phoneNumber,
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
                  { type: "text", parameter_name: "text", text: name },
                  { type: "text", parameter_name: "reminder_list", text: reminderList },
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