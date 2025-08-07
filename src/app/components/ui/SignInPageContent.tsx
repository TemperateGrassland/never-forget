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
    const fetchCsrfToken = async () => {
      try {
        const token = await getCsrfToken();
        console.log("🔐 Fresh CSRF token fetched:", token);
        setCsrfToken(token);
      } catch (error) {
        console.error("❌ Failed to get CSRF token:", error);
      }
    };
    
    fetchCsrfToken();

    // Optionally pre-fill the email if passed as a query parameter
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submission started");
    console.log("Email state:", email);
    
    try {
      // Get a fresh CSRF token right before submission
      console.log("🔄 Getting fresh CSRF token...");
      const freshToken = await getCsrfToken();
      console.log("🔐 Fresh CSRF token:", freshToken);
      
      // Create form data
      const formData = new FormData();
      formData.append('email', email);
      formData.append('csrfToken', freshToken || '');
      formData.append('callbackUrl', '/');
      
      console.log("📋 Form data being submitted:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      console.log("📤 Making POST request to /api/auth/signin/email");
      const response = await fetch('/api/auth/signin/email', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin', // Include cookies for CSRF validation
      });
      
      console.log("📥 Response received:", response.status, response.statusText);
      
      if (response.ok) {
        setSubmitted(true);
        console.log("✅ Form submitted successfully!");
      } else {
        console.error("❌ Form submission failed:", response.status);
        const responseText = await response.text();
        console.log("Response body:", responseText);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
    }
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
          <input name="callbackUrl" type="hidden" value="/" />
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