import { auth } from "@/auth"; 
import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const session = await auth(); 
  const { pathname } = req.nextUrl;

  // Allow unauthenticated users to access only the homepage
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to the homepage
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static assets and API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};