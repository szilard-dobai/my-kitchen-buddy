import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRecipeById } from "@/models/recipe";
import {
  addRecipeToTag,
  removeRecipeFromTag,
  isRecipeTagged,
} from "@/models/recipe-tag";
import { getTagById } from "@/models/tag";

interface RouteParams {
  params: Promise<{ id: string; recipeId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tagId, recipeId } = await params;

    const tag = await getTagById(tagId);
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recipeTag = await addRecipeToTag(recipeId, tagId, session.user.id);

    return NextResponse.json(recipeTag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to recipe:", error);
    return NextResponse.json(
      { error: "Failed to add tag to recipe" },
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

    const { id: tagId, recipeId } = await params;

    const tag = await getTagById(tagId);
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isTagged = await isRecipeTagged(recipeId, tagId);
    if (!isTagged) {
      return NextResponse.json({ error: "Recipe not tagged" }, { status: 404 });
    }

    const removed = await removeRecipeFromTag(recipeId, tagId, session.user.id);

    if (!removed) {
      return NextResponse.json(
        { error: "Failed to remove tag from recipe" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from recipe:", error);
    return NextResponse.json(
      { error: "Failed to remove tag from recipe" },
      { status: 500 },
    );
  }
}
