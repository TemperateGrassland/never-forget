"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {

  const { data: session } = useSession()

  if (!session) {
    return <p>Loading...</p>
  }

  if (session) {
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