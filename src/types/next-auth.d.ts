// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      stripeCustomerId?: string | null;
      phoneNumber?: string | null;
    };
  }

  interface User {
    firstName?: string | null;
    lastName?: string | null;
    stripeCustomerId?: string | null;
    phoneNumber?: string | null;
  }
}