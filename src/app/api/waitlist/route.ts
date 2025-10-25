import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimits, getClientIP, createIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Rate limiting check
  const clientIP = getClientIP(request);
  const identifier = createIdentifier("ip", clientIP, "waitlist");
  const rateLimitResult = await checkRateLimit(rateLimits.waitlist, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    );
  }

  const body = await request.json();
  const { email, turnstileToken } = body;

  // Verify CAPTCHA token
  const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
  if (!isValidCaptcha) {
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    await prisma.waitlistEntry.create({
      data: { email },
    });

    return NextResponse.json(
      { message: 'Added to waitlist' },
      { headers: createRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}