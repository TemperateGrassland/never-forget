import NextAuth from 'next-auth';
// import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Email from "next-auth/providers/email";
import Mailgun from "next-auth/providers/mailgun"
import { sendWelcomeEmail } from './lib/email';

import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-02-24.acacia',
// });

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
    // debug: true,
    callbacks: {
      async session({ session, user }) {
      session.user.id = user.id;
      session.user.stripeCustomerId = user.stripeCustomerId;
      return session;
    },
      async signIn({ user }) {
        if (!user.email) {
          console.error("Sign-in attempt failed: missing user email.");
          return false;
        }

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

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
            if (!existingUser.stripeCustomerId) {
              const customer = await stripe.customers.create({ email: user.email });

              await prisma.user.update({
                where: { email: user.email },
                data: { stripeCustomerId: customer.id },
              });
            }

            if (!existingUser.hasReceivedWelcomeEmail) {
              console.log(`Sending welcome email to existing user: ${user.id}`);
              await sendWelcomeEmail(user.email);
              await prisma.user.update({
                where: { email: user.email },
                data: { hasReceivedWelcomeEmail: true },
              });
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
