import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import prisma from './prisma'; // Import your Prisma client setup

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for session management
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    encryption: true, // Encrypt the JWT for additional security
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Add the user ID to the token
        token.email = user.email; // Add the user email to the token
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id; // Include the user ID in the session
        session.user.email = token.email; // Include the user email in the session
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    verifyRequest: '/auth/verify-request', // Page displayed after magic link is sent
    error: '/auth/error', // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting cookies and JWTs
};