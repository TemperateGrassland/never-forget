import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  // Extract the token from the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Check if the user is authenticated
  if (!token) {
    // Redirect unauthenticated users to the sign-in page
    const signInUrl = new URL('/auth/signin', req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'], // Apply middleware to all routes
};