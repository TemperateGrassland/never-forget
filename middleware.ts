// This was a first attempt at check the token in the request
// import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// export async function middleware(req: NextRequest) {
//   // Extract the token from the request
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

//   // Check if the user is authenticated
//   // if (!token) {
//   //   // Redirect unauthenticated users to the sign-in page
//   //   const signInUrl = new URL('/login', req.url);
//   //   return NextResponse.redirect(signInUrl);
//   // }
//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/'], // Apply middleware to all routes
// };


// // export { auth } from "@/lib/auth"


// This was a second attempt where I wanted to delete the cookie
// import { NextResponse } from 'next/server';

// export function middleware() {
//   const response = NextResponse.next();
//   response.cookies.delete('your_cookie_name');
//   return response;
// }


// This is the third attempt where I initialise NextAuth and matching on routes
// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';
 
// export default NextAuth(authConfig).auth;
 
// export const config = {
//   // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
//   matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
// };