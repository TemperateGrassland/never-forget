'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string;
  subscriptionPlanId?: string;
  loading: boolean;
  error?: string;
}

export function useSubscription(): SubscriptionData {
  const { data: session, status } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    hasActiveSubscription: false,
    loading: true,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setSubscriptionData({
        hasActiveSubscription: false,
        loading: false,
        error: 'Not authenticated',
      });
      return;
    }

    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/get-subscription');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        
        // Check if subscription is active and not expired
        const hasActiveSubscription = 
          data.subscriptionStatus === 'active' && 
          data.subscriptionPlanId &&
          (!data.subscriptionEndsAt || new Date(data.subscriptionEndsAt) > new Date());

        setSubscriptionData({
          hasActiveSubscription,
          subscriptionStatus: data.subscriptionStatus,
          subscriptionEndsAt: data.subscriptionEndsAt,
          subscriptionPlanId: data.subscriptionPlanId,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscriptionData({
          hasActiveSubscription: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchSubscription();
  }, [session, status]);

  return subscriptionData;
}

/**
 * Hook to check if user can access AI features
 */
export function useCanAccessAI(): { canAccess: boolean; loading: boolean; reason?: string } {
  const subscription = useSubscription();
  
  if (subscription.loading) {
    return { canAccess: false, loading: true };
  }
  
  if (!subscription.hasActiveSubscription) {
    return { 
      canAccess: false, 
      loading: false, 
      reason: 'AI features require an active subscription' 
    };
  }
  
  return { canAccess: true, loading: false };
}