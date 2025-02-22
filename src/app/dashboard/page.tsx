"use server";

import { auth } from "@/auth";
import { LogoutButton } from "@/app/components/ui/Signout";
import { LoginButton } from "../components/ui/SignIn";
import UpdatePhone from "../components/ui/AddPhoneNumber";
import SendMessage from "../components/ui/SendMessage";

export default async function DashboardPage() {

  const session  = await auth();

  if (!session) {
    return (
    <>
      <p>Loading...</p>
      <LoginButton />
    </>
    )
  }

  if (session) {
    return (
      <div>
        <h1>Welcome to the Dashboard</h1>
        {/* Add your dashboard components here */}
        <p>Signed in as {session?.user?.email || "Unknown User"}</p>
        <LogoutButton />
        <UpdatePhone />
        <SendMessage />
      </div>
    )
  }

  return <link href="/api/auth/signin">Sign in</link>  
}