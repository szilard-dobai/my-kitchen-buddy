import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollectionById } from "@/models/collection";
import { getRecipeIdsInCollection } from "@/models/recipe-collection";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const collection = await getCollectionById(id);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipeIds = await getRecipeIdsInCollection(id, session.user.id);

    return NextResponse.json({ recipeIds });
  } catch (error) {
    console.error("Error fetching recipes in collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 },
    );
  }
}
