'use client';

import { useState, useEffect } from 'react';

type Subscription = {
  id: string;
  status: string;
  current_period_end: number;
  plan: {
    nickname: string;
    amount: number;
    interval: string;
  };
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch('/api/get-subscription');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleCancel = async (subscriptionId: string) => {
    const res = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });

    if (res.ok) {
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
    }
  };

  return (
    <div>
      <h1>Manage Your Subscription</h1>
      {subscriptions.length > 0 ? (
        subscriptions.map(sub => (
          <div key={sub.id}>
            <h2>{sub.plan.nickname}</h2>
            <p>Status: {sub.status}</p>
            <p>Renews on: {new Date(sub.current_period_end * 1000).toLocaleDateString()}</p>
            <button onClick={() => handleCancel(sub.id)}>Cancel Subscription</button>
          </div>
        ))
      ) : (
        <p>No active subscriptions found.</p>
      )}
    </div>
  );
}