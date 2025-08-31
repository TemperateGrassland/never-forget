'use client';

import { useCanAccessAI } from '@/hooks/useSubscription';
import Link from 'next/link';

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGate({ 
  children, 
  fallback,
  showUpgradePrompt = true 
}: SubscriptionGateProps) {
  const { canAccess, loading, reason } = useCanAccessAI();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">AI Feature Locked</h3>
          <p className="text-sm text-gray-600 mb-3">{reason}</p>
          <Link 
            href="/subscriptions"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Upgrade Now
          </Link>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for feature gating
 */
export function withSubscriptionGate<P extends object>(
  Component: React.ComponentType<P>,
  gateProps?: Omit<SubscriptionGateProps, 'children'>
) {
  return function SubscriptionGatedComponent(props: P) {
    return (
      <SubscriptionGate {...gateProps}>
        <Component {...props} />
      </SubscriptionGate>
    );
  };
}