import { Elements } from "@stripe/react-stripe-js";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import CheckoutButton from "../components/ui/CheckoutButton";

export default function DailyReminder() {
    return (
    <div className="w-full max-w-5xl mx-auto p-4">

        {/* <h1 className="text-black flex flex-col items-center">daily reminders to your Whatsapp</h1> */}

              <div className="mt-6">
                <AddReminderForm />
              </div>
              
              <div className="mt-6">
                <DashboardTable />
              </div>

              

              {/* Stripe Checkout (Currently Disabled) */}
              {/* <Elements stripe={stripePromise}>
                <CheckoutButton />
              </Elements> */}
            </div>
    );
}