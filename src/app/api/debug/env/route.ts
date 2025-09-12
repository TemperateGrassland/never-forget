import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET() {
  // Only allow admins to see this debug info
  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response!;
  }

  return NextResponse.json({
    hasLogtailToken: !!process.env.LOGTAIL_TOKEN,
    logtailTokenPrefix: process.env.LOGTAIL_TOKEN?.slice(0, 10) + '...',
    logLevel: process.env.LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}