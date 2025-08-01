"use client";

import React from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const textColor = isHomepage ? "text-white" : "text-black";

  return (
    <nav className={`w-full px-6 py-4 flex justify-between items-center text-sm font-medium z-20 ${textColor} bg-transparent absolute top-0`}>
      <Link href="/" className="flex items-center">
        <img 
          src="/never-forget-logo-black.svg" 
          alt="Never Forget Logo" 
          className="h-20 w-auto"
        />
      </Link>
      <div className="flex space-x-6">
      <a href="/daily-reminder" className="hover:underline">
        your reminders
      </a>
      <a href="/profile" className="hover:underline">
        profile
      </a>
      <a href="/aboutus" className="hover:underline">
        about
      </a>
      <a href="/contact" className="hover:underline">
        contact
      </a>
      {session?.user ? (
        <span className="hover:underline">
          {session.user.firstName || 'User'}
        </span>
      ) : (
        <button onClick={() => signIn()} className="hover:underline">
          login
        </button>
      )}
      </div>
    </nav>
  );
}