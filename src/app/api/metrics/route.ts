import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Check admin authentication first
  const authResult = await checkAdminAuth();
  if (!authResult.isAdmin) {
    return authResult.response!;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Parallel queries for better performance
    const [
      totalUsers,
      totalReminders,
      newSignups,
      newReminders,
      activeUsers,
      completedReminders,
      subscriptionStats
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total reminders  
      prisma.reminder.count(),
      
      // New signups in period
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // New reminders in period
      prisma.reminder.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Active users (users with reminders)
      prisma.user.count({
        where: {
          reminders: {
            some: {}
          }
        }
      }),
      
      // Completed reminders in period
      prisma.reminder.count({
        where: {
          isComplete: true,
          updatedAt: {
            gte: startDate
          }
        }
      }),
      
      // Subscription stats
      prisma.user.groupBy({
        by: ['subscriptionStatus'],
        _count: {
          subscriptionStatus: true
        }
      })
    ]);

    // Daily breakdown for charts - using raw SQL to properly group by date
    const dailySignupsRaw = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "User" 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    ` as Array<{ date: Date; count: bigint }>;

    const dailyRemindersRaw = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Reminder" 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    ` as Array<{ date: Date; count: bigint }>;

    // Process the data for charts
    const dailySignups = dailySignupsRaw.map(item => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count)
    }));

    const dailyReminders = dailyRemindersRaw.map(item => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count)
    }));

    // Reminder frequency distribution
    const reminderFrequencies = await prisma.reminder.groupBy({
      by: ['frequency'],
      _count: {
        frequency: true
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalReminders,
        newSignups,
        newReminders,
        activeUsers,
        completedReminders
      },
      subscriptions: subscriptionStats.reduce((acc, curr) => {
        acc[curr.subscriptionStatus || 'none'] = curr._count.subscriptionStatus;
        return acc;
      }, {} as Record<string, number>),
      charts: {
        dailySignups,
        dailyReminders
      },
      reminderFrequencies: reminderFrequencies.reduce((acc, curr) => {
        acc[curr.frequency] = curr._count.frequency;
        return acc;
      }, {} as Record<string, number>),
      period: parseInt(period)
    });

  } catch (error) {
    log.error('Metrics API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminUser: authResult.user?.email
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}