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
    <div className="pt-28 p-4">
      <h1 className="text-3xl font-bold mb-6 text-black">Manage Your Subscription</h1>
      {subscriptions.length > 0 ? (
        subscriptions.map(sub => (
          <div key={sub.id} className="bg-white p-6 rounded-lg shadow-md mb-4 border">
            <h2 className="text-xl font-semibold text-black mb-2">{sub.plan.nickname}</h2>
            <p className="text-gray-600 mb-1">Status: {sub.status}</p>
            <p className="text-gray-600 mb-4">Renews on: {new Date(sub.current_period_end * 1000).toLocaleDateString()}</p>
            <button 
              onClick={() => handleCancel(sub.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No active subscriptions found.</p>
      )}
    </div>
  );
}