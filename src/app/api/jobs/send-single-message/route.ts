import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export async function GET() {
  const jobStartTime = new Date();
  const jobId = `single-message-job-${jobStartTime.toISOString()}`;
  
  try {
    // Get phone number from environment variable
    const phoneNumber = process.env.TEST_PHONE_NUMBER;
    
    if (!phoneNumber) {
      log.error('❌ SINGLE MESSAGE JOB FAILED: Missing TEST_PHONE_NUMBER', { jobId });
      return NextResponse.json({ success: false, error: "TEST_PHONE_NUMBER environment variable not set" }, { status: 400 });
    }

    // Use single template (same as send-reminders)
    const templateName = 'daily_reminder';
    
    log.info('🚀 SINGLE MESSAGE JOB STARTED', {
      jobId,
      templateName,
      phoneNumber: phoneNumber.slice(-4),
      startTime: jobStartTime.toISOString()
    });

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
      
      // Ignore DAILY reminders (legacy) - use string comparison to handle existing data
      if ((reminder.frequency as string) === 'DAILY') return false;
      
      const dueDate = new Date(reminder.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder if today is within the advance notice period
      return daysDiff >= 0 && daysDiff <= (reminder.advanceNoticeDays || 1);
    });

    const { firstName } = user;

    if (filteredReminders.length === 0) {
      const jobEndTime = new Date();
      const duration = jobEndTime.getTime() - jobStartTime.getTime();
      
      log.warn('⚠️ SINGLE MESSAGE JOB COMPLETED: No reminders to send', {
        jobId,
        duration: `${duration}ms`,
        result: 'NO_REMINDERS'
      });
      
      return NextResponse.json({ 
        success: false, 
        jobId,
        error: "No reminders ready to be sent based on advance notice settings",
        duration,
        result: 'NO_REMINDERS'
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
    log.info('Full WhatsApp API response', { 
      jobId,
      response: JSON.stringify(result, null, 2) 
    });
    
    if (res.ok) {
      const jobEndTime = new Date();
      const duration = jobEndTime.getTime() - jobStartTime.getTime();
      
      log.info('✅ SINGLE MESSAGE JOB COMPLETED SUCCESSFULLY', {
        jobId,
        duration: `${duration}ms`,
        phoneNumber: phoneNumber.slice(-4),
        reminderCount: filteredReminders.length,
        messageId: result.messages?.[0]?.id,
        result: 'SUCCESS'
      });
      
      return NextResponse.json({ 
        success: true, 
        jobId,
        messagesSent: 1,
        reminderCount: filteredReminders.length,
        duration,
        result: 'SUCCESS'
      });
    } else {
      const jobEndTime = new Date();
      const duration = jobEndTime.getTime() - jobStartTime.getTime();
      
      log.error('❌ SINGLE MESSAGE JOB FAILED: WhatsApp API error', {
        jobId,
        duration: `${duration}ms`,
        phoneNumber: phoneNumber.slice(-4),
        error: result.error?.message,
        errorCode: result.error?.code,
        fullResponse: JSON.stringify(result, null, 2),
        result: 'WHATSAPP_ERROR'
      });
      
      return NextResponse.json({ 
        success: false, 
        jobId,
        error: result.error?.message || "Failed to send message",
        errorDetails: result.error,
        duration,
        result: 'WHATSAPP_ERROR'
      }, { status: res.status });
    }

  } catch (error) {
    const jobEndTime = new Date();
    const duration = jobEndTime.getTime() - jobStartTime.getTime();
    
    log.error('💥 SINGLE MESSAGE JOB FAILED: Unexpected error', {
      jobId,
      duration: `${duration}ms`,
      error: (error as Error).message,
      stack: (error as Error).stack,
      result: 'ERROR'
    });
    
    return NextResponse.json({ 
      success: false, 
      jobId,
      error: (error as Error).message,
      duration,
      result: 'ERROR'
    }, { status: 500 });
  }
}