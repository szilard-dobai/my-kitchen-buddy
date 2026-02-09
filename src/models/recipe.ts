import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  SimilarRecipesResponse,
} from "@/types/recipe";

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
    collectionIds: [],
    tagIds: [],
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

export async function getRecipeWithCollections(
  id: string,
  userId: string,
): Promise<Recipe | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  try {
    const recipes = await collection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "recipeCollections",
            let: { recipeId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$recipeId", "$$recipeId"] },
                      { $eq: ["$userId", userId] },
                    ],
                  },
                },
              },
            ],
            as: "collections",
          },
        },
        {
          $lookup: {
            from: "recipeTags",
            let: { recipeId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$recipeId", "$$recipeId"] },
                      { $eq: ["$userId", userId] },
                    ],
                  },
                },
              },
            ],
            as: "tags",
          },
        },
        {
          $addFields: {
            collectionIds: "$collections.collectionId",
            tagIds: "$tags.tagId",
          },
        },
        {
          $project: {
            collections: 0,
            tags: 0,
          },
        },
      ])
      .toArray();

    if (recipes.length === 0) return null;

    return {
      ...recipes[0],
      _id: recipes[0]._id.toString(),
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

export async function getRecipesWithCollectionsByUserId(
  userId: string,
): Promise<Recipe[]> {
  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  const recipes = await collection
    .aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "recipeCollections",
          let: { recipeId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$recipeId", "$$recipeId"] },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "collections",
        },
      },
      {
        $lookup: {
          from: "recipeTags",
          let: { recipeId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$recipeId", "$$recipeId"] },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "tags",
        },
      },
      {
        $addFields: {
          collectionIds: "$collections.collectionId",
          tagIds: "$tags.tagId",
        },
      },
      {
        $project: {
          collections: 0,
          tags: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  return recipes.map((recipe) => ({
    ...recipe,
    _id: recipe._id.toString(),
  })) as Recipe[];
}

export async function updateRecipe(
  id: string,
  userId: string,
  input: UpdateRecipeInput,
): Promise<Recipe | null> {
  const collection = await getRecipesCollection();

  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: "after" },
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

export async function deleteRecipe(
  id: string,
  userId: string,
): Promise<boolean> {
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
  normalizedUrl: string,
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

export async function updateRecipeThumbnail(
  id: string,
  userId: string,
  thumbnailUrl: string,
): Promise<boolean> {
  const collection = await getRecipesCollection();

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { "source.thumbnailUrl": thumbnailUrl, updatedAt: new Date() } },
    );

    return result.modifiedCount === 1;
  } catch {
    return false;
  }
}

export async function updateRecipeAuthorAvatar(
  id: string,
  userId: string,
  authorAvatarUrl: string,
): Promise<boolean> {
  const collection = await getRecipesCollection();

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId },
      {
        $set: {
          "source.authorAvatarUrl": authorAvatarUrl,
          updatedAt: new Date(),
        },
      },
    );

    return result.modifiedCount === 1;
  } catch {
    return false;
  }
}

export async function updateRecipesByAuthorId(
  authorId: string,
  avatarUrl: string,
): Promise<number> {
  const collection = await getRecipesCollection();

  try {
    const result = await collection.updateMany(
      { "source.authorId": authorId },
      {
        $set: {
          "source.authorAvatarUrl": avatarUrl,
          updatedAt: new Date(),
        },
      },
    );

    return result.modifiedCount;
  } catch (error) {
    console.error(
      `updateRecipesByAuthorId: Error updating recipes for author ${authorId}:`,
      error,
    );
    return 0;
  }
}

export async function findRecipeSourceUrlByAuthorId(
  authorId: string,
): Promise<string | null> {
  const collection = await getRecipesCollection();

  try {
    const recipe = await collection.findOne(
      { "source.authorId": authorId },
      { projection: { "source.url": 1 } },
    );

    return recipe?.source?.url || null;
  } catch {
    return null;
  }
}

const CUISINE_GROUPS: Record<string, string[]> = {
  "latin-american": [
    "mexican",
    "southwest",
    "tex-mex",
    "latin",
    "spanish",
    "cuban",
  ],
  asian: ["chinese", "japanese", "korean", "thai", "vietnamese", "asian"],
  mediterranean: ["italian", "greek", "mediterranean", "middle eastern"],
  american: ["american", "southern", "cajun", "bbq", "comfort food"],
  indian: ["indian", "curry", "south asian"],
};

function getCuisineGroup(cuisine: string): string | null {
  const normalized = cuisine.toLowerCase().trim();
  for (const [group, cuisines] of Object.entries(CUISINE_GROUPS)) {
    if (
      cuisines.some((c) => normalized.includes(c) || c.includes(normalized))
    ) {
      return group;
    }
  }
  return null;
}

