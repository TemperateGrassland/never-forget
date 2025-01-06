import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number; // Add the id property
      name: string;
      email: string;
      image?: string;
    };
  }

  interface User {
    id: number; // Extend User type to include id
  }
}