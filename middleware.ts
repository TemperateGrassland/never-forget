import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

// Define public routes that do not require authentication
const publicRoutes = ["/login", "/public/:path*"];

export default async function middleware(req: NextRequest) {
  console.log("🔹 Middleware callback triggered");
  const session = await auth();

  const { pathname } = req.nextUrl;

  // Check if the requested path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If the route is not public and the user is not authenticated, redirect to /login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Proceed with the request
  return NextResponse.next();
}