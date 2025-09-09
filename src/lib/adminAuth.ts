import { auth } from '@/auth';
import { NextResponse } from 'next/server';

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
}

export async function checkAdminAuth() {
  try {
    const session = await auth();
    console.log('Session check:', session?.user?.email || 'No session');
    
    if (!session?.user?.email) {
      console.log('No session or email found');
      return {
        isAdmin: false,
        user: null,
        response: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      };
    }

    const adminEmails = getAdminEmails();
    console.log('Admin emails from env:', adminEmails);
    console.log('User email:', session.user.email);
    const isAdmin = adminEmails.includes(session.user.email);

    if (!isAdmin) {
      console.log(`Access denied for ${session.user.email} - not in admin list`);
      console.log('Available admin emails:', adminEmails);
      return {
        isAdmin: false,
        user: session.user,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      };
    }

    console.log(`Admin access granted for ${session.user.email}`);
    return {
      isAdmin: true,
      user: session.user,
      response: null
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return {
      isAdmin: false,
      user: null,
      response: NextResponse.json({ error: 'Authentication error' }, { status: 500 })
    };
  }
}

export async function requireAdmin() {
  const authResult = await checkAdminAuth();
  
  if (!authResult.isAdmin || authResult.response) {
    throw authResult.response;
  }
  
  return authResult.user;
}

// Client-side helper to check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return false;
    }

    const adminEmails = getAdminEmails();
    return adminEmails.includes(session.user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Utility to get admin emails (for debugging)
export function getAdminEmailsForDebug(): string[] {
  return getAdminEmails();
}