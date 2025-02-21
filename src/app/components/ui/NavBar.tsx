"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginButton } from "./SignIn";

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>; // Show loading text or spinner
  }

  return (
    <nav className="bg-blue-500 p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between relative">
        {/* Left Spacer to balance the center */}
        <div className="w-1/3"></div>

        {/* Navigation Links (Right Aligned) */}
        <ul className="flex space-x-6 w-1/3 justify-end">
          {session?.user ? (
            // ✅ If user is signed in, show Home button
            <li>
              <Link href="/" className="text-white hover:underline">
                Home
              </Link>
            </li>
          ) : (
            <li>
              <LoginButton />
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;