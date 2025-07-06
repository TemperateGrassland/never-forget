"use client";

import { useState } from "react";

export function WaitlistButton() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setStatus(res.ok ? 'success' : 'error');
  };

  return (
    <>
      {status !== 'success' && (
        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-lg">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="mx-auto block w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="whitespace-nowrap bg-[#25D366] text-white m-4 px-6 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 hover:bg-[#25D366] transition-all duration-300 ease-in-out animate-pulse"
            >
              {status === 'loading' ? 'Submitting...' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      )}
      {status === 'success' && <p className="text-black">Thanks! You are on the list.</p>}
      {status === 'error' && (
        <p className="text-red-600 mt-2">Something went wrong. Please try again.</p>
      )}
      <div className="w-full max-w-3xl mb-6 text-xl sm:text-2xl lg:text-3xl text-center">
          <h1>
            Join the waitlist — we’ll let you know as soon as we’re live!
          </h1>
      </div>
      <p className="text-sm text-gray-600 text-center mt-2">
        No spam. No sharing. Pinky promise.
      </p>
    </>
  )
}