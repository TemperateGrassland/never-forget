'use client';

import { useEffect, useState } from 'react';
import { getCsrfToken } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPageContent() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get CSRF token from the server
    getCsrfToken().then(token => setCsrfToken(token));

    // Optionally pre-fill the email if passed as a query parameter
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    (e.target as HTMLFormElement).submit();
  };

  if (!csrfToken) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Loading sign-in form...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      {submitted ? (
        <p className="text-center text-green-700">
          Magic link sent! Please check your email.
        </p>
      ) : (
        <form
          method="post"
          action="/api/auth/signin"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-center text-black">
            Sign in with Magic Link
          </h2>
          <input name="csrfToken" type="hidden" value={csrfToken} />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded text-black"
          />
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded">
            Send Magic Link
          </button>
        </form>
      )}
    </div>
  );
}