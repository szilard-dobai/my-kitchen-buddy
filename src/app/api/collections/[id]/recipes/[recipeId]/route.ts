import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollectionById } from "@/models/collection";
import { getRecipeById } from "@/models/recipe";
import {
  addRecipeToCollection,
  removeRecipeFromCollection,
  isRecipeInCollection,
} from "@/models/recipe-collection";

interface RouteParams {
  params: Promise<{ id: string; recipeId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId, recipeId } = await params;

    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipeCollection = await addRecipeToCollection(
      recipeId,
      collectionId,
      session.user.id,
    );

    return NextResponse.json(recipeCollection, { status: 201 });
  } catch (error) {
    console.error("Error adding recipe to collection:", error);
    return NextResponse.json(
      { error: "Failed to add recipe to collection" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId, recipeId } = await params;

    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const inCollection = await isRecipeInCollection(recipeId, collectionId);
    if (!inCollection) {
      return NextResponse.json(
        { error: "Recipe not in collection" },
        { status: 404 },
      );
    }

    const removed = await removeRecipeFromCollection(
      recipeId,
      collectionId,
      session.user.id,
    );

    if (!removed) {
      return NextResponse.json(
        { error: "Failed to remove recipe from collection" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing recipe from collection:", error);
    return NextResponse.json(
      { error: "Failed to remove recipe from collection" },
      { status: 500 },
    );
  }
}
