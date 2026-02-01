import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSimilarRecipes } from "@/models/recipe";
import { getOrCreateSubscription } from "@/models/subscription";
import { SIMILAR_RECIPES_LIMITS } from "@/types/subscription";

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
    const subscription = await getOrCreateSubscription(session.user.id);
    const limit = SIMILAR_RECIPES_LIMITS[subscription.planTier];

    const result = await getSimilarRecipes(id, session.user.id, limit);

    if (!result) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching similar recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar recipes" },
      { status: 500 },
    );
  }
}
