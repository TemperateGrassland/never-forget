import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import Ably from "ably";

const prisma = new PrismaClient();
const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function DELETE(req: NextRequest, params: { params: Promise<{ id: string }> }) {
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
}

export async function PATCH(req: NextRequest, params: { params: Promise<{ id: string }> }) {
  const { title, dueDate, frequency } = await req.json();
  const id = (await params?.params).id;

  console.log(`reminder ${title} - dueDate ${dueDate} - frequency ${frequency} - id ${id}`)

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

  try {
    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        title,
        dueDate: parsedDueDate,
        frequency
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
}