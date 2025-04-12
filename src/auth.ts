import NextAuth from 'next-auth';
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

  
export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
      Nodemailer({
          server: process.env.EMAIL_SERVER, 
          from: process.env.EMAIL_FROM,   
        }),
      ],
      secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
      session: {
        strategy: "database", 
    },
    debug: true,
    pages: {
      signIn: '/auth/signin',
    },
    // callbacks: {
    //   authorized({ auth }) {
    //     return !!auth?.user; // Allow only authenticated users
    //   },
    //   async redirect({ url, baseUrl }) {
    //     console.log("🔹 redirect callback triggered:", { url, baseUrl });
    //     return baseUrl;
    //   },
    //   // I think this could help solve my issue with the signin/auth flow.
    //   async signIn({ email }) {
    //     if (email) {
    //       return true;   //if the email exists in the User collection, email them a magic login link
    //     } else {
    //       return "/register";
    //     }
    //   },
    // }
});

