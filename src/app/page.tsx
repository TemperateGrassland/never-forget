"use server";

import Demo from "./components/ui/Demo";
import { WaitlistButton } from "./components/ui/Waitlist";

export default async function Page() {

  return (
    <>
    <div className="flex justify-center bg-white mb-0">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-96 object-contain mt-0"
    />
    </div>
    <div className="items-center text-black flex flex-col px-4 sm:px-8 lg:px-16 max-w-screen-2xl mx-auto pb-16">
      <h1>Daily actionable reminders to your Whatsapp — join the waitlist now.</h1>
      <div>
      <WaitlistButton />
      </div>
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full mt-8">
        <div className="w-full lg:w-3/3">
          <Demo />
        </div>
        <div className="w-full lg:w-1/2 font-medium text-[#25D366] space-y-1">
          <h2 className="flex items-center">
            <span className="mr-2">✅</span>
            Build better habits
          </h2>
          <h2 className="flex items-center">
            <span className="mr-2">📱</span>
            Integration with WhatsApp, no extra apps
          </h2>
          <h2 className="flex items-center">
            <span className="mr-2">🔥</span>
            Track your habit streaks
          </h2>
        </div>
      </div>
    </div>
    </>
  );
}