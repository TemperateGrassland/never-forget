"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";


const Navbar: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>; // Show loading text or spinner
  }

  return (
    <nav className="bg-yellow-950 p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between relative">
      {session?.user && (
        <p className="text-lg text-green-600 font-semibold bg-green-100 px-4 py-2 rounded-md shadow-md">
          ✅ You are signed in: {session.user.email}
        </p>
      )}
        {/* Navigation Links (Right Aligned) */}
        <ul className="flex space-x-6 w-1/3 justify-end">
          <li>
              <Link href="/" className="text-white hover:underline">
                Home
              </Link>
          </li>
          {session?.user ? (
            <>
            <li>
            <Link href="/profile" className="text-white hover:underline">
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-white hover:underline"
              >
                Sign Out
              </button>
            </li>
            </>
          ) : (
            <li>
              <Link href="/api/auth/signin" className="text-white hover:underline">
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;