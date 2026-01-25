import getDb from "@/lib/db";
import type { TargetLanguage } from "@/types/extraction-job";
import type {
  CreateTelegramLinkInput,
  TelegramLink,
} from "@/types/telegram-link";

const COLLECTION_NAME = "telegramLinks";

async function getTelegramLinksCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createTelegramLink(
  input: CreateTelegramLinkInput,
): Promise<TelegramLink> {
  const collection = await getTelegramLinksCollection();

  const doc = {
    ...input,
    preferredLanguage: "original" as TargetLanguage,
    linkedAt: new Date(),
  };

  const result = await collection.insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId.toString(),
  };
}

export async function getTelegramLinkByUserId(
  userId: string,
): Promise<TelegramLink | null> {
  const collection = await getTelegramLinksCollection();
  const doc = await collection.findOne({ userId });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    userId: doc.userId,
    telegramUserId: doc.telegramUserId,
    telegramUsername: doc.telegramUsername,
    telegramFirstName: doc.telegramFirstName,
    preferredLanguage: doc.preferredLanguage || "original",
    linkedAt: doc.linkedAt,
  };
}

export async function getTelegramLinkByTelegramUserId(
  telegramUserId: number,
): Promise<TelegramLink | null> {
  const collection = await getTelegramLinksCollection();
  const doc = await collection.findOne({ telegramUserId });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    userId: doc.userId,
    telegramUserId: doc.telegramUserId,
    telegramUsername: doc.telegramUsername,
    telegramFirstName: doc.telegramFirstName,
    preferredLanguage: doc.preferredLanguage || "original",
    linkedAt: doc.linkedAt,
  };
}

export async function updateTelegramLinkLanguage(
  telegramUserId: number,
  preferredLanguage: TargetLanguage,
): Promise<boolean> {
  const collection = await getTelegramLinksCollection();
  const result = await collection.updateOne(
    { telegramUserId },
    { $set: { preferredLanguage } },
  );
  return result.modifiedCount === 1;
}

export async function deleteTelegramLink(userId: string): Promise<boolean> {
  const collection = await getTelegramLinksCollection();
  const result = await collection.deleteOne({ userId });
  return result.deletedCount === 1;
}
