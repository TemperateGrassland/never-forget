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
<nav className="bg-yellow-950 px-4 py-3 shadow-md">
  <div className="container mx-auto grid grid-cols-2 items-center">
  {/* Left Column */}
  <div className="w-full text-center md:text-left">
    {session?.user && (
      <p className="text-sm md:text-base text-green-700 font-medium bg-green-100 px-4 py-2 rounded-md shadow-md">
      ✅ Signed in: {session.user.email}
      </p>
    )}
  </div>
  
      {/* Right Column */}
      <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
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