"use server";

import { auth } from "@/auth";
import { LoginButton } from "./components/ui/SignIn";
import { LogoutButton } from "./components/ui/Signout";

export default async function Page() {
  const session = await auth();

  return (
    <>
    <h1 className="text-3xl font-bold text-center mt-4">
       Improve your life by using, <span className="italic underline">Never Forget</span> 
    </h1>
      <div className="flex flex-col items-center mt-4">
        {session?.user ? (
          <>
            <p className="text-lg text-green-600 font-semibold bg-green-100 px-4 py-2 rounded-md shadow-md">
              ✅ You are signed in: {session?.user?.email}
            </p>
            <LogoutButton />
          </>
        ) : (
          <>
            <p className="text-lg text-red-600 font-semibold bg-red-100 px-4 py-2 rounded-md shadow-md">
              🙈 You are not signed in
            </p>
            <LoginButton />
          </>
        )}
      </div>

      {/* New Reminder Form */}
      <div className="mt-6 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">Set a Reminder</h2>
        
        {/* Event Name Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Event Details</label>
        <input
          type="text"
          placeholder="Enter event details..."
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-black"
        />

        {/* Date Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Select Date</label>
        <input
          type="date"
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />

        {/* Phone Number Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Phone Number</label>
        <input
          type="tel"
          placeholder="Enter phone number..."
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-black"
        />

        {/* Submit Button */}
        <button
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600"
        >
          Submit Reminder
        </button>
      </div>
    </>
)
};