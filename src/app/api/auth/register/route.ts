import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimits, getClientIP, createIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    const identifier = createIdentifier("ip", clientIP, "register");
    const rateLimitResult = await checkRateLimit(rateLimits.userRegistration, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      );
    }

    const { firstName, lastName, email, phoneNumber, turnstileToken } = await req.json();

    // Verify CAPTCHA token
    const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    if (!firstName || !lastName || !email || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { firstName, lastName, email, phoneNumber },
    });

    return NextResponse.json(
      { message: 'User registered', userId: user.id },
      { 
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
