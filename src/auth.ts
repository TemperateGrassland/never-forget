import NextAuth from 'next-auth';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Email from "next-auth/providers/email";
import Mailgun from "next-auth/providers/mailgun"
import { sendWelcomeEmail } from './lib/email';

import { stripe } from '@/lib/stripe';

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
    pages: {
      signIn: '/',
    },
    // debug: true,
    callbacks: {
      async session({ session, user }) {
        session.user.id = user.id;
        session.user.stripeCustomerId = user.stripeCustomerId;
        session.user.phoneNumber = user.phoneNumber;
        session.user.firstName = user.firstName;
        session.user.name = user.name;
        return session;
      },
      async redirect({ url, baseUrl }) {
        // For sign-in redirects, redirect to daily-reminder instead of profile
        if (url.startsWith("/api/auth/callback") || url === "/profile") {
          return baseUrl + "/daily-reminder";
        }
        
        // Default behavior for other redirects
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      },
      async signIn({ user }) {
        if (!user.email) {
          console.error("Sign-in attempt failed: missing user email.");
          return false;
        }

        try {
          // Find the user if it exists in the database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Create the stripe customer object, add a new user entry in the db and send welcome email for new users.
          if (!existingUser) {
            console.log(`Creating new user and sending welcome email to: ${user.id}`);
            const customer = await stripe.customers.create({
              email: user.email,
            });

            await prisma.user.create({
              data: {
                email: user.email,
                firstName: user.name || "",
                hasReceivedWelcomeEmail: true,
                stripeCustomerId: customer.id,
              },
            });

            await sendWelcomeEmail(user.email);
          } else {
              // TODO Maybe I can remove this? I already create a stripe customer object above when there is no user? what edges cases are being handled here?
            if (!existingUser.stripeCustomerId) {
              console.warn(`User ${existingUser.id} doesn't have an associated stripe customer object, investigate why`)
              // const customer = await stripe.customers.create({ email: user.email });

              // await prisma.user.update({
              //   where: { email: user.email },
              //   data: { stripeCustomerId: customer.id },
              // });
            }

            if (!existingUser.hasReceivedWelcomeEmail) {
              console.warn(`User ${existingUser.id} doesn't have an associated User entry in postgres, investigate why`)


              // console.log(`Sending welcome email to existing user: ${user.id}`);
              // await sendWelcomeEmail(user.email);
              // await prisma.user.update({
              //   where: { email: user.email },
              //   data: { hasReceivedWelcomeEmail: true },
              // });
            } else {
              console.log(`User ${existingUser.id} has already received the welcome email.`);
            }
          }
          return true;
        } catch (error) {
          console.error("Error during sign-in callback:", error);
          return false;
        }
      },
    }
  }
);
