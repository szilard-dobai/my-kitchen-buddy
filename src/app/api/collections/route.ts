import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateBody } from "@/lib/validation";
import { createCollectionSchema } from "@/lib/validation/schemas/collections";
import {
  createCollection,
  getCollectionCount,
  getCollectionsWithCountByUserId,
} from "@/models/collection";
import { getOrCreateSubscription } from "@/models/subscription";
import { COLLECTION_LIMITS } from "@/types/collection";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await getCollectionsWithCountByUserId(session.user.id);
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
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

    const validation = await validateBody(request, createCollectionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const currentCount = await getCollectionCount(session.user.id);
    const limit = COLLECTION_LIMITS[subscription.planTier];

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: "Collection limit reached",
          limitReached: true,
          currentCount,
          limit,
        },
        { status: 409 },
      );
    }

    const collection = await createCollection({
      userId: session.user.id,
      ...validation.data,
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
}
