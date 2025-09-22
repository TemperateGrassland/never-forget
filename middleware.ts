import { auth } from "@/auth"; 
import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/logger";

// This means the middleware will not use edge, consider removing to make queries faster and less expensive.
// Tradeoff is that network requests cannot be logged in middleware and detail for logs will have to be moved
// to each API route instead.
export const runtime = 'nodejs';

export default async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const session = await auth(); 
  const { pathname } = req.nextUrl;
  const method = req.method;
  const userAgent = req.headers.get('user-agent');
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Log the incoming request
  log.apiRequest(method, pathname, session?.user?.id, {
    userAgent,
    ip,
    sessionExists: !!session,
    userId: session?.user?.id
  });

  let response: NextResponse;

  // Allow unauthenticated users to access only the homepage
  if (pathname === "/") {
    response = NextResponse.next();
  } else if (!session) {
    // Redirect unauthenticated users to the homepage
    response = NextResponse.redirect(new URL("/", req.url));
    log.info("Unauthenticated redirect", { 
      originalPath: pathname, 
      redirectTo: "/",
      ip 
    });
  } else {
    response = NextResponse.next();
  }

  // Log the response
  const duration = Date.now() - startTime;
  const statusCode = response.status;
  
  log.apiResponse(method, pathname, statusCode, duration, {
    userId: session?.user?.id,
    ip
  });

  return response;
}

// Apply middleware to all routes except static assets and API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};