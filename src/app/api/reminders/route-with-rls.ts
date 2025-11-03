// Example of reminders route updated to use RLS
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import * as Ably from "ably";
import { log } from "@/lib/logger";
import { rateLimits, getClientIP, createIdentifier, checkRateLimit, createRateLimitHeaders, createRateLimitErrorMessage } from '@/lib/ratelimit';
import { withRLSContext, getUserIdFromSession } from '@/lib/rls';

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    
    // Rate limiting for authenticated users
    if (userId) {
      const identifier = createIdentifier("user", userId, "reminders-get");
      const rateLimitResult = await checkRateLimit(rateLimits.general, identifier);

      if (!rateLimitResult.success) {
        const errorMessage = createRateLimitErrorMessage(
          "reminder requests",
          rateLimitResult.reset,
          rateLimitResult.limit,
          "minute"
        );
        
        return NextResponse.json(
          { error: errorMessage },
          { 
            status: 429,
            headers: createRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }
    
    log.apiRequest('GET', '/api/reminders', userId);
    
    if (!session || !userId) {
      log.apiResponse('GET', '/api/reminders', 401, Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use RLS-enabled Prisma client
    const reminders = await withRLSContext(userId, async (prisma) => {
      // With RLS, we don't need to filter by userId - the database handles it
      // This query will automatically only return reminders for the current user
      return await prisma.reminder.findMany({
        orderBy: { createdAt: "desc" },
      });
    });

    const response = NextResponse.json({
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        userId: r.userId,
        isComplete: r.isComplete,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        frequency: r.frequency,
        advanceNoticeDays: r.advanceNoticeDays,
      })),
    });
    
    log.apiResponse('GET', '/api/reminders', 200, Date.now() - startTime, { reminderCount: reminders.length });
    return response;
  } catch (error) {
    log.error("Error fetching reminders", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    log.apiResponse('GET', '/api/reminders', 500, Date.now() - startTime);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    
    // Rate limiting for reminder creation
    if (userId) {
      const identifier = createIdentifier("user", userId, "reminders-create");
      const rateLimitResult = await checkRateLimit(rateLimits.reminderCrud, identifier);

      if (!rateLimitResult.success) {
        const errorMessage = createRateLimitErrorMessage(
          "reminder creation requests",
          rateLimitResult.reset,
          rateLimitResult.limit,
          "minute"
        );
        
        return NextResponse.json(
          { error: errorMessage },
          { 
            status: 429,
            headers: createRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }
    
    log.apiRequest('POST', '/api/reminders', userId);
    
    if (!session || !userId) {
      log.apiResponse('POST', '/api/reminders', 401, Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body === 'string' ? body : body.title;
    const dueDate = typeof body === 'object' ? body.dueDate : null;
    const frequency = typeof body === 'object' ? body.frequency : undefined;
    const advanceNoticeDays = typeof body === 'object' ? body.advanceNoticeDays : 1;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate and parse the dueDate if provided
    let parsedDueDate: Date | null = null;
    if (dueDate) {
      try {
        const dateString = dueDate.includes('T') ? dueDate : `${dueDate}T00:00:00.000Z`;
        parsedDueDate = new Date(dateString);
        
        if (isNaN(parsedDueDate.getTime())) {
          return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
    }

    // Validate advanceNoticeDays
    if (advanceNoticeDays && (advanceNoticeDays < 1 || advanceNoticeDays > 7)) {
      return NextResponse.json({ error: "Advance notice days must be between 1 and 7" }, { status: 400 });
    }

    // Use RLS-enabled Prisma client
    const reminder = await withRLSContext(userId, async (prisma) => {
      // With RLS, we can safely create reminders without explicit userId filtering
      // The database will ensure the reminder is associated with the correct user
      return await prisma.reminder.create({
        data: {
          title,
          userId, // Still need to provide userId for the foreign key
          dueDate: parsedDueDate,
          frequency,
          advanceNoticeDays: advanceNoticeDays || 1,
        },
      });
    });

    // Broadcast reminder to WebSocket clients
    const channel = ably.channels.get("reminders");
    await channel.publish("newReminder", {
      id: reminder.id,
      title: reminder.title,
      userId: reminder.userId,
      isComplete: reminder.isComplete,
      createdAt: reminder.createdAt.toISOString(),
      updatedAt: reminder.updatedAt.toISOString(),
      dueDate: reminder.dueDate ? reminder.dueDate.toISOString() : null,
      frequency: reminder.frequency,
      advanceNoticeDays: reminder.advanceNoticeDays,
    });

    const response = NextResponse.json({
      message: "Reminder saved",
      reminder: {
        id: reminder.id,
        title: reminder.title,
        userId: reminder.userId,
        isComplete: reminder.isComplete,
        createdAt: reminder.createdAt.toISOString(),
        updatedAt: reminder.updatedAt.toISOString(),
        dueDate: reminder.dueDate ? reminder.dueDate.toISOString() : null,
        frequency: reminder.frequency,
        advanceNoticeDays: reminder.advanceNoticeDays,
      },
    });
    
    log.userAction('reminder_created', userId, { reminderTitle: title, frequency });
    log.apiResponse('POST', '/api/reminders', 201, Date.now() - startTime);
    return response;
  } catch (error) {
    log.error("Error saving reminder", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    log.apiResponse('POST', '/api/reminders', 500, Date.now() - startTime);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}