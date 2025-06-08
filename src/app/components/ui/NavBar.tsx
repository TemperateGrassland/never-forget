"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="w-full flex justify-end">
          {session?.user ? (
            <div className="relative inline-block text-left">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
              >
                <span role="img" aria-label="user">
                  🌊
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-black hover:bg-gray-100"
                  >
                    👤 Profile
                  </Link>
                  <Link
                    href="/daily-reminder"
                    className="block px-4 py-2 text-black hover:bg-gray-100"
                  >
                    📅 Daily Reminders
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-black hover:bg-gray-100"
                  >
                    👋 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-[#25D366] text-white px-4 py-2 rounded"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;