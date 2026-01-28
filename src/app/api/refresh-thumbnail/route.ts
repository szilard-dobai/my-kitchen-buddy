import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getRecipeById,
  updateRecipeAuthorAvatar,
  updateRecipeThumbnail,
} from "@/models/recipe";
import {
  getInstagramAuthorAvatar,
  getInstagramThumbnail,
  getTikTokAuthorAvatar,
  getYouTubeStableThumbnail,
} from "@/services/extraction/platform-detector";
import { getOEmbed } from "@/services/oembed";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, type = "thumbnail" } = body as {
      recipeId: string;
      type?: "thumbnail" | "authorAvatar";
    };

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

    if (type === "authorAvatar") {
      let authorAvatarUrl: string | null = null;

      if (platform === "instagram") {
        authorAvatarUrl = await getInstagramAuthorAvatar(sourceUrl);
      } else if (platform === "tiktok") {
        authorAvatarUrl = await getTikTokAuthorAvatar(sourceUrl);
      } else {
        return NextResponse.json(
          {
            error:
              "Author avatar refresh is only supported for Instagram and TikTok",
          },
          { status: 400 },
        );
      }

      if (!authorAvatarUrl) {
        return NextResponse.json(
          { error: "Could not fetch author avatar" },
          { status: 404 },
        );
      }

      await updateRecipeAuthorAvatar(recipeId, session.user.id, authorAvatarUrl);

      return NextResponse.json({ authorAvatarUrl });
    }

    let thumbnailUrl: string | undefined;

    if (platform === "youtube") {
      thumbnailUrl = getYouTubeStableThumbnail(sourceUrl) ?? undefined;
    } else if (platform === "instagram") {
      thumbnailUrl = (await getInstagramThumbnail(sourceUrl)) ?? undefined;
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
