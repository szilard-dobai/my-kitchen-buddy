import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRecipeById, updateRecipeThumbnail } from "@/models/recipe";
import { getYouTubeStableThumbnail } from "@/services/extraction/platform-detector";
import { getOEmbed } from "@/services/oembed";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId } = body as { recipeId: string };

    if (!recipeId) {
      return NextResponse.json(
        { error: "recipeId is required" },
        { status: 400 },
      );
    }

    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sourceUrl = recipe.source.url;
    const platform = recipe.source.platform;

    let thumbnailUrl: string | undefined;

    if (platform === "youtube") {
      thumbnailUrl = getYouTubeStableThumbnail(sourceUrl) ?? undefined;
    } else {
      const oembed = await getOEmbed(sourceUrl);
      thumbnailUrl = oembed.thumbnailUrl;
    }

    if (!thumbnailUrl) {
      return NextResponse.json(
        { error: "Could not fetch thumbnail" },
        { status: 404 },
      );
    }

    await updateRecipeThumbnail(recipeId, session.user.id, thumbnailUrl);

    return NextResponse.json({ thumbnailUrl });
  } catch (error) {
    console.error("Error refreshing thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to refresh thumbnail" },
      { status: 500 },
    );
  }
}
