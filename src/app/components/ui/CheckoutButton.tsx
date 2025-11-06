"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

interface CheckoutButtonProps {
  planId?: 'free' | 'pro' | 'proYearly';
  children?: React.ReactNode;
  className?: string;
}

export default function CheckoutButton({ 
  planId = 'pro', 
  children, 
  className = "bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
}: CheckoutButtonProps) {
  const { data: session } = useSession();

  const handleCheckout = async () => {
    if (!session?.user?.email) {
      signIn();
      return;
    }

    // Don't create checkout for free plan
    if (planId === 'free') {
      // Just redirect to dashboard or show success message
      window.location.href = '/dashboard';
      return;
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan.priceId) {
      console.error('No price ID configured for plan:', planId);
      return;
    }

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: plan.priceId,
        email: session.user.email,
        planId: planId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Checkout error:', errorData);
      return;
    }

    const { url } = await response.json();

    if (url) {
      // Redirect to Stripe Checkout
      window.location.href = url;
    }
  };

  const plan = SUBSCRIPTION_PLANS[planId];
  const getDefaultContent = () => {
    if (planId === 'free') return 'Get Started Free';
    if (planId === 'proYearly') return `Upgrade to Pro - £${plan.price}/year`;
    return `Upgrade to Pro - ${plan.price}p/month`;
  };
  const defaultContent = getDefaultContent();

  return (
    <button 
      onClick={handleCheckout} 
      className={className}
      aria-label={`Subscribe to ${plan.name} plan`}
    >
      {children || defaultContent}
    </button>
  );
}

