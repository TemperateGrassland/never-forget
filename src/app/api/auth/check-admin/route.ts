import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes(session.user.email);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}