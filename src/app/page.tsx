"use server";

import CheckUser from "./components/ui/CheckUser";

export default async function Page() {

  return (
    <>
    <div className="items-center bg-white mb-0">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-96 object-contain mt-0"
    />
    </div>
    <div className="items-center text-black flex flex-col">
      <h1>Daily actionable reminders to your Whatsapp</h1>
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
        </div>
    </div>
    </>
  );
}