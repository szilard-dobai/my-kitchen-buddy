import getDb from "@/lib/db";
import type { Subscription } from "@/types/subscription";

const COLLECTION_NAME = "subscriptions";

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

export async function getOrCreateSubscription(
  userId: string,
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
