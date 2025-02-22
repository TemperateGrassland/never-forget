"use client"; // Ensure this runs only on the client side

import { useEffect } from "react";
import Script from "next/script";

export default function StripeBuyButton() {
  useEffect(() => {
    console.log("Stripe Buy Button Loaded");
  }, []);

  return (
    <div>
      {/* Load Stripe's Buy Button Script */}
      <Script
        src="https://js.stripe.com/v3/buy-button.js"
        strategy="lazyOnload" // Ensures it loads after the page renders
      />

      {/* Stripe Buy Button Component */}
      <stripe-buy-button
        buy-button-id="buy_btn_1QvITQF5x12WgiZJOqux6bz0"
        publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} // Use env variable
      ></stripe-buy-button>
    </div>
  );
}