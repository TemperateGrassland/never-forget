import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import path from "path";

const protectedRoutes = ["/dashboard/:path*"];

export default async function middleware(req: NextRequest) {
    console.log("🔹 middleware callback triggered");
    const session = await auth();

    const { pathname } = req.nextUrl;

    const isProtectedRoute = protectedRoutes.some((route) =>pathname.startsWith(route));

    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
// Go forward to the route that the request is initially going to
    return NextResponse.next();
}

export { auth as middleware } from "@/auth"