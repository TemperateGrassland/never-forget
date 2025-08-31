// src/app/page.tsx

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (status === "loading") return; // Don't do anything while loading
    
    if (session) {
      // User is signed in, take them to daily-reminder page
      router.push('/daily-reminder');
    } else {
      // User is not signed in, take them to sign in
      signIn();
    }
  };

  return (
    <>
    <div className="relative h-screen w-screen overflow-hidden" data-page="homepage">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="/bg-hero-1024.jpg"
          alt="Sunrise background"
          className="w-full h-full object-cover"
          srcSet="
            /bg-hero-640.jpg 640w,
            /bg-hero-1024.jpg 1024w,
            /bg-hero-charlie-1600.png 1600w
          "
          sizes="100vw"
        />
      </div>

    <div className="relative z-10 flex flex-col items-start justify-center text-left h-full px-4 sm:px-6 md:px-8 lg:px-16 pt-16 sm:pt-20">        
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white leading-tight">
          daily reminders to your whatsapp
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 max-w-lg sm:max-w-xl leading-relaxed">
          no apps, no fuss - just one nudge a day to help you build better habits.
        </p>
        <button 
                    onClick={handleGetStarted}
                    disabled={status === "loading"}
                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-1 rounded transition-colors -mx-1 px-1 text-xs sm:text-sm disabled:opacity-50"
                    style={{ color: '#25d366' }}
                    aria-label={session ? "Go to daily reminders" : "Sign in to your account"}
                    type="button"
                  >
                    {status === "loading" ? "loading..." : "get started"}
        </button>
      </div>
    </div>

    {/* How It Works Section */}
    <div className="bg-white py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-left">
            how it works
          </h2>
        </div>
        
        <div className="space-y-6 text-lg sm:text-xl text-gray-700 leading-relaxed">
          <p>
            never forget sends you a daily WhatsApp message for the things you want to remember — like birthdays, to-do&apos;s, and life admin. And when things change? Just reply. Our built-in AI will update your reminders on the spot — all in the same conversation.
          </p>
          
          <p className="space-y-6 text-xl sm:text-2xl font-medium text-gray-900 text-left pt-8">
            the things that matter most in life aren&apos;t hard to do — they&apos;re just easy to forget.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}