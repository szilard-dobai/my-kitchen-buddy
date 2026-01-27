import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAuthenticated, validateSameOrigin } from "@/lib/tracking/api";
import type { DeviceType, TrackingEventType } from "@/lib/tracking/types";
import { getTrackingCollection, insertTrackingEvent } from "@/models/tracking";

export const dynamic = "force-dynamic";

type SortField = "timestamp" | "type" | "deviceId";
type SortOrder = "asc" | "desc";

export async function GET(request: Request) {
  const forbidden = validateSameOrigin(request);
  if (forbidden) return forbidden;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const deviceId = url.searchParams.get("deviceId");
  const search = url.searchParams.get("search");
  const country = url.searchParams.get("country");
  const region = url.searchParams.get("region");
  const sortField = (url.searchParams.get("sortField") ||
    "timestamp") as SortField;
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as SortOrder;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  try {
    const collection = await getTrackingCollection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (type && type !== "all") filter.type = type;
    if (deviceId) filter.deviceId = { $regex: deviceId, $options: "i" };
    if (country && country !== "all") filter.country = country;
    if (region && region !== "all") filter.region = region;
    if (search) {
      filter.$or = [
        { metadata: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const [events, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(offset)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      events,
      total,
      hasMore: offset + events.length < total,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, deviceId, deviceType, metadata } = body as {
      type: TrackingEventType;
      deviceId: string;
      deviceType: DeviceType;
      metadata?: Record<string, unknown>;
    };

    if (!type || !deviceId || !deviceType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const country = request.headers.get("x-vercel-ip-country") || undefined;
    const region =
      request.headers.get("x-vercel-ip-country-region") || undefined;

    let userId: string | undefined;
    try {
      const session = await getSession();
      userId = session?.user?.id;
    } catch {
      // Ignore session errors for tracking
    }

    await insertTrackingEvent({
      type,
      deviceId,
      deviceType,
      userId,
      country,
      region,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 },
    );
  }
}
