import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import type { CreateTagInput, Tag, UpdateTagInput } from "@/types/tag";

const COLLECTION_NAME = "tags";

export async function getTagsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const collection = await getTagsCollection();
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

export async function getTagById(id: string): Promise<Tag | null> {
  const db = await getDb();

  try {
    const result = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "recipeTags",
            let: { tagId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$tagId", "$$tagId"],
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
    } as Tag;
  } catch {
    return null;
  }
}

export async function getTagsByUserId(userId: string): Promise<Tag[]> {
  return getTagsWithCountByUserId(userId);
}

export async function getTagsWithCountByUserId(userId: string): Promise<Tag[]> {
  const db = await getDb();

  const result = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "recipeTags",
          let: { tagId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$tagId", "$$tagId"],
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
  })) as Tag[];
}

export async function getTagCount(userId: string): Promise<number> {
  const collection = await getTagsCollection();
  return collection.countDocuments({ userId });
}

export async function updateTag(
  id: string,
  userId: string,
  input: UpdateTagInput,
): Promise<Tag | null> {
  const collection = await getTagsCollection();

  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!result) return null;

    return getTagById(id);
  } catch {
    return null;
  }
}

export async function deleteTag(id: string, userId: string): Promise<boolean> {
  const collection = await getTagsCollection();

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
