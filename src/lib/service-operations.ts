// Service operations that need to bypass RLS
// Use these for background jobs, webhooks, and system operations

import { getRLSPrismaClient } from './rls';

/**
 * Send reminders job - needs to access all users' reminders
 * This bypasses RLS since it's a system operation
 */
export async function sendRemindersJob() {
  const prisma = getRLSPrismaClient();
  
  return await prisma.asServiceRole(async function() {
    // This function runs with service_role permissions, bypassing RLS
    const dueReminders = await this.reminder.findMany({
      where: {
        dueDate: {
          lte: new Date(),
        },
        isComplete: false,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            phoneNumber: true,
          }
        }
      }
    });

    // Process reminders...
    for (const reminder of dueReminders) {
      // Send notification logic here
      console.log(`Sending reminder: ${reminder.title} to ${reminder.User.email}`);
    }

    return dueReminders;
  });
}

/**
 * WhatsApp webhook processing - needs to access user data by phone number
 */
export async function processWhatsAppWebhook(phoneNumber: string, message: string) {
  const prisma = getRLSPrismaClient();
  
  return await prisma.asServiceRole(async function() {
    // Find user by phone number (bypasses RLS)
    const user = await this.user.findUnique({
      where: { phoneNumber },
      include: {
        reminders: {
          where: { isComplete: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });

    if (!user) {
      throw new Error(`User not found for phone number: ${phoneNumber}`);
    }

    // Process the message and update reminders as needed
    // This operation can access and modify user data as a service

    return user;
  });
}

/**
 * Analytics operations - needs to access aggregated data across all users
 */
export async function generateAnalytics() {
  const prisma = getRLSPrismaClient();
  
  return await prisma.asServiceRole(async function() {
    const stats = await Promise.all([
      // Total users
      this.user.count(),
      
      // Total reminders
      this.reminder.count(),
      
      // Completed reminders this month
      this.reminder.count({
        where: {
          isComplete: true,
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          }
        }
      }),
      
      // Active users (have reminders)
      this.user.count({
        where: {
          reminders: {
            some: {
              isComplete: false,
            }
          }
        }
      }),

      // Anonymous feedback count
      this.anonymousFeedback.count(),
    ]);

    return {
      totalUsers: stats[0],
      totalReminders: stats[1],
      completedThisMonth: stats[2],
      activeUsers: stats[3],
      anonymousFeedback: stats[4],
    };
  });
}

/**
 * Admin operations - for support and management
 */
export async function adminGetUserData(userEmail: string) {
  const prisma = getRLSPrismaClient();
  
  // First check if the requesting user is an admin
  // This should be called only from admin-authenticated routes
  
  return await prisma.asServiceRole(async function() {
    const user = await this.user.findUnique({
      where: { email: userEmail },
      include: {
        reminders: {
          orderBy: { createdAt: 'desc' },
        },
        feedback: true,
        accounts: true,
        // Don't include sessions for privacy
      }
    });

    return user;
  });
}

/**
 * Data export for GDPR compliance
 */
export async function exportUserData(userId: string) {
  const prisma = getRLSPrismaClient();
  
  return await prisma.asServiceRole(async function() {
    const userData = await this.user.findUnique({
      where: { id: userId },
      include: {
        reminders: true,
        feedback: true,
        flowResponses: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
            // Don't export tokens
          }
        },
        sessions: {
          select: {
            expires: true,
            // Don't export session tokens
          }
        }
      }
    });

    if (!userData) {
      throw new Error(`User ${userId} not found`);
    }

    // Return sanitized data export
    return {
      profile: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      reminders: userData.reminders,
      feedback: userData.feedback,
      flowResponses: userData.flowResponses.map(fr => ({
        flowName: fr.flowName,
        responses: fr.responses,
        createdAt: fr.createdAt,
        // Don't export phone numbers or metadata
      })),
      accounts: userData.accounts,
      exportedAt: new Date().toISOString(),
    };
  });
}

/**
 * Data deletion for GDPR compliance
 */
export async function deleteUserData(userId: string) {
  const prisma = getRLSPrismaClient();
  
  return await prisma.asServiceRole(async function() {
    // Delete in correct order to respect foreign key constraints
    await this.$transaction(async (tx) => {
      // Delete flow responses
      await tx.flowResponse.deleteMany({
        where: { userId }
      });

      // Delete feedback
      await tx.feedback.deleteMany({
        where: { userId }
      });

      // Delete reminders
      await tx.reminder.deleteMany({
        where: { userId }
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId }
      });

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId }
      });

      // Finally delete user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return { deleted: true, userId, deletedAt: new Date().toISOString() };
  });
}