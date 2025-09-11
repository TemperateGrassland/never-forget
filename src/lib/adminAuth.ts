import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { log } from './logger';

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
}

export async function checkAdminAuth() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      log.warn('Admin access attempt without session', { 
        hasSession: !!session,
        userAgent: 'server-side'
      });
      return {
        isAdmin: false,
        user: null,
        response: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      };
    }

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes(session.user.email);

    if (!isAdmin) {
      log.warn('Admin access denied', {
        email: session.user.email,
        adminEmailsCount: adminEmails.length,
        timestamp: new Date().toISOString()
      });
      return {
        isAdmin: false,
        user: session.user,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      };
    }

    log.adminAccess(session.user.email, 'Admin auth check passed');
    return {
      isAdmin: true,
      user: session.user,
      response: null
    };
  } catch (error) {
    log.error('Admin auth check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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