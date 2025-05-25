'use client';

import { Suspense } from 'react';
import SignInPageContent from '@/app/components/ui/SignInPageContent';

export default function SignInPageWrapper() {
  return (
    <Suspense fallback={<div>Loading sign-in form...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}