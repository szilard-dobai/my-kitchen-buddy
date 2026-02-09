import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAuthorById, updateAuthorAvatar } from "@/models/author";
import {
  findRecipeSourceUrlByAuthorId,
  updateRecipesByAuthorId,
} from "@/models/recipe";
import {
  getInstagramAuthorAvatar,
  getTikTokAuthorAvatar,
  getYouTubeAuthorAvatar,
} from "@/services/extraction/platform-detector";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { authorId } = body as { authorId: string };

    if (!authorId) {
      return NextResponse.json(
        { error: "authorId is required" },
        { status: 400 },
      );
    }

    const author = await findAuthorById(authorId);

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    let avatarUrl: string | null = null;

    if (author.platform === "instagram") {
      const profileUrl = `https://www.instagram.com/${author.username}/`;
      avatarUrl = await getInstagramAuthorAvatar(profileUrl);
    } else if (author.platform === "tiktok") {
      const profileUrl = `https://www.tiktok.com/@${author.username}`;
      avatarUrl = await getTikTokAuthorAvatar(profileUrl);
    } else if (author.platform === "youtube") {
      const videoUrl = await findRecipeSourceUrlByAuthorId(authorId);
      if (videoUrl) {
        avatarUrl = await getYouTubeAuthorAvatar(videoUrl);
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Avatar refresh is only supported for Instagram, TikTok, and YouTube",
        },
        { status: 400 },
      );
    }

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Could not fetch author avatar" },
        { status: 404 },
      );
    }

    const [authorUpdated] = await Promise.all([
      updateAuthorAvatar(authorId, avatarUrl),
      updateRecipesByAuthorId(authorId, avatarUrl),
    ]);

    if (!authorUpdated) {
      return NextResponse.json(
        { error: "Failed to update author avatar in database" },
        { status: 500 },
      );
    }

    return NextResponse.json({ avatarUrl, authorId });
  } catch (error) {
    console.error("Error refreshing author avatar:", error);
    return NextResponse.json(
      { error: "Failed to refresh author avatar" },
      { status: 500 },
    );
  }
}
