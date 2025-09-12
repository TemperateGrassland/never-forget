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
    console.log('=== BETTER STACK DEBUG START ===');
    console.log('Environment check:', {
      hasLogtailToken: !!process.env.LOGTAIL_TOKEN,
      tokenLength: process.env.LOGTAIL_TOKEN?.length,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL
    });

    // Test direct Logtail without Winston
    const { Logtail } = await import('@logtail/node');
    if (process.env.LOGTAIL_TOKEN) {
      console.log('Testing direct Logtail connection...');
      const directLogtail = new Logtail(process.env.LOGTAIL_TOKEN);
      
      try {
        await directLogtail.info('Direct Logtail test', {
          timestamp: new Date().toISOString(),
          source: 'direct-test',
          environment: 'production'
        });
        console.log('Direct Logtail test sent successfully');
      } catch (directError) {
        console.error('Direct Logtail failed:', directError);
      }
    }

    // Test Winston logger
    console.log('Testing Winston logger...');
    log.info('Winston logger test', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      testType: 'winston-test'
    });

    log.error('Winston error test', {
      level: 'error', 
      source: 'winston-test',
      timestamp: new Date().toISOString()
    });

    console.log('=== BETTER STACK DEBUG END ===');

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