import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav>
        {/* Navigation links */}
      </nav>
      <main>{children}</main>
    </div>
  );
}