import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import * as Ably from "ably";

const prisma = new PrismaClient();
const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        userId: r.userId,
        isComplete: r.isComplete,
        createdAt: r.createdAt.toISOString(), // ✅ Convert Date to string
        updatedAt: r.updatedAt.toISOString(), // ✅ Convert Date to string
        dueDate: r.dueDate ? r.dueDate.toISOString() : null, // ✅ Convert Date to string if not null
        frequency: r.frequency, // ✅ Include frequency field
        advanceNoticeDays: r.advanceNoticeDays, // ✅ Include advance notice days
      })),
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
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

    // Get the user ID from the session
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate and parse the dueDate if provided
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

    // Validate advanceNoticeDays
    if (advanceNoticeDays && (advanceNoticeDays < 1 || advanceNoticeDays > 7)) {
      return NextResponse.json({ error: "Advance notice days must be between 1 and 7" }, { status: 400 });
    }

    // Save reminder in Prisma
    const reminder = await prisma.reminder.create({
      data: {
        title,
        userId: user.id,
        dueDate: parsedDueDate,
        frequency,
        advanceNoticeDays: advanceNoticeDays || 1,
      },
    });

    // ✅ Broadcast reminder to WebSocket clients
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

    return NextResponse.json({
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
  } catch (error) {
    console.error("Error saving reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}