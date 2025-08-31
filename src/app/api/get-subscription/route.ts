import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ExpandedSubscription = Stripe.Subscription & {
  plan: Stripe.Plan;
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, get user's subscription data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionPlanId: true,
        subscriptionStartedAt: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the subscription data that our hook expects
    const subscriptionData = {
      subscriptionId: user.subscriptionId,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt?.toISOString(),
      subscriptionPlanId: user.subscriptionPlanId,
      subscriptionStartedAt: user.subscriptionStartedAt?.toISOString(),
    };

    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}