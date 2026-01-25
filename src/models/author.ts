import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import type { Author, CreateAuthorInput, Platform } from "@/types/author";

const COLLECTION_NAME = "authors";

async function getAuthorsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function findAuthorByPlatformAndUsername(
  platform: Platform,
  username: string,
): Promise<Author | null> {
  const collection = await getAuthorsCollection();
  const doc = await collection.findOne({ platform, username });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    platform: doc.platform,
    username: doc.username,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
    verified: doc.verified,
    firstSeenAt: doc.firstSeenAt,
    lastUpdatedAt: doc.lastUpdatedAt,
  } as Author;
}

export async function findAuthorById(id: string): Promise<Author | null> {
  const collection = await getAuthorsCollection();

  try {
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return {
      _id: doc._id.toString(),
      platform: doc.platform,
      username: doc.username,
      displayName: doc.displayName,
      avatarUrl: doc.avatarUrl,
      verified: doc.verified,
      firstSeenAt: doc.firstSeenAt,
      lastUpdatedAt: doc.lastUpdatedAt,
    } as Author;
  } catch {
    return null;
  }
}

export async function upsertAuthor(input: CreateAuthorInput): Promise<Author> {
  const collection = await getAuthorsCollection();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    { platform: input.platform, username: input.username },
    {
      $set: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        verified: input.verified,
        lastUpdatedAt: now,
      },
      $setOnInsert: {
        platform: input.platform,
        username: input.username,
        firstSeenAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return {
    _id: result!._id.toString(),
    platform: result!.platform,
    username: result!.username,
    displayName: result!.displayName,
    avatarUrl: result!.avatarUrl,
    verified: result!.verified,
    firstSeenAt: result!.firstSeenAt,
    lastUpdatedAt: result!.lastUpdatedAt,
  } as Author;
}
