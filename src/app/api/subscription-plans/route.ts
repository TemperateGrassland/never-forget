import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true,
      type: 'recurring',
    });

    const plans = prices.data.map(price => ({
        id: price.id,
        name: (price.product as Stripe.Product).name, // 🚨 Unsafe if price.product is a string
        description: (price.product as Stripe.Product).description,
        price: price.unit_amount,
        price_id: price.id,
      }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching subscription plans' }, { status: 500 });
  }
}