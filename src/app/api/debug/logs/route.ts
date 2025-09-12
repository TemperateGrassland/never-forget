import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { log } from '@/lib/logger';

export async function GET() {
  // Only allow admins to test logging
  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response!;
  }

  try {
    // Test different log levels
    log.info('Production log test', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      testType: 'manual'
    });

    log.warn('Production warning test', {
      level: 'warning',
      source: 'debug endpoint'
    });

    log.error('Production error test', {
      level: 'error', 
      source: 'debug endpoint',
      stack: 'Test stack trace'
    });

    // Also test console logs to compare
    console.log('Console log test - should appear in Vercel logs');
    console.error('Console error test - should appear in Vercel logs');

    return NextResponse.json({
      success: true,
      message: 'Test logs sent',
      hasLogtailToken: !!process.env.LOGTAIL_TOKEN,
      logLevel: process.env.LOG_LEVEL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug logging failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}