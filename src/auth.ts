// "use server"

import NextAuth from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
// import { Session } from "next-auth";
// import type { DefaultJWT } from 'next-auth/core/types';

const prisma = new PrismaClient();

  
export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
      Nodemailer({
          server: process.env.EMAIL_SERVER, // SMTP server configuration
          from: process.env.EMAIL_FROM,    // Email address used to send magic links
        }),
      ],
      secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
      session: {
        strategy: "database", // ✅ Ensure it is "database" (not "jwt")
    },
    debug: true,
    // callbacks: { // ✅ Move jwt and session under callbacks
    //   async signIn({ user }) {
    //     console.log("✅ signIn callback triggered:", user);
    //     return true;
    //   },
      
    //   async jwt({ token, user }) { // ✅ Moved inside callbacks
    //     console.log("🔹 jwt callback triggered:", { token, user });
    //     if (user) {
    //       token.id = user.id;
    //     }
    //     return token;
    //   },
  
    //   async session({ session, token }: { session: Session; token: DefaultJWT }) {
    //     console.log("🔹 session callback triggered:", { session, token });
    //     if (session.user){
    //       session.user.id = token.id ?? "";
    //     }
      
    //     return session;
    //   },
      
    //   async redirect({ url, baseUrl }) {
    //     console.log("🔹 redirect callback triggered:", { url, baseUrl });
    //     return baseUrl + "/dashboard"; // ✅ Redirect to dashboard after login
    //   },
    // },
});

