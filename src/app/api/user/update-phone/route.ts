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

    const { phoneNumber } = await req.json();

    // Validate phone number format: must start with 44 and have 10 additional digits
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Remove all non-numeric characters for validation
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    // Must be exactly 12 digits starting with 44
    if (cleanedPhone.length !== 12) {
      return NextResponse.json({ error: "Phone number must be exactly 12 digits (44 + 10 digits)" }, { status: 400 });
    }
    
    if (!cleanedPhone.startsWith('44')) {
      return NextResponse.json({ error: "Phone number must start with 44" }, { status: 400 });
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