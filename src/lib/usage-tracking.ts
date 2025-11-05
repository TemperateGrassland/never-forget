// Usage Tracking for Never Forget Subscription Plans
// Handles monthly delivery limits and usage reset logic

import { PrismaClient } from '@prisma/client';
import { getUserPlan, canSendReminder, getRemainingReminders } from './subscription-plans';

const prisma = new PrismaClient();

/**
 * Check if user's usage should be reset (new month)
 */
export function shouldResetUsage(lastReset: Date | null): boolean {
  if (!lastReset) return true;
  
  const now = new Date();
  const resetDate = new Date(lastReset);
  
  // Reset if it's a new month or year
  return (
    now.getMonth() !== resetDate.getMonth() || 
    now.getFullYear() !== resetDate.getFullYear()
  );
}

/**
 * Reset user's monthly usage count
 */
export async function resetUserUsage(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentMonthDeliveries: 0,
      lastUsageReset: new Date()
    }
  });
}

/**
 * Increment user's delivery count and reset if needed
 */
export async function incrementUserDeliveries(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentMonthDeliveries: true,
      lastUsageReset: true
    }
  });

  if (!user) throw new Error('User not found');

  // Reset usage if it's a new month
  if (shouldResetUsage(user.lastUsageReset)) {
    await resetUserUsage(userId);
    // After reset, increment to 1
    await prisma.user.update({
      where: { id: userId },
      data: { currentMonthDeliveries: 1 }
    });
  } else {
    // Just increment the count
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentMonthDeliveries: user.currentMonthDeliveries + 1
      }
    });
  }
}

/**
 * Check if user can send a reminder this month
 */
export async function checkUserCanSendReminder(userId: string): Promise<{
  canSend: boolean;
  currentCount: number;
  remainingCount: number | null;
  plan: 'free' | 'pro';
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      currentMonthDeliveries: true,
      lastUsageReset: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get user's plan
  const plan = getUserPlan(user.subscriptionStatus);
  const planType = user.subscriptionStatus === 'active' ? 'pro' : 'free';

  // Reset usage if needed
  let currentCount = user.currentMonthDeliveries;
  if (shouldResetUsage(user.lastUsageReset)) {
    await resetUserUsage(userId);
    currentCount = 0;
  }

  // Check if user can send
  const canSend = canSendReminder(currentCount, plan);
  const remainingCount = getRemainingReminders(currentCount, plan);

  let message: string | undefined;
  if (!canSend) {
    message = 'You\'ve reached your monthly limit of 3 birthday reminders. Upgrade to Pro for unlimited reminders at just 99p/month!';
  } else if (planType === 'free' && remainingCount !== null && remainingCount <= 1) {
    message = `You have ${remainingCount} birthday reminder${remainingCount === 1 ? '' : 's'} remaining this month. Upgrade to Pro for unlimited reminders!`;
  }

  return {
    canSend,
    currentCount,
    remainingCount,
    plan: planType,
    message
  };
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(userId: string): Promise<{
  currentMonthDeliveries: number;
  remainingDeliveries: number | null;
  plan: 'free' | 'pro';
  resetDate: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      currentMonthDeliveries: true,
      lastUsageReset: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const plan = getUserPlan(user.subscriptionStatus);
  const planType = user.subscriptionStatus === 'active' ? 'pro' : 'free';

  // Handle usage reset if needed
  let currentCount = user.currentMonthDeliveries;
  if (shouldResetUsage(user.lastUsageReset)) {
    await resetUserUsage(userId);
    currentCount = 0;
  }

  const remainingCount = getRemainingReminders(currentCount, plan);

  // Calculate next reset date (first day of next month)
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    currentMonthDeliveries: currentCount,
    remainingDeliveries: remainingCount,
    plan: planType,
    resetDate
  };
}

/**
 * Middleware function to check delivery limits before sending reminders
 */
export async function enforceDeliveryLimits(userId: string): Promise<boolean> {
  const check = await checkUserCanSendReminder(userId);
  
  if (!check.canSend) {
    console.log(`Delivery blocked for user ${userId}: ${check.message}`);
    return false;
  }

  // Increment the delivery count
  await incrementUserDeliveries(userId);
  
  console.log(`Delivery allowed for user ${userId}. Count: ${check.currentCount + 1}/${check.plan === 'free' ? '3' : '∞'}`);
  return true;
}