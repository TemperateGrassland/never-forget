import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

// WebSocket event emitter function
function emitWebSocketEvent(event: string, data: any) {
  if (globalThis.io) {
    globalThis.io.emit(event, data);
  } else {
    console.warn("WebSocket server not initialized yet.");
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get the user ID from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { reminders: true }, // Fetch existing reminders for this user
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save new reminder in Prisma
    const newReminder = await prisma.reminder.create({
      data: {
        title,
        description,
        userId: user.id,
      },
    });

    // Fetch updated user data with the newly created reminder included
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { reminders: { orderBy: { createdAt: "asc" } } },
    });

    // Emit WebSocket event with full user + reminders data
    emitWebSocketEvent("newReminder", updatedUser);

    return NextResponse.json({ message: "Reminder saved", reminder: newReminder });
  } catch (error) {
    console.error("Error saving reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}