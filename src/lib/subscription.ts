import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Date | null;
  subscriptionPlanId?: string | null;
}

/**
 * Check if a user has an active subscription
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionStatus> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        // subscriptionEndsAt: true,
        // subscriptionPlanId: true,
      },
    });

    if (!user) {
      return { hasActiveSubscription: false };
    }

    // Check if subscription is active and not expired
    const hasActiveSubscription = 
      user.subscriptionStatus === 'active' 
      // && 
      // !!user.subscriptionPlanId &&
      // (!user.subscriptionEndsAt || user.subscriptionEndsAt > new Date());

    return {
      hasActiveSubscription,
      // subscriptionStatus: user.subscriptionStatus || undefined,
      // subscriptionEndsAt: user.subscriptionEndsAt,
      // subscriptionPlanId: user.subscriptionPlanId || undefined,
    };
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return { hasActiveSubscription: false };
  }
}

/**
 * Middleware function to require active subscription for AI features
 */
export async function requireActiveSubscription(userId: string): Promise<{ success: true } | { success: false; error: string }> {
  const subscription = await checkUserSubscription(userId);
  
  if (!subscription.hasActiveSubscription) {
    return {
      success: false,
      error: 'This feature requires an active subscription. Please subscribe to continue using AI-powered reminders.'
    };
  }

  return { success: true };
}

/**
 * Check subscription by phone number (for WhatsApp integration)
 */
export async function checkSubscriptionByPhone(phoneNumber: string): Promise<SubscriptionStatus> {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionPlanId: true,
      },
    });

    if (!user) {
      return { hasActiveSubscription: false };
    }

    return checkUserSubscription(user.id);
  } catch (error) {
    console.error('Error checking subscription by phone:', error);
    return { hasActiveSubscription: false };
  }
}

/**
 * Get user subscription details for display
 */
export async function getUserSubscriptionDetails(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionPlanId: true,
        subscriptionStartedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting user subscription details:', error);
    return null;
  }
}