"use client";

import React from "react";
import { useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

export default function CheckoutButton() {
  const stripe = useStripe();

  const handleCheckout = async () => {
    const response = await fetch("/api/checkout", { method: "POST" });
    const { sessionId } = await response.json();

    if (stripe) {
      stripe.redirectToCheckout({ sessionId });
    }
  };

  return (
    <button onClick={handleCheckout} className="bg-blue-500 text-white p-2 rounded">
      Checkout
    </button>
  );
};

