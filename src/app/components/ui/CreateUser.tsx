'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import TurnstileComponent from '@/components/Turnstile';

export default function CreateUser({ prefillEmail = '' }: { prefillEmail?: string }) {
  const [email, setEmail] = useState(prefillEmail);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return 'First and last name are required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email format.';
    }

    if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
      return 'Invalid phone number.';
    }

    if (!dateOfBirth) {
      return 'Date of birth is required.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        turnstileToken,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      
      // Trigger magic link email sign-in
      signIn('mailgun', {
        email
        // redirect: true,
        // callbackUrl: '/', // Redirect to home page after login
      });

      return;
    } else {
      setMessage(`Error: ${data.error || 'Unable to create user.'}`);
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    setMessage('CAPTCHA verification failed. Please try again.');
    setTurnstileToken('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded max-w-md">
      <h2 className="text-xl font-semibold text-black text-center">Sign up</h2>

      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      <input
        type="text"
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      <input
        type="tel"
        placeholder="Phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      <input
        type="date"
        placeholder="Date of birth"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded text-black"
      />
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Security Verification
        </label>
        <TurnstileComponent
          onVerify={handleTurnstileVerify}
          onError={handleTurnstileError}
        />
      </div>

      <div className="text-center">
      <button
        type="submit"
        disabled={submitting || !turnstileToken}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create User'}
      </button>
      </div>

      {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
    </form>
  );
}