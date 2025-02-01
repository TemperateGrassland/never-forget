import { NextResponse } from "next/server";

export async function GET() {
  console.log("🔹 logout callback triggered");
  const response = NextResponse.redirect("https://localhost:3000/");
  response.cookies.set("next-auth.session-token", "", { expires: new Date(0) });
  return response;
}