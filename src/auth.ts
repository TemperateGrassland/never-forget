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
    callbacks: {
      authorized({ auth }) {
        return !!auth?.user; // Allow only authenticated users
      },
      async redirect({ url, baseUrl }) {
        console.log("🔹 redirect callback triggered:", { url, baseUrl });
        return baseUrl;
      },
    }
});

