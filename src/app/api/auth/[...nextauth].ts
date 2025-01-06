import NextAuth, { AuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authOptions: AuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER, // SMTP server configuration
      from: process.env.EMAIL_FROM,    // Email address used to send magic links
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // Used for signing/encrypting JWTs and cookies

  session: {
    strategy: "jwt", // Use JSON Web Tokens for session management
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // JWT validity (30 days)
    // encryption: true, // Enable encryption for added security
  },

  callbacks: {
    async jwt({ token, user }) {
      // Add user details to the token during sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach token properties to the session
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin", // Custom sign-in page
    verifyRequest: "/auth/verify-request", // Page displayed after a magic link is sent
    error: "/auth/error", // Error page
  },

  theme: {
    colorScheme: "auto", // Automatically match system theme
    brandColor: "#4f46e5", // Brand color
    logo: "/logo.png", // Custom logo
  },

  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
};

export default NextAuth(authOptions);