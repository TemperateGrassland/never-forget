import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if prisma is properly imported
    console.log('Prisma client:', prisma ? 'loaded' : 'undefined');
    console.log('Prisma feedback model:', prisma?.feedback ? 'available' : 'not available');
    
    const session = await auth();
    const { type, feedback, turnstileToken } = await request.json();

    // Verify CAPTCHA token
    const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Validate input
    if (!type || !feedback) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' },
        { status: 400 }
      );
    }

    if (!['complement', 'criticism'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Save feedback to database
    const feedbackRecord = await prisma.feedback.create({
      data: {
        type: type.toUpperCase() as 'COMPLEMENT' | 'CRITICISM',
        message: feedback,
        userId: session?.user?.id || null,
        userAgent,
        ipAddress: process.env.NODE_ENV === 'production' ? ipAddress : null, // Only store in production
      },
    });

    console.log('Feedback saved:', {
      id: feedbackRecord.id,
      type: feedbackRecord.type,
      user: session?.user?.email || 'anonymous',
      timestamp: feedbackRecord.createdAt
    });

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully',
        id: feedbackRecord.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback. Please try again.' },
      { status: 500 }
    );
  }
}