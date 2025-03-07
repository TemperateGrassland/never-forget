import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma"; // Ensure Prisma is set up

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
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

  const { firstName, phoneNumber } = await req.json();

  if (!session.user.email) {
    return NextResponse.json({ error: "User email is missing" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { firstName, phoneNumber },
  });

  return NextResponse.json(updatedUser);
}