import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await req.json();

  if (!subscriptionId) {
    return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
  }

  // Optionally validate the subscription belongs to the user before canceling

  const deleted = await stripe.subscriptions.cancel(subscriptionId);
  
  return NextResponse.json({ status: "cancelled", id: deleted.id });
}