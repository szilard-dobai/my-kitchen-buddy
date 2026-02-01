import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateBody } from "@/lib/validation";
import { updateCollectionSchema } from "@/lib/validation/schemas/collections";
import {
  deleteCollection,
  getCollectionById,
  updateCollection,
} from "@/models/collection";
import { removeAllRecipesFromCollection } from "@/models/recipe-collection";

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

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const validation = await validateBody(request, updateCollectionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const collection = await updateCollection(
      id,
      session.user.id,
      validation.data,
    );

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
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

    await removeAllRecipesFromCollection(id, session.user.id);

    const deleted = await deleteCollection(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete collection" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 },
    );
  }
}
