import type { NextRequest } from "next/server";
import { handlers } from "@/auth"

// Wrap POST handler to log all requests
const originalPOST = handlers.POST;
const POST = async (request: NextRequest) => {
  try {
    const result = await originalPOST(request);
    return result;
  } catch (error) {
    console.error("❌ NextAuth POST failed:", error);
    throw error;
  }
};

const GET = handlers.GET;
export { GET, POST };