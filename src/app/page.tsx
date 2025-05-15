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
    <div className="items-center text-black flex flex-col px-4 sm:px-8 lg:px-16 max-w-screen-xl mx-auto">
      <h1>Daily actionable reminders to your Whatsapp — join the waitlist now.</h1>
      <div>
      <WaitlistButton />
      </div>
      <div className="font-medium text-[#25D366] space-y-1">
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
        <div className="w-full">
          <Demo />
        </div>
        </div>
    </div>
    </>
  );
}