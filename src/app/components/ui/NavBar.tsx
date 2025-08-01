"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const textColor = isHomepage ? "text-white" : "text-black";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`w-full px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-sm font-medium z-20 ${textColor} bg-transparent absolute top-0`}>
      <Link href="/" className="flex items-center">
        <img 
          src="/never-forget-logo-black.svg" 
          alt="Never Forget Logo" 
          className="h-12 sm:h-16 md:h-20 w-auto"
        />
      </Link>
      {/* Mobile menu button */}
      <button
        className="md:hidden flex flex-col space-y-1 p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        <span className={`w-5 h-0.5 transition-all ${isHomepage ? 'bg-white' : 'bg-black'}`}></span>
        <span className={`w-5 h-0.5 transition-all ${isHomepage ? 'bg-white' : 'bg-black'}`}></span>
        <span className={`w-5 h-0.5 transition-all ${isHomepage ? 'bg-white' : 'bg-black'}`}></span>
      </button>

      {/* Desktop navigation */}
      <div className="hidden md:flex space-x-4 lg:space-x-6">
        <a href="/daily-reminder" className="hover:underline text-xs sm:text-sm">
          your reminders
        </a>
        <a href="/profile" className="hover:underline text-xs sm:text-sm">
          profile
        </a>
        <a href="/aboutus" className="hover:underline text-xs sm:text-sm">
          about
        </a>
        <a href="/contact" className="hover:underline text-xs sm:text-sm">
          contact
        </a>
        {session?.user ? (
          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-1 rounded transition-colors -mx-1 px-1 text-xs sm:text-sm"
            style={{ color: '#25d366' }}
            aria-label="Sign out of your account"
            type="button"
          >
            logout
          </button>
        ) : (
          <button 
            onClick={() => signIn()} 
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-1 rounded transition-colors -mx-1 px-1 text-xs sm:text-sm"
            style={{ color: '#25d366' }}
            aria-label="Sign in to your account"
            type="button"
          >
            login
          </button>
        )}
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-black text-xl font-bold"
                aria-label="Close mobile menu"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              <a href="/daily-reminder" className="text-black hover:text-[#25d366] text-lg py-2" onClick={() => setIsMobileMenuOpen(false)}>
                your reminders
              </a>
              <a href="/profile" className="text-black hover:text-[#25d366] text-lg py-2" onClick={() => setIsMobileMenuOpen(false)}>
                profile
              </a>
              <a href="/aboutus" className="text-black hover:text-[#25d366] text-lg py-2" onClick={() => setIsMobileMenuOpen(false)}>
                about
              </a>
              <a href="/contact" className="text-black hover:text-[#25d366] text-lg py-2" onClick={() => setIsMobileMenuOpen(false)}>
                contact
              </a>
              {session?.user ? (
                <button 
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    setIsMobileMenuOpen(false);
                  }} 
                  className="text-[#25d366] hover:underline text-lg py-2 text-left"
                  aria-label="Sign out of your account"
                  type="button"
                >
                  logout
                </button>
              ) : (
                <button 
                  onClick={() => {
                    signIn();
                    setIsMobileMenuOpen(false);
                  }} 
                  className="text-[#25d366] hover:underline text-lg py-2 text-left"
                  aria-label="Sign in to your account"
                  type="button"
                >
                  login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}