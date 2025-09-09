import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';

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

    // Daily breakdown for charts - using Prisma groupBy instead of raw SQL
    const dailySignupsRaw = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const dailyRemindersRaw = await prisma.reminder.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Process the data for charts
    const dailySignups = dailySignupsRaw.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count.id
    }));

    const dailyReminders = dailyRemindersRaw.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count.id
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
    console.error('Metrics API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}