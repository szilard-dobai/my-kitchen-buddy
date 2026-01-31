import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: { mongodb: "connected" },
      responseTime: "10ms",
    });
  }),

  http.get("/api/recipes", () => {
    return HttpResponse.json([
      {
        _id: "recipe-1",
        title: "Test Recipe",
        description: "A test recipe",
        ingredients: [],
        instructions: [],
        dietaryTags: [],
        tipsAndNotes: [],
        equipment: [],
        source: { url: "", platform: "other" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }),

  http.post("/api/extract", async ({ request }) => {
    const body = (await request.json()) as { url?: string };
    if (!body.url) {
      return HttpResponse.json(
        {
          error: "Validation failed",
          details: { url: ["Invalid URL format"] },
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      jobId: "job-123",
      status: "pending",
      message: "Extraction started",
    });
  }),
];
