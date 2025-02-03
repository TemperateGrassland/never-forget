import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, authConfig } from "@/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { phoneNumber },
    });

    return NextResponse.json({ message: "Phone number updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating phone number:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}