// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { NextAuthOptions } from "next-auth";
// import EmailProvider from "next-auth/providers/email";
// import prisma from "@/lib/prisma";

// export const authOptions: NextAuthOptions = {
//     adapter: PrismaAdapter(prisma), 
//     providers: [
//       EmailProvider({
//         server: process.env.EMAIL_SERVER, // SMTP server configuration
//         from: process.env.EMAIL_FROM,    // Email address used to send magic links
//       }),
//     ],
//     secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies
//     session: {
//       strategy: "database", // Ensure you're using JWT for session management
//     },
// };