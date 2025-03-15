import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title ) {
      return NextResponse.json({ error: "Title and is required" }, { status: 400 });
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

    return NextResponse.json({ message: "Reminder saved", reminder });
  } catch (error) {
    console.error("Error saving reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}