// src/app/components/ui/Footer.tsx
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-6">
      <div className="max-w-3xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p className="text-sm">&copy; {new Date().getFullYear()} Never Forget. All rights reserved.</p>
        <nav className="space-x-4">
          <Link href="/termsandconditions" className="text-sm hover:text-gray-900">
            Terms and conditions
          </Link>
          <Link href="/privacy" className="text-sm hover:text-gray-900">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}