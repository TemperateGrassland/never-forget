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
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-[#075e54] text-white m-4 px-6 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 hover:bg-[#064c46] transition-all duration-300 ease-in-out animate-pulse"
          >
            {status === 'loading' ? 'Submitting...' : 'Join Waitlist'}
          </button>
        </form>
      )}
      {status === 'success' && <p className="text-black">Thanks! You are on the list.</p>}
      {status === 'error' && <p>Something went wrong.</p>}
    </>
  )
}