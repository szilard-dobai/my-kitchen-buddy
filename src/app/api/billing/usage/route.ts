import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOrCreateSubscription } from "@/models/subscription";
import type { UsageInfo } from "@/types/subscription";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getOrCreateSubscription(session.user.id);

    const usage: UsageInfo = {
      used: subscription.extractionsUsed,
      limit: subscription.extractionsLimit,
      planTier: subscription.planTier,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
