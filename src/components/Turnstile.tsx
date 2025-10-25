"use client";

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
}

export default function TurnstileComponent({ 
  onVerify, 
  onError,
  className = ""
}: TurnstileComponentProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured');
    return null;
  }

  return (
    <div className={`turnstile-container ${className}`}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={onError}
        options={{
          theme: 'light',
          size: 'normal',
        }}
      />
    </div>
  );
}