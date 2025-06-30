"use client";

import React from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { useSession, signIn } from "next-auth/react";

export default function CheckoutButton() {
  const stripe = useStripe();
  const { data: session } = useSession();

  const handleCheckout = async () => {
    if (!session?.user?.email) {
      signIn();
      return;
    }
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: "price_1RYzNdF5x12WgiZJJjkYBZ8P",
        email: session.user.email,
      }),
    });
    const { sessionId } = await response.json();

    if (stripe) {
      stripe.redirectToCheckout({ sessionId });
    }
  };

  return (
    <button onClick={handleCheckout} className="bg-blue-500 text-white p-2 rounded">
      💚 Try it out
    </button>
  );
}

