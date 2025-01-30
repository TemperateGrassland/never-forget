// "use server"

import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';

export const {auth, handlers, signIn, signOut} = NextAuth({
    providers: [
        EmailProvider({
          server: process.env.EMAIL_SERVER, // SMTP server configuration
          from: process.env.EMAIL_FROM,    // Email address used to send magic links
        }),
      ],
      secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
    }
);