"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "authenticated") {
    return (
      <div>
        <h1>Welcome to the Dashboard</h1>
        {/* Add your dashboard components here */}
        <p>Signed in as {session.user.email}</p>
      </div>
    )
  }

  return <a href="/api/auth/signin">Sign in</a>  
  return (
      <div>
        <h1>Welcome to the Dashboard</h1>
        {/* Add your dashboard components here */}
        
      </div>
    );
  }