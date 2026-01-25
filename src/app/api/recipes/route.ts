import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRecipesByUserId, createRecipe } from "@/models/recipe";
import type { CreateRecipeInput } from "@/types/recipe";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipes = await getRecipesByUserId(session.user.id);
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const recipeInput: CreateRecipeInput = {
      userId: session.user.id,
      title: body.title,
      description: body.description,
      cuisineType: body.cuisineType,
      difficulty: body.difficulty,
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      totalTime: body.totalTime,
      servings: body.servings,
      caloriesPerServing: body.caloriesPerServing,
      dietaryTags: body.dietaryTags || [],
      mealType: body.mealType,
      ingredients: body.ingredients || [],
      instructions: body.instructions || [],
      tipsAndNotes: body.tipsAndNotes || [],
      equipment: body.equipment || [],
      source: body.source || {
        url: "",
        platform: "other",
      },
      extractionMetadata: body.extractionMetadata,
    };

    const recipe = await createRecipe(recipeInput);
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 },
    );
  }
}
