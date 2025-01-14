// import NextAuth from "next-auth";
// import EmailProvider from "next-auth/providers/email";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import prisma from "@/lib/prisma";

// export const { handlers, signIn, signOut, auth} =  NextAuth({
//   adapter: PrismaAdapter(prisma), 
//   providers: [
//     EmailProvider({
//       server: process.env.EMAIL_SERVER, // SMTP server configuration
//       from: process.env.EMAIL_FROM,    // Email address used to send magic links
//     }),
//   ],
//   secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies

//   session: {
//     strategy: "jwt", // Use JSON Web Tokens for session management
//     maxAge: 30 * 24 * 60 * 60, // 30 days
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       // Add user details to the token during sign-in
//       if (user) {
//         token.id = user.id;
//         token.email = user.email;
//       }
//       return token;
//     },
//     // async session({ session, user }) {
//     //   // Attach token properties to the session
//     //   if (session.user) {
//     //     session.user.id = user.id;
//     //     session.user.email = user.email;
//     //   }
//     //   return session;
//     // },
//     // async redirect({ url, baseUrl }) {
//     //   // Utilize the 'url' parameter to determine the redirect destination
//     //   if (url.startsWith(baseUrl)) {
//     //     console.log("Redirect callback path 1:", { url, baseUrl });
//     //     return url;
//     //   } else if (url.startsWith("/")) {
//     //     console.log("Redirect callback path 2:", { url, baseUrl });

//     //     return new URL(url, baseUrl).toString();
//     //   }
//     //   console.log("Redirect callback path 3:", { url, baseUrl });

//     //   return baseUrl;
//     // },
//   },

//   // pages: {
//   //   signIn: "/login", // Custom sign-in page
//   //   verifyRequest: "/auth/verify-request", // Page displayed after a magic link is sent
//   //   error: "/auth/error", // Error page
//   // },

//   theme: {
//     colorScheme: "auto", // Automatically match system theme
//     brandColor: "#4f46e5", // Brand color
//     logo: "/logo.png", // Custom logo
//   },

//   debug: process.env.NODE_ENV === "development", // Enable debug logs in development
// });



// From NextJS: https://next-auth.js.org/configuration/nextjs#in-app-directory

import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
  } from "next"
  import type { NextAuthOptions } from "next-auth"
  import { getServerSession } from "next-auth"
  import EmailProvider from "next-auth/providers/email";

  
  // You'll need to import and pass this
  // to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
  export const config = {
    providers: [
            EmailProvider({
              server: process.env.EMAIL_SERVER, // SMTP server configuration
              from: process.env.EMAIL_FROM,    // Email address used to send magic links
            }),
          ],
          secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
  } satisfies NextAuthOptions
  
  // Use it in server contexts
  export function auth(
    ...args:
      | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
      | [NextApiRequest, NextApiResponse]
      | []
  ) {
    return getServerSession(...args, config)
  }