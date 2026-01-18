import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from "@/types/recipe";

const COLLECTION_NAME = "recipes";

export async function getRecipesCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const collection = await getRecipesCollection();
  const now = new Date();

  const recipe = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(recipe);

  return {
    ...recipe,
    _id: result.insertedId.toString(),
  };
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const collection = await getRecipesCollection();

  try {
    const recipe = await collection.findOne({ _id: new ObjectId(id) });
    if (!recipe) return null;

    return {
      ...recipe,
      _id: recipe._id.toString(),
    } as Recipe;
  } catch {
    return null;
  }
}

export async function getRecipesByUserId(userId: string): Promise<Recipe[]> {
  const collection = await getRecipesCollection();

  const recipes = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return recipes.map((recipe) => ({
    ...recipe,
    _id: recipe._id.toString(),
  })) as Recipe[];
}

export async function updateRecipe(
  id: string,
  userId: string,
  input: UpdateRecipeInput
): Promise<Recipe | null> {
  const collection = await getRecipesCollection();

  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return null;

    return {
      ...result,
      _id: result._id.toString(),
    } as Recipe;
  } catch {
    return null;
  }
}

export async function deleteRecipe(id: string, userId: string): Promise<boolean> {
  const collection = await getRecipesCollection();

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

export async function findRecipeBySourceUrl(
  userId: string,
  normalizedUrl: string
): Promise<Recipe | null> {
  const collection = await getRecipesCollection();

  const recipe = await collection.findOne({
    userId,
    "source.url": normalizedUrl,
  });

  if (!recipe) return null;

  return {
    ...recipe,
    _id: recipe._id.toString(),
  } as Recipe;
}
