import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Allow access to the home page and static files
  if (pathname === "/" || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to the home page
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow authenticated users to proceed
  return NextResponse.next();
}