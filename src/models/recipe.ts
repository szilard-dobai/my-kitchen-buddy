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

    const sourceIngredients = (sourceRecipe.ingredients || []).map(
      (i: { name: string }) => i.name.toLowerCase().trim(),
    );
    const sourceCuisine = sourceRecipe.cuisineType || "";
    const sourceAuthorId = sourceRecipe.source?.authorId || "";

    const pipeline = [
      {
        $match: {
          userId,
          _id: { $ne: new ObjectId(recipeId) },
        },
      },
      {
        $addFields: {
          ingredientNames: {
            $map: {
              input: { $ifNull: ["$ingredients", []] },
              as: "ing",
              in: { $toLower: { $trim: { input: "$$ing.name" } } },
            },
          },
        },
      },
      {
        $addFields: {
          commonIngredients: {
            $size: {
              $setIntersection: ["$ingredientNames", sourceIngredients],
            },
          },
          totalIngredients: {
            $size: {
              $setUnion: ["$ingredientNames", sourceIngredients],
            },
          },
          cuisineMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$cuisineType", null] },
                  { $ne: ["$cuisineType", ""] },
                  { $eq: ["$cuisineType", sourceCuisine] },
                ],
              },
              1,
              0,
            ],
          },
          authorMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$source.authorId", null] },
                  { $ne: ["$source.authorId", ""] },
                  { $eq: ["$source.authorId", sourceAuthorId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          ingredientScore: {
            $cond: [
              { $eq: ["$totalIngredients", 0] },
              0,
              { $divide: ["$commonIngredients", "$totalIngredients"] },
            ],
          },
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ["$ingredientScore", 0.5] },
              { $multiply: ["$cuisineMatch", 0.25] },
              { $multiply: ["$authorMatch", 0.25] },
            ],
          },
        },
      },
      {
        $match: {
          similarityScore: { $gte: 0.1 },
        },
      },
      {
        $sort: { similarityScore: -1 as const },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          "source.thumbnailUrl": 1,
          "source.authorAvatarUrl": 1,
          "source.authorUsername": 1,
          similarityScore: 1,
        },
      },
    ];

    const similarRecipes = await collection.aggregate(pipeline).toArray();

    const countPipeline = [
      {
        $match: {
          userId,
          _id: { $ne: new ObjectId(recipeId) },
        },
      },
      {
        $addFields: {
          ingredientNames: {
            $map: {
              input: { $ifNull: ["$ingredients", []] },
              as: "ing",
              in: { $toLower: { $trim: { input: "$$ing.name" } } },
            },
          },
        },
      },
      {
        $addFields: {
          commonIngredients: {
            $size: {
              $setIntersection: ["$ingredientNames", sourceIngredients],
            },
          },
          totalIngredients: {
            $size: {
              $setUnion: ["$ingredientNames", sourceIngredients],
            },
          },
          cuisineMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$cuisineType", null] },
                  { $ne: ["$cuisineType", ""] },
                  { $eq: ["$cuisineType", sourceCuisine] },
                ],
              },
              1,
              0,
            ],
          },
          authorMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$source.authorId", null] },
                  { $ne: ["$source.authorId", ""] },
                  { $eq: ["$source.authorId", sourceAuthorId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          ingredientScore: {
            $cond: [
              { $eq: ["$totalIngredients", 0] },
              0,
              { $divide: ["$commonIngredients", "$totalIngredients"] },
            ],
          },
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ["$ingredientScore", 0.5] },
              { $multiply: ["$cuisineMatch", 0.25] },
              { $multiply: ["$authorMatch", 0.25] },
            ],
          },
        },
      },
      {
        $match: {
          similarityScore: { $gte: 0.1 },
        },
      },
      {
        $limit: 9,
      },
      {
        $count: "count",
      },
    ];

    const countResult = await collection.aggregate(countPipeline).toArray();
    const totalSimilar = countResult[0]?.count || 0;

    const recipes = similarRecipes.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      thumbnailUrl: r.source?.thumbnailUrl,
      authorAvatarUrl: r.source?.authorAvatarUrl,
      authorUsername: r.source?.authorUsername,
    }));

    return {
      recipes,
      hasMore: totalSimilar > limit,
      totalSimilar: Math.min(totalSimilar, 9),
    };
  } catch {
    return null;
  }
}
