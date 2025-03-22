"use server";

import { auth } from "@/auth";
import { LogoutButton } from "@/app/components/ui/Signout";
import { LoginButton } from "../components/ui/SignIn";
import UpdatePhone from "../components/ui/AddPhoneNumber";
import SendMessage from "../components/ui/SendMessage";
import ProfileButton from "../components/ui/ProfileButton";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import { loadStripe } from "@stripe/stripe-js";

// Load Stripe client-side key
// const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

export default async function DashboardPage() {
  const session = await auth();

  // If user is not authenticated, show login option
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Hey **maybe** stranger, come join the party!</p>
        <LoginButton />
      </div>
    );
  }

  // // Fetch reminders for the authenticated user
  // const reminders: Reminder[] = await prisma.reminder
  //   .findMany({
  //     where: { userId: session.user.id }, // Fetch only reminders for the logged-in user
  //     orderBy: { createdAt: "desc" },
  //   })
  //   .then((reminders) =>
  //     reminders.map((reminder) => ({
  //       ...reminder,
  //       createdAt: reminder.createdAt, // Convert Date to String
  //       updatedAt: reminder.updatedAt,
  //     }))
  //   );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
      <p className="text-lg">Signed in as {session?.user?.email || "Unknown User"}</p>

      {/* Logout and Profile Management */}
      <div className="mt-4 flex space-x-4">
        <LogoutButton />
      </div>

      {/* Reminders Table */}
      <div className="mt-6">
        <DashboardTable />
      </div>

      {/* Add Reminder Form */}
      <div className="mt-6">
        <AddReminderForm />
      </div>

      {/* Stripe Checkout (Currently Disabled) */}
      {/* <Elements stripe={stripePromise}>
        <CheckoutButton />
      </Elements> */}
    </div>
  );
}