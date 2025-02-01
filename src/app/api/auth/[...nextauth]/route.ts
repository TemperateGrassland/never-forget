// import { authConfig } from "@/auth";
// import NextAuth from "next-auth";

// const handler = NextAuth(authConfig);

// export {handler as GET, handler as POST};

import { handlers } from "@/auth" // Referring to the auth.ts we just created
export const { GET, POST } = handlers