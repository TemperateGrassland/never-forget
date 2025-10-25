import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimits, getClientIP, createIdentifier, checkRateLimit, createRateLimitHeaders, createRateLimitErrorMessage } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const identifier = createIdentifier("ip", clientIP, "user-create");
    const rateLimitResult = await checkRateLimit(rateLimits.userRegistration, identifier);

    if (!rateLimitResult.success) {
      const errorMessage = createRateLimitErrorMessage(
        "account creation attempts",
        rateLimitResult.reset,
        rateLimitResult.limit,
        "hour"
      );
      
      return new Response(
        JSON.stringify({ message: errorMessage }),
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      );
    }

    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      turnstileToken,
    } = await request.json();

    // Verify CAPTCHA token
    const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
    if (!isValidCaptcha) {
      return new Response(JSON.stringify({ message: "CAPTCHA verification failed." }), {
        status: 400,
      });
    }

    // Basic validation
    if (
      !email ||
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already in use." }), {
        status: 400,
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return new Response(
      JSON.stringify({ message: "User created successfully - you can now set some reminders", user }),
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    );
  } catch (err) {
    console.error("User creation error:", err);
    return new Response(
      JSON.stringify({ message: "Failed to create user." }),
      { status: 500 }
    );
  }
}