'use client';

import { useEffect, useState } from 'react';
import { getCsrfToken } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get CSRF token from the server
    getCsrfToken().then(token => setCsrfToken(token));

    // First, try getting email from the top-level 'email' parameter.
    let emailParam = searchParams.get('email');

    // If not found, attempt to parse email from the callbackUrl.
    if (!emailParam) {
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        try {
          // Decode the callbackUrl once.
          const decodedUrl = decodeURIComponent(callbackUrl);
          // Create a URL object using the decoded URL. 
          // Use window.location.origin as the base in case the URL is relative.
          const urlObj = new URL(decodedUrl, window.location.origin);
          // Get the email parameter from the decoded URL
          let extractedEmail = urlObj.searchParams.get('email') || '';
          // If the extracted email is still URL encoded (e.g. charlie006allen%40gmail.com), decode it.
          extractedEmail = decodeURIComponent(extractedEmail);
          emailParam = extractedEmail;
        } catch (error) {
          console.error("Error parsing email from callbackUrl:", error);
        }
      }
    }

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
          action="/api/auth/signin/email"
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