// Subscription Plans Configuration for Never Forget
// Defines the Free and Pro plans with usage limits and pricing

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GBP',
    interval: 'month',
    priceId: null, // No Stripe price ID for free plan
    features: [
      '3 birthday reminders per month',
      'Basic WhatsApp notifications',
      'Simple reminder management'
    ],
    limits: {
      monthlyReminderDeliveries: 3,
      totalReminders: null, // No limit on creating reminders
      advancedFeatures: false
    },
    description: 'Perfect for trying out Never Forget with a few important birthdays',
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 0.99,
    currency: 'GBP',
    interval: 'month',
    priceId: 'price_1SQO9pF5x12WgiZJIwOmSWmX',
    features: [
      'Unlimited birthday reminders',
      'Advanced WhatsApp notifications',
      'Full reminder management',
      'Priority support',
      'Advanced scheduling'
    ],
    limits: {
      monthlyReminderDeliveries: null, // Unlimited
      totalReminders: null, // Unlimited
      advancedFeatures: true
    },
    description: 'Full access to Never Forget for just 99p per month',
    popular: false
  },
  proYearly: {
    id: 'proYearly',
    name: 'Pro',
    price: 9.99,
    currency: 'GBP',
    interval: 'year',
    priceId: 'price_1SQOAHF5x12WgiZJ1QokEbnx',
    features: [
      'Unlimited birthday reminders',
      'Advanced WhatsApp notifications',
      'Full reminder management',
      'Priority support',
      'Advanced scheduling',
      'Save £2.89 per year'
    ],
    limits: {
      monthlyReminderDeliveries: null, // Unlimited
      totalReminders: null, // Unlimited
      advancedFeatures: true
    },
    description: 'Best value - Full access for the whole year',
    popular: true
  }
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[PlanId];

/**
 * Get plan details by ID
 */
export function getPlan(planId: PlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Get user's effective plan based on subscription status
 */
export function getUserPlan(subscriptionStatus: string | null): SubscriptionPlan {
  if (subscriptionStatus === 'active') {
    return SUBSCRIPTION_PLANS.pro;
  }
  return SUBSCRIPTION_PLANS.free;
}

/**
 * Check if user can send more reminders this month
 */
export function canSendReminder(
  currentMonthDeliveries: number, 
  userPlan: SubscriptionPlan
): boolean {
  const limit = userPlan.limits.monthlyReminderDeliveries;
  
  // No limit for pro users (null means unlimited)
  if (limit === null) {
    return true;
  }
  
  // Check if under the monthly limit
  return currentMonthDeliveries < limit;
}

/**
 * Get remaining reminders for the month
 */
export function getRemainingReminders(
  currentMonthDeliveries: number,
  userPlan: SubscriptionPlan
): number | null {
  const limit = userPlan.limits.monthlyReminderDeliveries;
  
  // Unlimited for pro users
  if (limit === null) {
    return null;
  }
  
  return Math.max(0, limit - currentMonthDeliveries);
}

/**
 * Format price for display
 */
export function formatPrice(plan: SubscriptionPlan): string {
  if (plan.price === 0) {
    return 'Free';
  }
  
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: plan.currency,
    minimumFractionDigits: 2
  });
  
  return `${formatter.format(plan.price)}/${plan.interval}`;
}

/**
 * Get upgrade message for free users
 */
export function getUpgradeMessage(remainingReminders: number | null): string {
  if (remainingReminders === null) {
    return ''; // Pro user, no message needed
  }
  
  if (remainingReminders === 0) {
    return 'You\'ve reached your monthly limit of 3 birthday reminders. Upgrade to Pro for unlimited reminders at just 99p/month!';
  }
  
  return `You have ${remainingReminders} birthday reminder${remainingReminders === 1 ? '' : 's'} remaining this month. Upgrade to Pro for unlimited reminders!`;
}