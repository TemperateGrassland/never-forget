import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";



const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };