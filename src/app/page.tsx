import OnboardingToast from "./components/ui/OnboardingToast";
import Demo from "./components/ui/Demo";
import { WaitlistButton } from "./components/ui/Waitlist";
import CheckoutButton from "./components/ui/CheckoutButton";
import StripeProvider from "./components/ui/StripeProvider";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Daily Reminders via Whatsapp | Never Forget",
  description: "Set and manage daily WhatsApp reminders with Never Forget.",
};

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    redirect("/daily-reminder");
  }

  return (
    <>
    <div className="w-full min-h-screen flex justify-center">
      <div className="flex flex-col items-center text-black px-4 sm:px-8 lg:px-16 max-w-screen-2xl w-full mx-auto pb-16 text-center">
        <h1 className="w-full max-w-3xl mb-6 text-4xl sm:text-2xl lg:text-3xl font-agrandir text-center">
          Get daily nudges to stay on track — straight to your WhatsApp.
        </h1>
        <h2>Tiny reminders. Big wins.</h2>
        <div className="w-full flex justify-center mb-4 sm:mb-6">
          <div className="w-full max-w-md">
            <WaitlistButton />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full mt-8">
          <div className="w-full lg:w-2/3">
            <Demo />
          </div>
          <div className="w-full max-w-xl text-[#25D366] text-xl lg:text-2xl space-y-4 text-center">
            <h2 className="flex items-center justify-center lg:justify-start">
              <span className="mr-2">✅</span>
              Build habits that stick
            </h2>
            <h2 className="flex items-center justify-center lg:justify-start">
              <span className="mr-2">📱</span>
              Works with WhatsApp — no extra apps needed
            </h2>
            <h2 className="flex items-center justify-center lg:justify-start">
              <span className="mr-2">🔥</span>
               Never miss what matters
            </h2>
            <OnboardingToast />
          </div>
          <StripeProvider>
              <CheckoutButton />
          </StripeProvider>
        </div>
      </div>
    </div>
    </>
  );
}