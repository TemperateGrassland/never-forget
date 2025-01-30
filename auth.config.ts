// // Importing a type specifies that only the TypeScript type is being imported from the next-auth package


// import { NextAuthOptions } from "next-auth";

 

// export const authConfig: NextAuthOptions = {
//     // Return un-authed users to login page
//     pages: {
//     signIn: '/login',
//   },
//   callbacks: {
//     authorized({ auth: NextApiRequest, request: { nextUrl } }) {
//       const isLoggedIn = !!auth?.user;
//       const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
//       if (isOnDashboard) {
//         if (isLoggedIn) return true;
//         return false; // Redirect unauthenticated users to login page
//       } else if (isLoggedIn) {
//         return Response.redirect(new URL('/dashboard', nextUrl));
//       }
//       return true;
//     },
//   },
//   providers: [],
// };