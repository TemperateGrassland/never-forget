"use server";

import { auth } from "@/auth";
import { LoginButton } from "./components/ui/SignIn";
import { LogoutButton } from "./components/ui/Signout";
import UpdatePhone from "./components/ui/AddPhoneNumber";
import AddReminderForm from "./components/ui/AddReminderForm";
import DashboardTable from "./components/ui/DashboardTable";
import ProfileButton from "./components/ui/ProfileButton";
import SendMessage from "./components/ui/SendMessage";

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

            {/* ✅ Show Dashboard & Features ONLY if Signed In */}
            <div className="container mx-auto p-6">
              <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
              <p className="text-lg">Signed in as {session?.user?.email || "Unknown User"}</p>

              {/* Logout and Profile Management */}
              <div className="mt-4 flex space-x-4">
                <LogoutButton />
                <ProfileButton />
              </div>

              {/* Update Phone Number and Messaging */}
              <div className="mt-6 flex space-x-4">
                <UpdatePhone />
                <SendMessage />
              </div>

              {/* Reminders Table */}
              <div className="mt-6">
                <DashboardTable />
              </div>

              {/* Add Reminder Form */}
              <div className="mt-6">
                <AddReminderForm />
              </div>
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