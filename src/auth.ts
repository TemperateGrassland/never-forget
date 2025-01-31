// "use server"

import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authConfig: NextAuthOptions ={
    adapter: PrismaAdapter(prisma),
    providers: [
        EmailProvider({
          server: process.env.EMAIL_SERVER, // SMTP server configuration
          from: process.env.EMAIL_FROM,    // Email address used to send magic links
        }),
      ],
      secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
};