"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();

  // if (status === "loading") {
  //   return <p>Loading...</p>;
  // }

  return (
<nav className="sticky top-0 z-50 bg-white border-b border-black px-4 py-3 shadow-sm">      <div className="container mx-auto grid grid-cols-2 items-center">
        {/* Left Column */}
        <div className="w-full text-center md:text-left">
          {session?.user ? (
            <p className="inline-block text-sm md:text-base text-black font-medium bg-gray-100 px-4 py-2 rounded-md shadow-sm">
              ✅ Signed in: {session.user.email}
            </p>
          ) : (
            <p className="inline-block text-sm md:text-base text-black font-medium bg-gray-100 px-4 py-2 rounded-md shadow-sm">
              🙈 You are not signed in
            </p>
          )}
        </div>

        {/* Right Column */}
        <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
          <li>
            <Link href="/" className="text-black hover:underline">
              Home
            </Link>
          </li>
          {session?.user ? (
            <>
              <li>
                <Link href="/profile" className="text-black hover:underline">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/habit-tracker" className="text-black hover:underline">
                  Habit Tracker
                </Link>
              </li>
              <li>
                <Link href="/daily-reminder" className="text-black hover:underline">
                  Daily Reminders
                </Link>
              </li>
              <li>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-black hover:underline"
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/api/auth/signin" className="text-black hover:underline">
                Sign in
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;