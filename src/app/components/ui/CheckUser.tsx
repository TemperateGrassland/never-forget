'use client';

import { useState } from 'react';
import CreateUser from './CreateUser';
import { LoginButton } from './SignIn';

export default function CheckUser() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'check' | 'signin' | 'create'>('check');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`/api/user/exists?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (res.ok && data.exists) {
      setStep('signin');
    } else {
      setStep('create');
    }
  };

  if (step === 'signin') return <LoginButton email={email} />;
  if (step === 'create') return <CreateUser prefillEmail={email} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded max-w-md">
      <h2 className="text-xl font-semibold text-black text-center">Welcome</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      <div className="text-center">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Continue
        </button>
      </div>
    </form>
  );
}