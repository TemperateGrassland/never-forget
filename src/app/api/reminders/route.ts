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
        description: r.description ?? "N/A",
        userId: r.userId,
        isComplete: r.isComplete,
        createdAt: r.createdAt.toISOString(), // ✅ Convert Date to string
        updatedAt: r.updatedAt.toISOString(), // ✅ Convert Date to string
      })),
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save reminder in Prisma
    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        userId: user.id,
      },
    });

    // ✅ Broadcast reminder to WebSocket clients
    const channel = ably.channels.get("reminders");
    await channel.publish("newReminder", reminder);

    return NextResponse.json({ message: "Reminder saved", reminder });
  } catch (error) {
    console.error("Error saving reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}