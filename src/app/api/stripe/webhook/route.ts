import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// This webhook endpoint handles all Stripe events to keep user subscriptions in sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Return success immediately for Stripe, then process async
    const response = NextResponse.json({ received: true });
    
    // Process webhook asynchronously to prevent timeout
    setImmediate(async () => {
      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
            break;

          case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
            break;

          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;

          case 'customer.subscription.paused':
            await handleSubscriptionPaused(event.data.object as Stripe.Subscription);
            break;

          case 'customer.subscription.resumed':
            await handleSubscriptionResumed(event.data.object as Stripe.Subscription);
            break;

          case 'customer.subscription.trial_will_end':
            await handleTrialWillEnd(event.data.object as Stripe.Subscription);
            break;

          case 'customer.created':
            await handleCustomerCreated(event.data.object as Stripe.Customer);
            break;

          case 'customer.deleted':
            await handleCustomerDeleted(event.data.object as Stripe.Customer);
            break;

          case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
            break;

          case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object as Stripe.Invoice);
            break;

          case 'invoice.payment_action_required':
            await handlePaymentActionRequired(event.data.object as Stripe.Invoice);
            break;

          default:
            console.log(`Unhandled Stripe webhook event: ${event.type}`);
        }
      } catch (error) {
        console.error(`Error processing webhook ${event.type}:`, error);
      }
    });

    return response;
  } catch (error) {
    console.error('Webhook request processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  // You might want to add a subscription table to track this
  // For now, we can log or update user status
  console.log(`User ${user.email} subscribed with plan: ${subscription.id}`);
  
  // Update user record with subscription info
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlanId: subscription.items.data[0]?.price.id,
      subscriptionStartedAt: new Date(subscription.created * 1000),
    }
  });
}

// Handle subscription updates (status changes, plan changes, etc.)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
  
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`User ${user.email} subscription status changed to: ${subscription.status}`);
  
  // Handle different subscription statuses
  switch (subscription.status) {
    case 'active':
      console.log('Subscription is now active');
      break;
    case 'past_due':
      console.log('Subscription payment is past due');
      break;
    case 'canceled':
      console.log('Subscription was canceled');
      break;
    case 'unpaid':
      console.log('Subscription is unpaid');
      break;
  }
  
  // Update user record with latest subscription info
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      subscriptionStatus: subscription.status,
    }
  });
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`User ${user.email} subscription canceled`);
  
  // Update user record for cancellation
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      subscriptionStatus: 'canceled',
      subscriptionId: null,
    }
  });
}

// Handle new Stripe customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id, customer.email);
  
  if (!customer.email) {
    console.log('Customer has no email, skipping user linking');
    return;
  }

  // Try to link customer to existing user
  const user = await prisma.user.findUnique({
    where: { email: customer.email }
  });

  if (user && !user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id }
    });
    console.log(`Linked Stripe customer ${customer.id} to user ${user.email}`);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    console.log(`Payment succeeded for user: ${user.email}`);
    // Optional: Send success notification, update credits, etc.
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    console.log(`Payment failed for user: ${user.email}`);
    // Optional: Send notification, pause service, etc.
  }
}

// Handle checkout session completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);
  
  const customerId = session.customer as string;
  
  if (!customerId) {
    console.error('No customer ID in checkout session');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`Checkout completed for user: ${user.email}`);
  
  // If this was a subscription checkout, the subscription will be handled 
  // by the customer.subscription.created event
  // For one-time payments, handle here if needed
}

// Handle subscription paused
async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  console.log('Subscription paused:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`User ${user.email} subscription paused`);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      subscriptionStatus: 'paused',
    }
  });
}

// Handle subscription resumed
async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  console.log('Subscription resumed:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`User ${user.email} subscription resumed`);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      subscriptionStatus: subscription.status,
    }
  });
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Trial will end for subscription:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`Trial ending soon for user: ${user.email}`);
  // Optional: Send notification to user about trial ending
}

// Handle customer deletion
async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Customer deleted:', customer.id);
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customer.id }
  });

  if (!user) {
    console.log(`No user found for deleted customer: ${customer.id}`);
    return;
  }

  console.log(`Cleaning up data for deleted customer: ${user.email}`);
  
  // Clear Stripe-related data but keep user account
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlanId: null,
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
    }
  });
}

// Handle payment action required
async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log('Payment action required for invoice:', invoice.id);
  
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`);
    return;
  }

  console.log(`Payment action required for user: ${user.email}`);
  // Optional: Send notification to user about payment action needed
}