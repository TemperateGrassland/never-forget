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
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Join Waitlist'}
          </button>
        </form>
      )}
      {status === 'success' && <p className="text-black">Thanks! You are on the list.</p>}
      {status === 'error' && <p>Something went wrong.</p>}
    </>
  )
}