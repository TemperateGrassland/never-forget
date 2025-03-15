"use server";

import { auth } from "@/auth";
import { LogoutButton } from "@/app/components/ui/Signout";
import { LoginButton } from "../components/ui/SignIn";
import UpdatePhone from "../components/ui/AddPhoneNumber";
import SendMessage from "../components/ui/SendMessage";
import CheckoutButton from "../components/ui/CheckoutButton";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ProfileButton from "../components/ui/ProfileButton";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import prisma from "@/lib/prisma";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);




export default async function DashboardPage() {

  const session  = await auth();
  

  if (!session) {
    return (
    <>
      <p>Hey **maybe** stranger, come join the party </p>
      <LoginButton />
    </>
    )
  }

  const reminders = (await prisma.reminder.findMany({
    orderBy: { createdAt: "desc" },
  })).map(reminder => ({
    ...reminder,
    createdAt: reminder.createdAt.toISOString(), // Convert Date → String
    updatedAt: reminder.updatedAt.toISOString(), // Convert Date → String
  }));

  if (session) {
    return (
      <div>
        <h1>Welcome to the Dashboard</h1>
        <p>Signed in as {session?.user?.email || "Unknown User"}</p>
        <LogoutButton />
        <UpdatePhone />
        <SendMessage />
        <ProfileButton />
        {/* Display the reminders using DashboardTable */}
        <DashboardTable reminders={reminders} />

        {/* Add Reminder Form */}
        <div className="mt-6">
          <AddReminderForm />
        </div>
        {/* <Elements stripe={stripePromise}>
          <CheckoutButton />
        </Elements> */}
      </div>
    )
  }

  return <link href="/api/auth/signin">Sign in</link>  
}