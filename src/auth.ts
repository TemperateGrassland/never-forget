import NextAuth from 'next-auth';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Email from "next-auth/providers/email";
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
    // debug: true,
    callbacks: {
      async redirect({ url, baseUrl }) {
        console.log(`NextAuth redirect: url=${url}, baseUrl=${baseUrl}`);
        
        // Always redirect to /daily-reminder after sign in
        if (url === baseUrl || url === '/' || url === `${baseUrl}/`) {
          console.log('Redirecting to /daily-reminder (homepage redirect)');
          return `${baseUrl}/daily-reminder`;
        }
        
        // Allow relative callback URLs
        if (url.startsWith('/')) {
          console.log(`Redirecting to relative URL: ${url}`);
          return `${baseUrl}${url}`;
        }
        
        // Default redirect to /daily-reminder for any other case
        console.log('Default redirect to /daily-reminder');
        return `${baseUrl}/daily-reminder`;
      },
      async session({ session, user }) {
      session.user.id = user.id;
      session.user.stripeCustomerId = user.stripeCustomerId;
      // phoneNumber removed for security - fetch from DB when needed
      return session;
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
            console.log(`🆕 AUTH: Creating new user and sending welcome email`, {
              userId: user.id,
              userEmail: user.email,
              userName: user.name
            });

            try {
              const customer = await stripe.customers.create({
                email: user.email,
              });
              console.log(`✅ AUTH: Stripe customer created`, {
                customerId: customer.id,
                email: user.email
              });

              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  firstName: user.name || "",
                  hasReceivedWelcomeEmail: true,
                  stripeCustomerId: customer.id,
                },
              });
              console.log(`✅ AUTH: User created in database`, {
                userId: newUser.id,
                email: newUser.email,
                hasReceivedWelcomeEmail: newUser.hasReceivedWelcomeEmail
              });

              console.log(`📧 AUTH: About to send welcome email to new user`, {
                email: user.email,
                userId: newUser.id
              });
              const emailResult = await sendWelcomeEmail(user.email);
              console.log(`📧 AUTH: Welcome email result for new user`, {
                email: user.email,
                success: emailResult?.success,
                error: emailResult?.error
              });
            } catch (error) {
              console.error(`💥 AUTH: Error during new user creation/welcome email`, {
                email: user.email,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
              });
            }
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
              console.log(`📧 AUTH: Sending welcome email to existing user`, {
                userId: existingUser.id,
                email: user.email,
                hasReceivedWelcomeEmail: existingUser.hasReceivedWelcomeEmail
              });

              try {
                const emailResult = await sendWelcomeEmail(user.email);
                console.log(`📧 AUTH: Welcome email result for existing user`, {
                  userId: existingUser.id,
                  email: user.email,
                  success: emailResult?.success,
                  error: emailResult?.error
                });

                if (emailResult?.success) {
                  await prisma.user.update({
                    where: { email: user.email },
                    data: { hasReceivedWelcomeEmail: true },
                  });
                  console.log(`✅ AUTH: Updated hasReceivedWelcomeEmail flag for existing user`, {
                    userId: existingUser.id,
                    email: user.email
                  });
                } else {
                  console.error(`❌ AUTH: Not updating hasReceivedWelcomeEmail flag due to email failure`, {
                    userId: existingUser.id,
                    email: user.email,
                    error: emailResult?.error
                  });
                }
              } catch (error) {
                console.error(`💥 AUTH: Error sending welcome email to existing user`, {
                  userId: existingUser.id,
                  email: user.email,
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.log(`✅ AUTH: User already received welcome email`, {
                userId: existingUser.id,
                email: user.email,
                hasReceivedWelcomeEmail: existingUser.hasReceivedWelcomeEmail
              });
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