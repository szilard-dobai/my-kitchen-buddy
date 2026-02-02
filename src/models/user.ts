import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import { getRecipesCollection } from "./recipe";

async function getSubscriptionsCollection() {
  const db = await getDb();
  return db.collection("subscriptions");
}

async function getTelegramLinksCollection() {
  const db = await getDb();
  return db.collection("telegramLinks");
}

async function getSessionsCollection() {
  const db = await getDb();
  return db.collection("session");
}

async function getAccountsCollection() {
  const db = await getDb();
  return db.collection("account");
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection("user");
}

export async function deleteUserAndAllData(userId: string): Promise<void> {
  const recipesCollection = await getRecipesCollection();
  await recipesCollection.deleteMany({ userId });

  const subscriptionsCollection = await getSubscriptionsCollection();
  await subscriptionsCollection.deleteOne({ userId });

  const telegramLinksCollection = await getTelegramLinksCollection();
  await telegramLinksCollection.deleteOne({ userId });

  const sessionsCollection = await getSessionsCollection();
  await sessionsCollection.deleteMany({ userId });

  const accountsCollection = await getAccountsCollection();
  await accountsCollection.deleteMany({ userId });

  const usersCollection = await getUsersCollection();
  await usersCollection.deleteOne({ id: userId });
}

export async function hasPasswordAccount(userId: string): Promise<boolean> {
  const accountsCollection = await getAccountsCollection();
  const userIdObj = new ObjectId(userId);
  const credentialAccount = await accountsCollection.findOne({
    userId: userIdObj,
    providerId: "credential",
  });
  return !!credentialAccount;
}

export async function updateUserEmail(
  userId: string,
  email: string,
): Promise<boolean> {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { id: userId },
    { $set: { email, updatedAt: new Date() } },
  );
  return result.modifiedCount === 1;
}
