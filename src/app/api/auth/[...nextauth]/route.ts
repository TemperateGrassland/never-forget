import type { NextRequest } from "next/server";
import { handlers } from "@/auth"

console.log("🔥 NextAuth route handlers loaded");

// Wrap POST handler to log all requests
const originalPOST = handlers.POST;
const POST = async (request: NextRequest) => {
  console.log("🚨 POST request intercepted!");
  console.log("  URL:", request.url);
  console.log("  Pathname:", request.nextUrl.pathname);
  
  try {
    const result = await originalPOST(request);
    console.log("✅ NextAuth POST completed successfully");
    return result;
  } catch (error) {
    console.error("❌ NextAuth POST failed:", error);
    throw error;
  }
};

const GET = handlers.GET;
export { GET, POST };