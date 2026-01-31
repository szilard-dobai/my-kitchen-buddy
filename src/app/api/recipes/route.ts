import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateBody } from "@/lib/validation";
import { createRecipeSchema } from "@/lib/validation/schemas/recipes";
import { createRecipe, getRecipesByUserId } from "@/models/recipe";

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

    const validation = await validateBody(request, createRecipeSchema);
    if (!validation.success) {
      return validation.response;
    }

    const recipe = await createRecipe({
      userId: session.user.id,
      ...validation.data,
      source: validation.data.source || { url: "", platform: "other" },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 },
    );
  }
}
