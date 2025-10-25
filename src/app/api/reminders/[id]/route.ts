import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import Ably from "ably";
import { auth } from "@/auth";
import { rateLimits, getClientIP, createIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit';

const prisma = new PrismaClient();
const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function DELETE(req: NextRequest, params: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    
    // Rate limiting for reminder deletion
    if (session?.user?.id) {
      const identifier = createIdentifier("user", session.user.id, "reminders-delete");
      const rateLimitResult = await checkRateLimit(rateLimits.reminderCrud, identifier);

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many deletion requests. Please slow down.' },
          { 
            status: 429,
            headers: createRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }

    const id = (await params?.params).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid or missing Reminder ID" }, { status: 400 });
    }
  if (!id) {
    return NextResponse.json({ error: "Reminder ID is required" }, { status: 400 });
  }

  try {
    // Check if the reminder exists
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Delete the reminder
    await prisma.reminder.delete({ where: { id } });

    // ✅ Publish the deletion event to Ably
    const channel = ably.channels.get("reminders");
    await channel.publish("reminderDeleted", { id });

    return NextResponse.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  } catch (error) {
    console.error("Error in DELETE handler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, params: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    
    // Rate limiting for reminder updates
    if (session?.user?.id) {
      const identifier = createIdentifier("user", session.user.id, "reminders-update");
      const rateLimitResult = await checkRateLimit(rateLimits.reminderCrud, identifier);

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many update requests. Please slow down.' },
          { 
            status: 429,
            headers: createRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }

    const { title, dueDate, frequency, advanceNoticeDays } = await req.json();
    const id = (await params?.params).id;

    console.log(`reminder ${title} - dueDate ${dueDate} - frequency ${frequency} - advanceNoticeDays ${advanceNoticeDays} - id ${id}`)

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid or missing Reminder ID" }, { status: 400 });
    }

  // Validate and parse the dueDate
  let parsedDueDate: Date | null = null;
  if (dueDate) {
    try {
      // Handle both YYYY-MM-DD and full ISO string formats
      const dateString = dueDate.includes('T') ? dueDate : `${dueDate}T00:00:00.000Z`;
      parsedDueDate = new Date(dateString);
      
      // Validate the date is valid
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
  }

  // Validate advanceNoticeDays if provided
  if (advanceNoticeDays !== undefined && (advanceNoticeDays < 1 || advanceNoticeDays > 7)) {
    return NextResponse.json({ error: "Advance notice days must be between 1 and 7" }, { status: 400 });
  }

  try {
    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        title,
        dueDate: parsedDueDate,
        frequency,
        ...(advanceNoticeDays !== undefined && { advanceNoticeDays })
      },
    });

    if (!updatedReminder) {
      return NextResponse.json({ error: "Failed to update reminder" }, { status: 404 });
    }

    const channel = ably.channels.get("reminders");
    await channel.publish('reminderUpdated', updatedReminder);

    return NextResponse.json({ updatedReminder });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  } catch (error) {
    console.error("Error in PATCH handler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}