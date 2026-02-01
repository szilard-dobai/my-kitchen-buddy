import getDb from "@/lib/db";
import type { RecipeCollection } from "@/types/collection";

const COLLECTION_NAME = "recipeCollections";

export async function getRecipeCollectionsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function addRecipeToCollection(
  recipeId: string,
  collectionId: string,
  userId: string,
): Promise<RecipeCollection> {
  const collection = await getRecipeCollectionsCollection();
  const now = new Date();

  const doc = {
    recipeId,
    collectionId,
    userId,
    addedAt: now,
  };

  const existing = await collection.findOne({ recipeId, collectionId });
  if (existing) {
    return {
      ...existing,
      _id: existing._id.toString(),
    } as RecipeCollection;
  }

  const result = await collection.insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId.toString(),
  };
}

export async function removeRecipeFromCollection(
  recipeId: string,
  collectionId: string,
  userId: string,
): Promise<boolean> {
  const collection = await getRecipeCollectionsCollection();

  try {
    const result = await collection.deleteOne({
      recipeId,
      collectionId,
      userId,
    });

    return result.deletedCount === 1;
  } catch {
    return false;
  }
}

export async function getRecipeIdsInCollection(
  collectionId: string,
  userId: string,
): Promise<string[]> {
  const collection = await getRecipeCollectionsCollection();

  const docs = await collection
    .find({ collectionId, userId })
    .sort({ addedAt: -1 })
    .toArray();

  return docs.map((doc) => doc.recipeId);
}

export async function getCollectionIdsForRecipe(
  recipeId: string,
  userId: string,
): Promise<string[]> {
  const collection = await getRecipeCollectionsCollection();

  const docs = await collection.find({ recipeId, userId }).toArray();

  return docs.map((doc) => doc.collectionId);
}

export async function isRecipeInCollection(
  recipeId: string,
  collectionId: string,
): Promise<boolean> {
  const collection = await getRecipeCollectionsCollection();

  const doc = await collection.findOne({ recipeId, collectionId });

  return doc !== null;
}

export async function removeAllRecipesFromCollection(
  collectionId: string,
  userId: string,
): Promise<number> {
  const collection = await getRecipeCollectionsCollection();

  const result = await collection.deleteMany({ collectionId, userId });

  return result.deletedCount;
}

export async function removeRecipeFromAllCollections(
  recipeId: string,
  userId: string,
): Promise<number> {
  const collection = await getRecipeCollectionsCollection();

  const result = await collection.deleteMany({ recipeId, userId });

  return result.deletedCount;
}

export async function getRecipeCountInCollection(
  collectionId: string,
): Promise<number> {
  const collection = await getRecipeCollectionsCollection();

  return collection.countDocuments({ collectionId });
}
