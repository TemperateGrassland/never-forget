import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== METRICS TEST ENDPOINT ===');
    
    // Check admin authentication
    const authResult = await checkAdminAuth();
    if (!authResult.isAdmin) {
      console.log('Auth failed:', authResult);
      return authResult.response!;
    }

    console.log('Admin auth passed');
    
    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    const reminderCount = await prisma.reminder.count();
    console.log('Reminder count:', reminderCount);
    
    return NextResponse.json({
      success: true,
      basicStats: {
        users: userCount,
        reminders: reminderCount
      },
      adminEmail: authResult.user?.email
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}