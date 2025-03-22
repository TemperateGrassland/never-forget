"use server";

import { auth } from "@/auth";
import { LoginButton } from "./components/ui/SignIn";
import AddReminderForm from "./components/ui/AddReminderForm";
import DashboardTable from "./components/ui/DashboardTable";
// import { loadStripe } from "@stripe/stripe-js";

export default async function Page() {
  const session = await auth();

  return (
    <>
      <h1 className="text-3xl font-bold text-center mt-4">
        Improve your life, use <span className="italic underline">Never Forget</span>
      </h1>

      <div className="flex flex-col items-center mt-4">
        {session?.user ? (
          <>
            <p className="text-lg text-green-600 font-semibold bg-green-100 px-4 py-2 rounded-md shadow-md">
              ✅ You are signed in: {session?.user?.email}
            </p>

            {/* ✅ Show Dashboard & Features ONLY if Signed In */}
            <div className="container mx-auto p-6">

              <div className="mt-6">
                <DashboardTable />
              </div>

              <div className="mt-6">
                <AddReminderForm />
              </div>

              {/* Stripe Checkout (Currently Disabled) */}
              {/* <Elements stripe={stripePromise}>
                <CheckoutButton />
              </Elements> */}
            </div>
          </>
        ) : (
          <>
            {/* ❌ User is NOT signed in → Show only login prompt */}
            <p className="text-lg text-red-600 font-semibold bg-red-100 px-4 py-2 rounded-md shadow-md">
              🙈 You are not signed in
            </p>
            <LoginButton />
          </>
        )}
      </div>
    </>
  );
}