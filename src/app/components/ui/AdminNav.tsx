'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminNav() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Call API to check admin status (secure server-side check)
        const response = await fetch('/api/auth/check-admin');
        const result = await response.json();
        setIsAdmin(result.isAdmin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  // Don't render anything if not admin or still loading
  if (loading || !isAdmin) {
    return null;
  }

  return (
    <a href="/dashboard/metrics" className="hover:underline text-xs sm:text-sm">
      metrics
    </a>
  );
}

export function AdminNavMobile({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/check-admin');
        const result = await response.json();
        setIsAdmin(result.isAdmin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <a 
      href="/dashboard/metrics" 
      className="text-black hover:text-[#25d366] text-lg py-2"
      onClick={onClose}
    >
      metrics
    </a>
  );
}