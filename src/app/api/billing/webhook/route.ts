import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  findSubscriptionByStripeCustomerId,
  getNextMonthStart,
  resetExtractionCount,
  updateSubscription,
} from "@/models/subscription";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userSubscription =
          await findSubscriptionByStripeCustomerId(customerId);

        if (userSubscription) {
          const isActive = subscription.status === "active";
          const currentPeriodEnd =
            subscription.items.data[0]?.current_period_end;
          await updateSubscription(userSubscription.userId, {
            stripeSubscriptionId: subscription.id,
            planTier: isActive ? "pro" : "free",
            extractionsLimit: isActive ? 100 : 10,
            currentPeriodEnd: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000)
              : undefined,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userSubscription =
          await findSubscriptionByStripeCustomerId(customerId);

        if (userSubscription) {
          await updateSubscription(userSubscription.userId, {
            stripeSubscriptionId: undefined,
            planTier: "free",
            extractionsLimit: 10,
            currentPeriodEnd: getNextMonthStart(),
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === "subscription_cycle") {
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;

          if (customerId) {
            const userSubscription =
              await findSubscriptionByStripeCustomerId(customerId);

            if (userSubscription) {
              await resetExtractionCount(userSubscription.userId);
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
