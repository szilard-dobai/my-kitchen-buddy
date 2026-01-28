import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAuthorById, updateAuthorAvatar } from "@/models/author";
import {
  getInstagramAuthorAvatar,
  getTikTokAuthorAvatar,
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
    } else {
      return NextResponse.json(
        { error: "Avatar refresh is only supported for Instagram and TikTok" },
        { status: 400 },
      );
    }

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Could not fetch author avatar" },
        { status: 404 },
      );
    }

    await updateAuthorAvatar(authorId, avatarUrl);

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Error refreshing author avatar:", error);
    return NextResponse.json(
      { error: "Failed to refresh author avatar" },
      { status: 500 },
    );
  }
}
