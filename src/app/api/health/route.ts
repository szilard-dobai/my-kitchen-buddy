import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const db = await getDb();
    await db.command({ ping: 1 });

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: "connected",
      },
      responseTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          mongodb: "disconnected",
        },
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
