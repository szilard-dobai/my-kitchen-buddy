import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import {
  getOrCreateSubscription,
  updateSubscription,
} from "@/models/subscription";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceType } = body;

    if (!priceType || !["monthly", "yearly"].includes(priceType)) {
      return NextResponse.json(
        { error: "Invalid price type" },
        { status: 400 },
      );
    }

    const subscription = await getOrCreateSubscription(session.user.id);

    let customerId = subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await updateSubscription(session.user.id, {
        stripeCustomerId: customerId,
      });
    }

    const priceId =
      priceType === "yearly"
        ? STRIPE_PRICES.pro_yearly
        : STRIPE_PRICES.pro_monthly;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
