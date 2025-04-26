'use client';

import { useState } from 'react';
import CreateUser from './CreateUser';
import { LoginButton } from './SignIn';
import { signIn } from 'next-auth/react';

interface LoginButtonProps {
  email: string; // Receive the email as a prop
}

export default function CheckUser() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'check' | 'signin' | 'create'>('check');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("checking user")


    const res = await fetch(`/api/user/exists?email=${encodeURIComponent(email)}`);
    console.log("receieved response from api/user/exists endpoint...")

    const data = await res.json();
    


    if (res.ok && data.exists) {
      console.log(`signing in with next auth v5's signin() using ${email}`)
      // signIn('email', { email: email });
      signIn("mailgun", {
        email: email});
    } else {
      console.log("setting step to create")

      setStep('create');
    }
  };

  // if (step === 'signin') return <LoginButton email={email} />;
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