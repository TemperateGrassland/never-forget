// import { PrismaAdapter } from "@auth/prisma-adapter";
// import NextAuth, { NextAuthOptions } from "next-auth";
// import EmailProvider from "next-auth/providers/email";
// import prisma from "@/lib/prisma";
// import { authOptions } from "@/lib/authOptions";



// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };



// From next.js docs: https://next-auth.js.org/configuration/nextjs#in-app-directory

import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { config } from "@/lib/auth"

export const authOptions: NextAuthOptions = config

export default NextAuth(authOptions)