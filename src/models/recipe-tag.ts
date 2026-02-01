import getDb from "@/lib/db";
import type { RecipeTag } from "@/types/tag";

const COLLECTION_NAME = "recipeTags";

export async function getRecipeTagsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function addRecipeToTag(
  recipeId: string,
  tagId: string,
  userId: string,
): Promise<RecipeTag> {
  const collection = await getRecipeTagsCollection();
  const now = new Date();

  const doc = {
    recipeId,
    tagId,
    userId,
    addedAt: now,
  };

  const existing = await collection.findOne({ recipeId, tagId });
  if (existing) {
    return {
      ...existing,
      _id: existing._id.toString(),
    } as RecipeTag;
  }

  const result = await collection.insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId.toString(),
  };
}

export async function removeRecipeFromTag(
  recipeId: string,
  tagId: string,
  userId: string,
): Promise<boolean> {
  const collection = await getRecipeTagsCollection();

  try {
    const result = await collection.deleteOne({
      recipeId,
      tagId,
      userId,
    });

    return result.deletedCount === 1;
  } catch {
    return false;
  }
}

export async function getRecipeIdsWithTag(
  tagId: string,
  userId: string,
): Promise<string[]> {
  const collection = await getRecipeTagsCollection();

  const docs = await collection
    .find({ tagId, userId })
    .sort({ addedAt: -1 })
    .toArray();

  return docs.map((doc) => doc.recipeId);
}

export async function getTagIdsForRecipe(
  recipeId: string,
  userId: string,
): Promise<string[]> {
  const collection = await getRecipeTagsCollection();

  const docs = await collection.find({ recipeId, userId }).toArray();

  return docs.map((doc) => doc.tagId);
}

export async function isRecipeTagged(
  recipeId: string,
  tagId: string,
): Promise<boolean> {
  const collection = await getRecipeTagsCollection();

  const doc = await collection.findOne({ recipeId, tagId });

  return doc !== null;
}

export async function removeAllRecipesFromTag(
  tagId: string,
  userId: string,
): Promise<number> {
  const collection = await getRecipeTagsCollection();

  const result = await collection.deleteMany({ tagId, userId });

  return result.deletedCount;
}

export async function removeRecipeFromAllTags(
  recipeId: string,
  userId: string,
): Promise<number> {
  const collection = await getRecipeTagsCollection();

  const result = await collection.deleteMany({ recipeId, userId });

  return result.deletedCount;
}

export async function getRecipeCountWithTag(tagId: string): Promise<number> {
  const collection = await getRecipeTagsCollection();

  return collection.countDocuments({ tagId });
}
