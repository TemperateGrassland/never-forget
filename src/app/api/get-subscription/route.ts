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

  // Replace with how you store/retrieve the Stripe customer ID
  const customerId = session.user.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json([], { status: 200 });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    expand: ["data.plan.product"],
  });

  const result = subscriptions.data.map(sub => {
    const subscription = sub as ExpandedSubscription;
    const plan = subscription.plan;
    return {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      plan: plan
        ? {
            nickname: plan.nickname,
            amount: plan.amount,
            interval: plan.interval,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}