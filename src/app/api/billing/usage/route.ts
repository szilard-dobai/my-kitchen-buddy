import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollectionCount } from "@/models/collection";
import { getOrCreateSubscription } from "@/models/subscription";
import { getTagCount } from "@/models/tag";
import { COLLECTION_LIMITS } from "@/types/collection";
import type { UsageInfo } from "@/types/subscription";
import { TAG_LIMITS } from "@/types/tag";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [subscription, collectionsUsed, tagsUsed] = await Promise.all([
      getOrCreateSubscription(userId),
      getCollectionCount(userId),
      getTagCount(userId),
    ]);

    const collectionsLimit = COLLECTION_LIMITS[subscription.planTier];
    const tagsLimit = TAG_LIMITS[subscription.planTier];

    const usage: UsageInfo = {
      used: subscription.extractionsUsed,
      limit: subscription.extractionsLimit,
      planTier: subscription.planTier,
      currentPeriodEnd: subscription.currentPeriodEnd,
      features: {
        extractions: {
          used: subscription.extractionsUsed,
          limit: subscription.extractionsLimit,
          atLimit: subscription.extractionsUsed >= subscription.extractionsLimit,
        },
        collections: {
          used: collectionsUsed,
          limit: collectionsLimit,
          atLimit: collectionsUsed >= collectionsLimit,
        },
        tags: {
          used: tagsUsed,
          limit: tagsLimit,
          atLimit: tagsUsed >= tagsLimit,
        },
      },
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 },
    );
  }
}
