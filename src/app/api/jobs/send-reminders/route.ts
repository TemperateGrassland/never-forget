import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    // Template rotation based on day of month - easily expandable
    // const templates = ['daily_reminder', 'daily_reminder2', 'daily_reminder3'];
    // const dayIndex = new Date().getDate() % templates.length;
    // const templateName = templates[dayIndex];
    
    // Use single template for now
    const templateName = 'daily_reminder';
    
    log.info('Starting reminder job', { 
      templateName, 
      date: new Date().toISOString().split('T')[0] 
    });

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const users = await prisma.user.findMany({
      where: {
        phoneNumber: { not: null },
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

    // Filter reminders that should be sent today based on their advance notice settings
    const usersWithFilteredReminders = users.map(user => ({
      ...user,
      reminders: user.reminders.filter(reminder => {
        if (!reminder.dueDate) return false;
        
        const dueDate = new Date(reminder.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send reminder if today is within the advance notice period
        // For example: if due in 3 days and advanceNoticeDays is 5, send it
        // Or if due today and advanceNoticeDays is 1, send it
        return daysDiff >= 0 && daysDiff <= (reminder.advanceNoticeDays || 1);
      })
    })).filter(user => user.reminders.length > 0); // Only include users with reminders to send

    if (usersWithFilteredReminders.length === 0) {
      log.warn('No users found for reminder job');
      return NextResponse.json({ success: false, error: "No users found" }, { status: 404 });
    }

    log.info('Found users for reminder job', { userCount: usersWithFilteredReminders.length });
    let messagesSent = 0;

    for (const user of usersWithFilteredReminders) {
      const { firstName, phoneNumber, reminders } = user;

      if (!phoneNumber || reminders.length === 0) continue;

      // TODO trigger a message to be sent that prompts user to add a reminder

      const reminderList = reminders
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
      if (res.ok) {
        messagesSent++;
        log.info('WhatsApp message sent', {
          phoneNumber: phoneNumber.slice(-4), // Log last 4 digits for privacy
          reminderCount: reminders.length,
          messageId: result.messages?.[0]?.id
        });
      } else {
        log.error('WhatsApp message failed', {
          phoneNumber: phoneNumber.slice(-4),
          error: result.error?.message,
          errorCode: result.error?.code,
          reminderCount: reminders.length
        });
      }
    }

    log.info('Reminder job completed', { 
      totalUsers: usersWithFilteredReminders.length,
      messagesSent,
      successRate: `${Math.round((messagesSent / usersWithFilteredReminders.length) * 100)}%`
    });

    return NextResponse.json({ success: true, messagesSent });
  } catch (error) {
    log.error("WhatsApp reminder job failed", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}