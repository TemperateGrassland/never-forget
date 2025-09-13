import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get phone number from environment variable
    const phoneNumber = process.env.TEST_PHONE_NUMBER;
    
    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "TEST_PHONE_NUMBER environment variable not set" }, { status: 400 });
    }

    // Use single template (same as send-reminders)
    const templateName = 'daily_reminder';
    
    console.log(`Using template ${templateName}`);

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
      include: {
        reminders: {
          where: {
            dueDate: { not: null },
            isComplete: false,
          },
          orderBy: { dueDate: "asc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Filter reminders that should be sent today based on their advance notice settings
    const filteredReminders = user.reminders.filter(reminder => {
      if (!reminder.dueDate) return false;
      
      const dueDate = new Date(reminder.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder if today is within the advance notice period
      return daysDiff >= 0 && daysDiff <= (reminder.advanceNoticeDays || 1);
    });

    const { firstName } = user;

    if (filteredReminders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No reminders ready to be sent based on advance notice settings" 
      }, { status: 200 });
    }

    const reminderList = filteredReminders
      .map((reminder) => {
        return `* ${reminder.title}`;
      })
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
                  { type: "text", parameter_name: "text", text: firstName || "User" },
                  { type: "text", parameter_name: "reminder_list", text: reminderList },
                ],
              },
            ],
          },
        }),
      }
    );

    const result = await res.json();
    console.log('Full WhatsApp API response:', JSON.stringify(result, null, 2));
    
    if (res.ok) {
      return NextResponse.json({ success: true, messagesSent: 1 });
    } else {
      console.error(`Failed to send to ${phoneNumber}: ${result.error?.message}`);
      console.error('Full error details:', JSON.stringify(result.error, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: result.error?.message || "Failed to send message",
        errorDetails: result.error
      }, { status: res.status });
    }

  } catch (error) {
    console.error("WhatsApp single message error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}