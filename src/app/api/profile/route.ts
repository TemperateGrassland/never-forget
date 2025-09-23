import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma"; // Ensure Prisma is set up
import { log } from "@/lib/logger";

export async function GET(req: Request) {
  const startTime = Date.now();
  const session = await auth();
  
  log.apiRequest('GET', '/api/profile', session?.user?.id);

  if (!session?.user) {
    log.apiResponse('GET', '/api/profile', 401, Date.now() - startTime);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.email) {
    return NextResponse.json({ error: "User email is missing" }, { status: 400 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.email) {
    return NextResponse.json({ error: "User email is missing" }, { status: 400 });
  }

  let requestBody: { firstName?: string; lastName?: string; phoneNumber?: string };
  try {
    requestBody = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { firstName, lastName, phoneNumber } = requestBody;

  // Validate and check if phoneNumber is being updated
  if (phoneNumber) {
    // Validate phone number format: must start with 44 and have 10 additional digits
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    // Must be exactly 12 digits starting with 44
    if (cleanedPhone.length !== 12) {
      return NextResponse.json({ error: "Phone number must be exactly 12 digits (44 + 10 digits)" }, { status: 400 });
    }
    
    if (!cleanedPhone.startsWith('44')) {
      return NextResponse.json({ error: "Phone number must start with 44" }, { status: 400 });
    }

    // Check if phone number already exists
    const existingUserWithPhone = await prisma.user.findFirst({
      where: {
        phoneNumber,
        email: { not: session.user.email }, // Exclude current user
      },
    });

    if (existingUserWithPhone) {
      return NextResponse.json(
        { error: "Phone number is already in use by another user" },
        { status: 409 }
      );
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { firstName, lastName, phoneNumber },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}