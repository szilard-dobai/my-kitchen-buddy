import { NextResponse } from "next/server";
import { isAuthenticated, validateSameOrigin } from "@/lib/tracking/api";
import { getTrackingCollection } from "@/models/tracking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const forbidden = validateSameOrigin(request);
  if (forbidden) return forbidden;

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collection = await getTrackingCollection();

    const [
      totalEvents,
      uniqueCountries,
      uniqueDevices,
      uniqueUsers,
      deviceTypeCounts,
      extractionAttempts,
      extractionSuccesses,
      extractionErrors,
      pageViews,
      eventTypeBreakdown,
      countriesByDevices,
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.distinct("country").then((arr) => arr.filter(Boolean).length),
      collection.distinct("deviceId").then((arr) => arr.length),
      collection.distinct("userId").then((arr) => arr.filter(Boolean).length),
      collection
        .aggregate([
          { $match: { deviceType: { $exists: true, $ne: null } } },
          { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        ])
        .toArray(),
      collection.countDocuments({ type: "extraction_attempt" }),
      collection.countDocuments({ type: "extraction_success" }),
      collection.countDocuments({ type: "extraction_error" }),
      collection
        .aggregate([
          {
            $match: {
              type: {
                $in: [
                  "homepage_view",
                  "recipes_view",
                  "extract_view",
                  "settings_view",
                  "recipe_detail_view",
                  "login_view",
                  "register_view",
                ],
              },
            },
          },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
        .toArray(),
      collection
        .aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }])
        .toArray(),
      collection
        .aggregate([
          { $match: { country: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$country",
              devices: { $addToSet: "$deviceId" },
            },
          },
          {
            $project: {
              country: "$_id",
              deviceCount: { $size: "$devices" },
            },
          },
          { $sort: { deviceCount: -1 } },
        ])
        .toArray(),
    ]);

    const deviceTypeMap: Record<string, number> = {};
    let totalWithDeviceType = 0;
    for (const item of deviceTypeCounts) {
      deviceTypeMap[item._id as string] = item.count as number;
      totalWithDeviceType += item.count as number;
    }

    const deviceTypePercentages = {
      mobile:
        totalWithDeviceType > 0
          ? ((deviceTypeMap["mobile"] || 0) / totalWithDeviceType) * 100
          : 0,
      tablet:
        totalWithDeviceType > 0
          ? ((deviceTypeMap["tablet"] || 0) / totalWithDeviceType) * 100
          : 0,
      desktop:
        totalWithDeviceType > 0
          ? ((deviceTypeMap["desktop"] || 0) / totalWithDeviceType) * 100
          : 0,
    };

    const pageViewMap: Record<string, number> = {};
    for (const item of pageViews) {
      pageViewMap[item._id as string] = item.count as number;
    }

    const eventBreakdown: Record<string, number> = {};
    for (const item of eventTypeBreakdown) {
      eventBreakdown[item._id as string] = item.count as number;
    }

    const topCountriesByDevices = countriesByDevices
      .slice(0, 10)
      .map((item) => ({
        country: item.country as string,
        deviceCount: item.deviceCount as number,
      }));

    return NextResponse.json({
      totalEvents,
      uniqueCountries,
      uniqueDevices,
      uniqueUsers,
      deviceTypePercentages,
      deviceTypeCounts: deviceTypeMap,
      extractions: {
        attempts: extractionAttempts,
        successes: extractionSuccesses,
        errors: extractionErrors,
        successRate:
          extractionAttempts > 0
            ? ((extractionSuccesses / extractionAttempts) * 100).toFixed(1)
            : "0",
      },
      pageViews: {
        homepage: pageViewMap["homepage_view"] || 0,
        recipes: pageViewMap["recipes_view"] || 0,
        extract: pageViewMap["extract_view"] || 0,
        settings: pageViewMap["settings_view"] || 0,
        recipeDetail: pageViewMap["recipe_detail_view"] || 0,
        login: pageViewMap["login_view"] || 0,
        register: pageViewMap["register_view"] || 0,
      },
      eventBreakdown,
      topCountriesByDevices,
    });
  } catch (error) {
    console.error("Failed to fetch high-level stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch high-level stats" },
      { status: 500 },
    );
  }
}
