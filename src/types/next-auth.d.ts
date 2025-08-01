// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      stripeCustomerId?: string | null;
      phoneNumber?: string | null;
      firstName?: string | null;
    };
  }

  interface User {
    name?: string | null;
    stripeCustomerId?: string | null;
    phoneNumber?: string | null;
    firstName?: string | null;
  }
}