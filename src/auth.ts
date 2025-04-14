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
      async signIn({ user, account, profile, email, credentials }) {
        console.log("signing user in...")
        // We expect the user object to be populated with an email at this point.
        if (!user?.email) return false;
  
        // Check the database: does this user already exist?
        const exists = await checkUserExists(user.email);

        console.log("hitting signin() in auth.ts")
  
        if (exists) {
          // The user exists: allow NextAuth to sign them in.
          return true;
        } else {
          // The user does not exist: redirect to the create user page.
          // Returning a URL from the signIn callback will trigger a redirect.
          return `/auth/create-user?email=${encodeURIComponent(user.email)}`;
        }
      },
    }
});

async function checkUserExists(email: string): Promise<boolean> {
  // Adjust this query to fit your database schema
  const user = await prisma.user.findUnique({ where: { email } });
  return !!user;
}

