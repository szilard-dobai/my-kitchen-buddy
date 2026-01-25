# Stripe Subscription Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement freemium pricing with Stripe - Free tier (10 extractions/month) and Pro tier ($5/month or $50/year for 100 extractions/month).

**Architecture:** Separate `subscriptions` collection tracks user plan and usage. Stripe handles payments via Checkout Sessions and Customer Portal. Webhooks sync subscription state. Usage is checked before extraction starts and incremented on success.

**Tech Stack:** Stripe SDK, MongoDB, Next.js API routes, shadcn/ui components

---

## Task 1: Install Stripe and Add Environment Variables

**Files:**
- Modify: `package.json`
- Modify: `.env.local` (local only, not committed)
- Modify: `.env.example` (if exists, or create)

**Step 1: Install Stripe SDK**

Run:
```bash
npm install stripe
```

**Step 2: Add environment variables to `.env.local`**

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Step 3: Commit package changes**

```bash
git add package.json package-lock.json
git commit -m "chore: add stripe dependency"
```

---

## Task 2: Create Subscription Types

**Files:**
- Create: `src/types/subscription.ts`

**Step 1: Create the types file**

```typescript
export type PlanTier = "free" | "pro";

export interface Subscription {
  _id?: string;
  userId: string;
  planTier: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  extractionsUsed: number;
  extractionsLimit: number;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageInfo {
  used: number;
  limit: number;
  planTier: PlanTier;
  currentPeriodEnd?: Date;
}

export const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 10,
  pro: 100,
};
```

**Step 2: Commit**

```bash
git add src/types/subscription.ts
git commit -m "feat: add subscription types"
```

---

## Task 3: Create Stripe Client Library

**Files:**
- Create: `src/lib/stripe.ts`

**Step 1: Create the Stripe client**

```typescript
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
};
```

**Step 2: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add stripe client library"
```

---

## Task 4: Create Subscription Model

**Files:**
- Create: `src/models/subscription.ts`

**Step 1: Create the subscription model**

```typescript
import { ObjectId } from "mongodb";

import getDb from "@/lib/db";
import type { PlanTier, Subscription, PLAN_LIMITS } from "@/types/subscription";

const COLLECTION_NAME = "subscriptions";

async function getSubscriptionsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const subscription = await collection.findOne({ userId });
  if (!subscription) return null;
  return { ...subscription, _id: subscription._id.toString() } as Subscription;
}

