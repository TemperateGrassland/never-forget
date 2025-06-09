"use server";

import OnboardingToast from "./components/ui/OnboardingToast";
import Demo from "./components/ui/Demo";
import { WaitlistButton } from "./components/ui/Waitlist";

export const metadata = {
  title: "Daily Reminders via Whatsapp | Never Forget",
  description: "Set and manage daily WhatsApp reminders with Never Forget.",
};

export default async function Page() {

  return (
    <>
    <div className="flex flex-col items-center text-black px-4 sm:px-8 lg:px-16 max-w-screen-2xl mx-auto pb-16">
      <h1 className="mb-6 text-lg font-agrandir text-center">Create a list of daily actionable reminders and have them sent to your Whatsapp every day! Join the waitlist now.</h1>
      <div className="w-full flex justify-center mb-4 sm:mb-6">
      <WaitlistButton />
      </div>
      <div className="flex flex-col lg:flex-row items-start gap-4 w-full mt-8">
        <div className="w-full lg:w-2/3">
          <Demo />
        </div>
        <div className="w-full lg:w-1/3 text-[#25D366] text-lg lg:text-2xl space-y-4 text-center lg:text-left">
          <h2 className="flex items-center justify-center lg:justify-start">
            <span className="mr-2">✅</span>
            Build better habits
          </h2>
          <h2 className="flex items-center justify-center lg:justify-start">
            <span className="mr-2">📱</span>
            Integration with WhatsApp, no extra apps
          </h2>
          <h2 className="flex items-center justify-center lg:justify-start">
            <span className="mr-2">🔥</span>
            Remember the important things!
          </h2>
          <OnboardingToast />
        </div>
      </div>
    </div>
    </>
  );
}