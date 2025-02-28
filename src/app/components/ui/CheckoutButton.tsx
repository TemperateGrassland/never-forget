import React from "react";
import { useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutButton: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleCheckout = async () => {
    const response = await fetch("/api/checkout", { method: "POST" });
    const { sessionId } = await response.json();

    if (stripe) {
      stripe.redirectToCheckout({ sessionId });
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <button onClick={handleCheckout} className="bg-blue-500 text-white p-2 rounded">
        Checkout
      </button>
    </Elements>
  );
};

export default CheckoutButton;