export async function getOrCreateSubscription(
  userId: string
): Promise<Subscription> {
  const existing = await getSubscription(userId);
  if (existing) return existing;

  const collection = await getSubscriptionsCollection();
  const now = new Date();

  const subscription: Omit<Subscription, "_id"> = {
    userId,
    planTier: "free",
    extractionsUsed: 0,
    extractionsLimit: 10,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(subscription);
  return { ...subscription, _id: result.insertedId.toString() };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const result = await collection.findOneAndUpdate(
    { userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as Subscription;
}

export async function incrementExtractionCount(
  userId: string
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $inc: { extractionsUsed: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as Subscription;
}

export async function resetExtractionCount(
  userId: string
): Promise<Subscription | null> {
  return updateSubscription(userId, { extractionsUsed: 0 });
}

export async function findSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const subscription = await collection.findOne({ stripeCustomerId });
  if (!subscription) return null;
  return { ...subscription, _id: subscription._id.toString() } as Subscription;
}

export async function canUserExtract(userId: string): Promise<boolean> {
  const subscription = await getOrCreateSubscription(userId);
  return subscription.extractionsUsed < subscription.extractionsLimit;
}
```

**Step 2: Commit**

```bash
git add src/models/subscription.ts
git commit -m "feat: add subscription model with usage tracking"
```

---

## Task 5: Add Usage Check to Extract Route

**Files:**
- Modify: `src/app/api/extract/route.ts`

**Step 1: Add usage check after auth check**

Add import at top:
```typescript
import { canUserExtract, getOrCreateSubscription } from "@/models/subscription";
```

Add after the `session?.user` check (around line 20):
```typescript
    const canExtract = await canUserExtract(session.user.id);
    if (!canExtract) {
      const subscription = await getOrCreateSubscription(session.user.id);
      return NextResponse.json(
        {
          error: "Extraction limit reached",
          used: subscription.extractionsUsed,
          limit: subscription.extractionsLimit,
          planTier: subscription.planTier,
        },
        { status: 429 }
      );
    }
```

**Step 2: Commit**

```bash
git add src/app/api/extract/route.ts
git commit -m "feat: add extraction limit check to extract route"
```

---

## Task 6: Add Usage Increment to Extraction Service

**Files:**
- Modify: `src/services/extraction/index.ts`

**Step 1: Add import**

```typescript
import { incrementExtractionCount } from "@/models/subscription";
```

**Step 2: Add increment after successful recipe creation**

Find the line where `completeExtractionJob` is called (around line 206) and add after it:
```typescript
    await incrementExtractionCount(userId);
```

**Step 3: Commit**

```bash
git add src/services/extraction/index.ts
git commit -m "feat: increment extraction count on successful extraction"
```

---

## Task 7: Create Checkout API Route

**Files:**
- Create: `src/app/api/billing/checkout/route.ts`

**Step 1: Create the checkout route**

```typescript
import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getOrCreateSubscription, updateSubscription } from "@/models/subscription";

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
        { status: 400 }
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
      await updateSubscription(session.user.id, { stripeCustomerId: customerId });
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
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/billing/checkout/route.ts
git commit -m "feat: add stripe checkout API route"
```

---

## Task 8: Create Customer Portal API Route

**Files:**
- Create: `src/app/api/billing/portal/route.ts`

**Step 1: Create the portal route**

```typescript
import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getOrCreateSubscription } from "@/models/subscription";

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getOrCreateSubscription(session.user.id);

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/billing/portal/route.ts
git commit -m "feat: add stripe customer portal API route"
```

---

## Task 9: Create Webhook API Route

**Files:**
- Create: `src/app/api/billing/webhook/route.ts`

**Step 1: Create the webhook route**

```typescript
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import {
  findSubscriptionByStripeCustomerId,
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
      process.env.STRIPE_WEBHOOK_SECRET!
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
          await updateSubscription(userSubscription.userId, {
            stripeSubscriptionId: subscription.id,
            planTier: isActive ? "pro" : "free",
            extractionsLimit: isActive ? 100 : 10,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
            currentPeriodEnd: undefined,
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
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/billing/webhook/route.ts
git commit -m "feat: add stripe webhook handler"
```

---

## Task 10: Create Usage API Route

**Files:**
- Create: `src/app/api/billing/usage/route.ts`

**Step 1: Create the usage route**

```typescript
import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getOrCreateSubscription } from "@/models/subscription";
import type { UsageInfo } from "@/types/subscription";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getOrCreateSubscription(session.user.id);

    const usage: UsageInfo = {
      used: subscription.extractionsUsed,
      limit: subscription.extractionsLimit,
      planTier: subscription.planTier,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/billing/usage/route.ts
git commit -m "feat: add usage stats API route"
```

---

## Task 11: Create Billing Settings Page

**Files:**
- Create: `src/app/(dashboard)/settings/billing/page.tsx`

**Step 1: Create the billing page**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UsageInfo } from "@/types/subscription";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const response = await fetch("/api/billing/usage");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(priceType: "monthly" | "yearly") {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open portal");
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPro = usage?.planTier === "pro";
  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Successfully upgraded to Pro! Your extraction limit has been increased.
        </div>
      )}

      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {isPro ? "Pro Plan" : "Free Plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Extractions this month</span>
              <span>
                {usage?.used} / {usage?.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usagePercent >= 80 ? "bg-orange-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {usage?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Resets on{" "}
              {new Date(usage.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {isPro && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={actionLoading}
            >
              {actionLoading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}
        </CardContent>
      </Card>

      {!isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Get 100 recipe extractions per month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-2xl font-bold">$5/mo</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Billed monthly
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade("monthly")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Loading..." : "Subscribe Monthly"}
                </Button>
              </div>
              <div className="border rounded-lg p-4 border-primary">
                <h3 className="font-semibold">Yearly</h3>
                <p className="text-2xl font-bold">
                  $50/yr{" "}
                  <span className="text-sm font-normal text-green-600">
                    Save $10
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Billed annually
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade("yearly")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Loading..." : "Subscribe Yearly"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/settings/billing/page.tsx
git commit -m "feat: add billing settings page"
```

---

## Task 12: Add Usage Display to Extract Page

**Files:**
- Modify: `src/app/(dashboard)/extract/page.tsx`

**Step 1: Add usage state and fetch**

Add import:
```typescript
import type { UsageInfo } from "@/types/subscription";
```

Add state:
```typescript
const [usage, setUsage] = useState<UsageInfo | null>(null);
```

Add useEffect to fetch usage:
```typescript
useEffect(() => {
  fetch("/api/billing/usage")
    .then((res) => res.json())
    .then((data) => setUsage(data))
    .catch(console.error);
}, []);
```

**Step 2: Add usage display in UI**

Add near the top of the form, after the title:
```typescript
{usage && (
  <div className="text-sm text-muted-foreground mb-4">
    {usage.used} / {usage.limit} extractions used this month
    {usage.used >= usage.limit && (
      <span className="text-red-500 ml-2">
        Limit reached.{" "}
        <a href="/settings/billing" className="underline">
          Upgrade to Pro
        </a>
      </span>
    )}
  </div>
)}
```

**Step 3: Disable submit when limit reached**

Update the submit button disabled condition to include usage check:
```typescript
disabled={loading || !url || (usage && usage.used >= usage.limit)}
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/extract/page.tsx
git commit -m "feat: add usage display and limit check to extract page"
```

---

## Task 13: Add Billing Link to Header

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: Add Settings link to navigation**

Find the `navLinks` array and add:
```typescript
{ href: "/settings/billing", label: "Billing" },
```

**Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add billing link to header navigation"
```

---

## Task 14: Create Stripe Products in Dashboard

**No code changes - manual setup**

**Step 1: Go to Stripe Dashboard**

1. Go to https://dashboard.stripe.com/products
2. Create a new product called "My Kitchen Buddy Pro"

**Step 2: Create Monthly Price**

- Price: $5.00
- Recurring: Monthly
- Copy the price ID (starts with `price_`)

**Step 3: Create Yearly Price**

- Price: $50.00
- Recurring: Yearly
- Copy the price ID

**Step 4: Add Price IDs to Environment**

Add to `.env.local`:
```
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

**Step 5: Set Up Webhook**

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Task 15: Test the Full Flow

**Step 1: Test free tier extraction**

1. Log in as a new user
2. Extract a recipe - should work
3. Check `/settings/billing` - should show 1/10 used

**Step 2: Test limit enforcement**

1. Manually set `extractionsUsed: 10` in database for test user
2. Try to extract - should get 429 error
3. Check extract page shows limit message

**Step 3: Test upgrade flow**

1. Click upgrade on billing page
2. Complete Stripe test checkout (use card 4242 4242 4242 4242)
3. Verify webhook updates subscription to Pro
4. Verify extraction limit now shows 100

**Step 4: Test subscription management**

1. Click "Manage Subscription" on billing page
2. Verify Stripe portal opens
3. Test cancellation flow

---

## Summary

**Files Created:**
- `src/types/subscription.ts`
- `src/lib/stripe.ts`
- `src/models/subscription.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/billing/webhook/route.ts`
- `src/app/api/billing/usage/route.ts`
- `src/app/(dashboard)/settings/billing/page.tsx`

**Files Modified:**
- `package.json` (stripe dependency)
- `src/app/api/extract/route.ts` (usage check)
- `src/services/extraction/index.ts` (usage increment)
- `src/app/(dashboard)/extract/page.tsx` (usage display)
- `src/components/layout/header.tsx` (billing link)

**Environment Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_APP_URL`
