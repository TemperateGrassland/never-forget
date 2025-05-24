import NextAuth from 'next-auth';
// import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Email from "next-auth/providers/email";
import Mailgun from "next-auth/providers/mailgun"

const prisma = new PrismaClient();

  
export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
      Email({
          apiKey: process.env.MAILGUN_API_KEY,
          server: process.env.EMAIL_SERVER, 
          from: process.env.EMAIL_FROM,   
        }),
      ],
    secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
    session: {
    strategy: "database", 
    },
    debug: true,
    callback: {
      async signIn({ user }) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
    
        if (!existingUser) {
          // This is a new user, create the record
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
            },
          });
    
          // ✅ Send welcome email here (Mailgun or serverless function)
          await sendWelcomeEmail(user.email);
        }
    
        return true;
      },
    }
  }
);



