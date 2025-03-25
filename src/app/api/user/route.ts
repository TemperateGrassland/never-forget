import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
    } = await request.json();

    // Basic validation
    if (
      !email ||
      !password ||
      !firstName?.trim() ||
      !lastName?.trim()
    ) {
      return new Response(JSON.stringify({ message: "Missing required fields." }), {
        status: 400,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ message: "Invalid email format." }), {
        status: 400,
      });
    }

    // Validate phone number format (optional)
    if (phoneNumber && !/^\+?\d{10,15}$/.test(phoneNumber)) {
      return new Response(JSON.stringify({ message: "Invalid phone number." }), {
        status: 400,
      });
    }

    // Validate password strength
    if (
      password.length < 8 ||
      !/[0-9]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      return new Response(
        JSON.stringify({
          message:
            "Password must be at least 8 characters long and include a number and uppercase letter.",
        }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already in use." }), {
        status: 400,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return new Response(JSON.stringify({ message: "User created successfully.", user }), {
      status: 201,
    });
  } catch (err) {
    console.error("User creation error:", err);
    return new Response(
      JSON.stringify({ message: "Failed to create user." }),
      { status: 500 }
    );
  }
}