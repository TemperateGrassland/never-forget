"use server";

import { auth } from "@/auth";
import { LoginButton } from "./components/ui/SignIn";
import AddReminderForm from "./components/ui/AddReminderForm";
import DashboardTable from "./components/ui/DashboardTable";
import CreateUser from "./components/ui/CreateUser";
// import { loadStripe } from "@stripe/stripe-js";

export default async function Page() {
  const session = await auth();

  return (
    <>
    <div className="bg-white min-h-screen">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-48 object-contain mt-0"
    />
      <h1 className="text-center font-agrandir text-3xl text-black">putting you on the front foot</h1>

      <div className="flex flex-col items-center mt-4">
        {session?.user ? (
          <>
            <div className="w-full max-w-5xl mx-auto p-4">

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
            <CreateUser />
          </>
        )}


      </div>
      </div>
    </>
  );
}