"use server";

import { auth } from "@/auth";
import { LogoutButton } from "@/app/components/ui/Signout";
import { LoginButton } from "../components/ui/SignIn";
import UpdatePhone from "../components/ui/AddPhoneNumber";
import SendMessage from "../components/ui/SendMessage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import dynamic from "next/dynamic";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

const CheckoutButton = dynamic(() => import("../components/ui/CheckoutButton"), { ssr: false });

export default async function DashboardPage() {

  const session  = await auth();
  

  if (!session) {
    return (
    <>
      <p>Loading...</p>
      <LoginButton />
    </>
    )
  }

  if (session) {
    return (
      <div>
        <h1>Welcome to the Dashboard</h1>
        <p>Signed in as {session?.user?.email || "Unknown User"}</p>
        <LogoutButton />
        <UpdatePhone />
        <SendMessage />
        <Elements stripe={stripePromise}>
          <CheckoutButton />
        </Elements>
      </div>
    )
  }

  return <link href="/api/auth/signin">Sign in</link>  
}