import { NextResponse } from "next/server";
import * as Ably from "ably";

export async function GET() {
  try {
    const client = new Ably.Rest(process.env.ABLY_API_KEY!);
    const tokenRequest = await client.auth.createTokenRequest({ clientId: "neverforget" });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Error generating Ably token:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}