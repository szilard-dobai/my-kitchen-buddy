import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/types/collection";

const COLLECTION_NAME = "collections";

export async function getCollectionsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<Collection> {
  const collection = await getCollectionsCollection();
  const now = new Date();

  const doc = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId.toString(),
    recipeCount: 0,
  };
}

export async function getCollectionById(
  id: string,
): Promise<Collection | null> {
  const db = await getDb();

  try {
    const result = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "recipeCollections",
            let: { collectionId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$collectionId", "$$collectionId"],
                  },
                },
              },
            ],
            as: "recipes",
          },
        },
        {
          $addFields: {
            recipeCount: { $size: "$recipes" },
          },
        },
        {
          $project: {
            recipes: 0,
          },
        },
      ])
      .toArray();

    if (result.length === 0) return null;

    return {
      ...result[0],
      _id: result[0]._id.toString(),
    } as Collection;
  } catch {
    return null;
  }
}

export async function getCollectionsByUserId(
  userId: string,
): Promise<Collection[]> {
  return getCollectionsWithCountByUserId(userId);
}

export async function getCollectionsWithCountByUserId(
  userId: string,
): Promise<Collection[]> {
  const db = await getDb();

  const result = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "recipeCollections",
          let: { collectionId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$collectionId", "$$collectionId"],
                },
              },
            },
          ],
          as: "recipes",
        },
      },
      {
        $addFields: {
          recipeCount: { $size: "$recipes" },
        },
      },
      {
        $project: {
          recipes: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  return result.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  })) as Collection[];
}

export async function getCollectionCount(userId: string): Promise<number> {
  const collection = await getCollectionsCollection();
  return collection.countDocuments({ userId });
}

export async function updateCollection(
  id: string,
  userId: string,
  input: UpdateCollectionInput,
): Promise<Collection | null> {
  const collection = await getCollectionsCollection();

  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!result) return null;

    return getCollectionById(id);
  } catch {
    return null;
  }
}

export async function deleteCollection(
  id: string,
  userId: string,
): Promise<boolean> {
  const collection = await getCollectionsCollection();

  try {
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId,
    });

    return result.deletedCount === 1;
  } catch {
    return false;
  }
}
