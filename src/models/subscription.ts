import getDb from "@/lib/db";
import type { Subscription } from "@/types/subscription";

const COLLECTION_NAME = "subscriptions";

export function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
}

async function getSubscriptionsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const subscription = await collection.findOne({ userId });
  if (!subscription) return null;
  return { ...subscription, _id: subscription._id.toString() } as Subscription;
}

async function checkAndResetFreeUserPeriod(
  subscription: Subscription,
): Promise<Subscription> {
  if (subscription.planTier !== "free") {
    return subscription;
  }

  if (!subscription.currentPeriodEnd) {
    const updated = await updateSubscription(subscription.userId, {
      currentPeriodEnd: getNextMonthStart(),
    });
    return updated || subscription;
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);

  if (now < periodEnd) {
    return subscription;
  }

  const updated = await updateSubscription(subscription.userId, {
    extractionsUsed: 0,
    currentPeriodEnd: getNextMonthStart(),
  });
  return updated || subscription;
}

export async function getOrCreateSubscription(
  userId: string,
): Promise<Subscription> {
  const existing = await getSubscription(userId);
  if (existing) {
    return checkAndResetFreeUserPeriod(existing);
  }

  const collection = await getSubscriptionsCollection();
  const now = new Date();

  const subscription: Omit<Subscription, "_id"> = {
    userId,
    planTier: "free",
    extractionsUsed: 0,
    extractionsLimit: 10,
    currentPeriodEnd: getNextMonthStart(),
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(subscription);
  return { ...subscription, _id: result.insertedId.toString() };
}

export async function updateSubscription(
  userId: string,
  updates: Partial<Subscription>,
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const result = await collection.findOneAndUpdate(
    { userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as Subscription;
}

export async function incrementExtractionCount(
  userId: string,
): Promise<Subscription | null> {
  const collection = await getSubscriptionsCollection();
  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $inc: { extractionsUsed: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  if (!result) return null;
  return { ...result, _id: result._id.toString() } as Subscription;
}

export async function resetExtractionCount(
  userId: string,
): Promise<Subscription | null> {
  return updateSubscription(userId, { extractionsUsed: 0 });
}

export async function findSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
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
