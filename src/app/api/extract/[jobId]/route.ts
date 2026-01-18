import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getExtractionJobById } from "@/models/extraction-job";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getExtractionJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      statusMessage: job.statusMessage,
      recipeId: job.recipeId,
      error: job.error,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
}