function extractKeyIngredientWords(ingredients: string[]): string[] {
  const stopWords = new Set([
    "fresh",
    "dried",
    "ground",
    "chopped",
    "diced",
    "sliced",
    "minced",
    "grated",
    "shredded",
    "lean",
    "low",
    "fat",
    "reduced",
    "light",
    "extra",
    "virgin",
    "organic",
    "whole",
    "raw",
    "cooked",
    "frozen",
    "canned",
    "large",
    "small",
    "medium",
    "thin",
    "thick",
    "fine",
    "coarse",
    "hot",
    "cold",
    "warm",
    "room",
    "temperature",
  ]);

  const keyWords = new Set<string>();

  for (const ingredient of ingredients) {
    const words = ingredient
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const word of words) {
      keyWords.add(word);
    }
  }

  return Array.from(keyWords);
}

function extractTitleWords(title: string): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "with",
    "for",
    "in",
    "on",
    "my",
    "best",
    "easy",
    "quick",
    "simple",
    "homemade",
    "style",
    "recipe",
    "high",
    "low",
    "protein",
    "calorie",
    "fat",
    "carb",
  ]);

  return title
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

export async function getSimilarRecipes(
  recipeId: string,
  userId: string,
  limit: number,
): Promise<SimilarRecipesResponse | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  try {
    const sourceRecipe = await collection.findOne({
      _id: new ObjectId(recipeId),
      userId,
    });

    if (!sourceRecipe) return null;

    const sourceIngredientsFull = (sourceRecipe.ingredients || []).map(
      (i: { name: string }) => i.name.toLowerCase().trim(),
    );
    const sourceIngredientWords = extractKeyIngredientWords(
      sourceIngredientsFull,
    );
    const sourceCuisine = sourceRecipe.cuisineType || "";
    const sourceCuisineGroup = getCuisineGroup(sourceCuisine);
    const sourceTitle = sourceRecipe.title || "";
    const sourceTitleWords = extractTitleWords(sourceTitle);

    const allUserRecipes = await collection
      .find({ userId, _id: { $ne: new ObjectId(recipeId) } })
      .project({
        _id: 1,
        title: 1,
        cuisineType: 1,
        ingredients: 1,
        "source.thumbnailUrl": 1,
        "source.authorAvatarUrl": 1,
        "source.authorUsername": 1,
        "source.authorId": 1,
      })
      .toArray();

    const scoredRecipes = allUserRecipes
      .map((recipe) => {
        const recipeIngredientsFull = (recipe.ingredients || []).map(
          (i: { name: string }) => i.name.toLowerCase().trim(),
        );
        const recipeIngredientWords = extractKeyIngredientWords(
          recipeIngredientsFull,
        );

        const commonWords = sourceIngredientWords.filter((w) =>
          recipeIngredientWords.includes(w),
        );
        const unionWords = new Set([
          ...sourceIngredientWords,
          ...recipeIngredientWords,
        ]);
        const ingredientScore =
          unionWords.size > 0 ? commonWords.length / unionWords.size : 0;

        const recipeCuisine = recipe.cuisineType || "";
        const recipeCuisineGroup = getCuisineGroup(recipeCuisine);
        let cuisineScore = 0;
        if (sourceCuisine && recipeCuisine) {
          if (sourceCuisine.toLowerCase() === recipeCuisine.toLowerCase()) {
            cuisineScore = 1;
          } else if (
            sourceCuisineGroup &&
            sourceCuisineGroup === recipeCuisineGroup
          ) {
            cuisineScore = 0.7;
          }
        }

        const recipeTitleWords = extractTitleWords(recipe.title || "");
        const commonTitleWords = sourceTitleWords.filter((w) =>
          recipeTitleWords.includes(w),
        );
        const unionTitleWords = new Set([
          ...sourceTitleWords,
          ...recipeTitleWords,
        ]);
        const titleScore =
          unionTitleWords.size > 0
            ? commonTitleWords.length / unionTitleWords.size
            : 0;

        const similarityScore =
          ingredientScore * 0.5 + cuisineScore * 0.25 + titleScore * 0.25;

        return {
          _id: recipe._id.toString(),
          title: recipe.title,
          source: recipe.source,
          similarityScore,
        };
      })
      .filter((r) => r.similarityScore >= 0.05)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    const totalSimilar = Math.min(scoredRecipes.length, 9);
    const limitedRecipes = scoredRecipes.slice(0, limit);

    const recipes = limitedRecipes.map((r) => ({
      _id: r._id,
      title: r.title,
      thumbnailUrl: r.source?.thumbnailUrl,
      authorAvatarUrl: r.source?.authorAvatarUrl,
      authorUsername: r.source?.authorUsername,
      authorId: r.source?.authorId,
    }));

    return {
      recipes,
      hasMore: totalSimilar > limit,
      totalSimilar,
    };
  } catch {
    return null;
  }
}
