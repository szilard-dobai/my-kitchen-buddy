import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateBody } from "@/lib/validation";
import { createTagSchema } from "@/lib/validation/schemas/tags";
import { getOrCreateSubscription } from "@/models/subscription";
import { createTag, getTagCount, getTagsWithCountByUserId } from "@/models/tag";
import { TAG_LIMITS } from "@/types/tag";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await getTagsWithCountByUserId(session.user.id);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
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

    const validation = await validateBody(request, createTagSchema);
    if (!validation.success) {
      return validation.response;
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const currentCount = await getTagCount(session.user.id);
    const limit = TAG_LIMITS[subscription.planTier];

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: "Tag limit reached",
          limitReached: true,
          currentCount,
          limit,
        },
        { status: 409 },
      );
    }

    const tag = await createTag({
      userId: session.user.id,
      ...validation.data,
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}
