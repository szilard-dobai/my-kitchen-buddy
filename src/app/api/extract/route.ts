import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createExtractionJob, getExtractionJobById } from "@/models/extraction-job";
import { findRecipeBySourceUrl } from "@/models/recipe";
import { processExtraction } from "@/services/extraction";
import { detectPlatform, normalizeUrl } from "@/services/extraction/platform-detector";
import type { TargetLanguage } from "@/types/extraction-job";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, targetLanguage = "original" } = body as {
      url: string;
      targetLanguage?: TargetLanguage;
    };

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);
    const detection = detectPlatform(normalizedUrl);

    if (!detection.isValid) {
      return NextResponse.json(
        { error: detection.error || "Invalid URL" },
        { status: 400 }
      );
    }

    const existingRecipe = await findRecipeBySourceUrl(session.user.id, normalizedUrl);
    if (existingRecipe) {
      return NextResponse.json({
        existingRecipeId: existingRecipe._id,
        message: "Recipe already exists",
      });
    }

    const job = await createExtractionJob({
      userId: session.user.id,
      sourceUrl: normalizedUrl,
      platform: detection.platform,
      targetLanguage,
    });

    processExtraction(job).catch((error) => {
      console.error("Background extraction failed:", error);
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: "Extraction started",
    });
  } catch (error) {
    console.error("Error starting extraction:", error);
    return NextResponse.json(
      { error: "Failed to start extraction" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await getExtractionJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
}
