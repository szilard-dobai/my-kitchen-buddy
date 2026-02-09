import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockCompletedJob,
  mockExhaustedFreeSubscription,
  mockOtherUserJob,
  mockPendingJob,
  mockRecipe,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/models/subscription", () => ({
  canUserExtract: vi.fn(),
  getOrCreateSubscription: vi.fn(),
}));

vi.mock("@/models/extraction-job", () => ({
  createExtractionJob: vi.fn(),
  getExtractionJobById: vi.fn(),
}));

vi.mock("@/models/recipe", () => ({
  findRecipeBySourceUrl: vi.fn(),
}));

vi.mock("@/services/extraction", () => ({
  processExtraction: vi.fn(),
}));

vi.mock("@/services/extraction/platform-detector", () => ({
  detectPlatform: vi.fn(),
  resolveUrl: vi.fn(),
}));

vi.mock("@/lib/validation", () => ({
  validateBody: vi.fn(),
  validateQuery: vi.fn(),
}));

describe("/api/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://tiktok.com/video/123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 429 when extraction limit reached", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract, getOrCreateSubscription } =
        await import("@/models/subscription");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(false);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
        mockExhaustedFreeSubscription,
      );

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://tiktok.com/video/123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Extraction limit reached");
      expect(data.used).toBe(10);
      expect(data.limit).toBe(10);
      expect(data.planTier).toBe("free");
    });

    it("returns 400 for invalid URL", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Validation failed",
            details: { url: ["Invalid URL"] },
          }),
          { status: 400 },
        ),
      } as never);

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "not-a-url" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 for unsupported platform", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");
      const { resolveUrl, detectPlatform } =
        await import("@/services/extraction/platform-detector");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: true,
        data: {
          url: "https://unsupported.com/video",
          targetLanguage: "original",
        },
      } as never);
      vi.mocked(resolveUrl).mockResolvedValueOnce(
        "https://unsupported.com/video",
      );
      vi.mocked(detectPlatform).mockReturnValueOnce({
        isValid: false,
        platform: "other",
        error: "Unsupported platform",
      });

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://unsupported.com/video" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unsupported platform");
      expect(data.validationLayer).toBe("platform_detection");
    });

    it("returns 400 for YouTube channel URLs with validationLayer", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");
      const { resolveUrl, detectPlatform } =
        await import("@/services/extraction/platform-detector");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: true,
        data: {
          url: "https://youtube.com/@channelname",
          targetLanguage: "original",
        },
      } as never);
      vi.mocked(resolveUrl).mockResolvedValueOnce(
        "https://youtube.com/@channelname",
      );
      vi.mocked(detectPlatform).mockReturnValueOnce({
        isValid: false,
        platform: "youtube",
        error: "This appears to be a YouTube channel page",
      });

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://youtube.com/@channelname" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("channel");
      expect(data.validationLayer).toBe("platform_detection");
    });

    it("returns existingRecipeId when user already has recipe from URL", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");
      const { resolveUrl, detectPlatform } =
        await import("@/services/extraction/platform-detector");
      const { findRecipeBySourceUrl } = await import("@/models/recipe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: true,
        data: {
          url: "https://tiktok.com/video/123",
          targetLanguage: "original",
        },
      } as never);
      vi.mocked(resolveUrl).mockResolvedValueOnce(
        "https://tiktok.com/video/123",
      );
      vi.mocked(detectPlatform).mockReturnValueOnce({
        isValid: true,
        platform: "tiktok",
      });
      vi.mocked(findRecipeBySourceUrl).mockResolvedValueOnce(mockRecipe);

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://tiktok.com/video/123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.existingRecipeId).toBe(mockRecipe._id);
      expect(data.message).toBe("Recipe already exists");
    });

    it("starts extraction job for valid TikTok URL", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");
      const { resolveUrl, detectPlatform } =
        await import("@/services/extraction/platform-detector");
      const { findRecipeBySourceUrl } = await import("@/models/recipe");
      const { createExtractionJob } = await import("@/models/extraction-job");
      const { processExtraction } = await import("@/services/extraction");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: true,
        data: {
          url: "https://tiktok.com/video/123",
          targetLanguage: "original",
        },
      } as never);
      vi.mocked(resolveUrl).mockResolvedValueOnce(
        "https://tiktok.com/video/123",
      );
      vi.mocked(detectPlatform).mockReturnValueOnce({
        isValid: true,
        platform: "tiktok",
      });
      vi.mocked(findRecipeBySourceUrl).mockResolvedValueOnce(null);
      vi.mocked(createExtractionJob).mockResolvedValueOnce(mockPendingJob);
      vi.mocked(processExtraction).mockResolvedValueOnce(undefined);

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({ url: "https://tiktok.com/video/123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(mockPendingJob.id);
      expect(data.status).toBe("pending");
      expect(data.message).toBe("Extraction started");
      expect(createExtractionJob).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockSession.user.id,
          platform: "tiktok",
        }),
      );
    });

    it("starts extraction job for valid Instagram URL", async () => {
      const { getSession } = await import("@/lib/session");
      const { canUserExtract } = await import("@/models/subscription");
      const { validateBody } = await import("@/lib/validation");
      const { resolveUrl, detectPlatform } =
        await import("@/services/extraction/platform-detector");
      const { findRecipeBySourceUrl } = await import("@/models/recipe");
      const { createExtractionJob } = await import("@/models/extraction-job");
      const { processExtraction } = await import("@/services/extraction");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(canUserExtract).mockResolvedValueOnce(true);
      vi.mocked(validateBody).mockResolvedValueOnce({
        success: true,
        data: { url: "https://instagram.com/p/ABC123", targetLanguage: "en" },
      } as never);
      vi.mocked(resolveUrl).mockResolvedValueOnce(
        "https://instagram.com/p/ABC123",
      );
      vi.mocked(detectPlatform).mockReturnValueOnce({
        isValid: true,
        platform: "instagram",
      });
      vi.mocked(findRecipeBySourceUrl).mockResolvedValueOnce(null);
      vi.mocked(createExtractionJob).mockResolvedValueOnce({
        ...mockPendingJob,
        platform: "instagram",
        targetLanguage: "en",
      });
      vi.mocked(processExtraction).mockResolvedValueOnce(undefined);

      const { POST } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract", {
        method: "POST",
        body: JSON.stringify({
          url: "https://instagram.com/p/ABC123",
          targetLanguage: "en",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBeDefined();
      expect(createExtractionJob).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: "instagram",
          targetLanguage: "en",
        }),
      );
    });
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract?jobId=job-123");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when jobId is missing", async () => {
      const { getSession } = await import("@/lib/session");
      const { validateQuery } = await import("@/lib/validation");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(validateQuery).mockReturnValueOnce({
        success: false,
        response: new Response(JSON.stringify({ error: "Validation failed" }), {
          status: 400,
        }),
      } as never);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract");

      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("returns 404 when job not found", async () => {
      const { getSession } = await import("@/lib/session");
      const { validateQuery } = await import("@/lib/validation");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(validateQuery).mockReturnValueOnce({
        success: true,
        data: { jobId: "nonexistent-job" },
      } as never);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request(
        "http://localhost/api/extract?jobId=nonexistent-job",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 403 when job belongs to another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { validateQuery } = await import("@/lib/validation");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(validateQuery).mockReturnValueOnce({
        success: true,
        data: { jobId: "job-other" },
      } as never);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockOtherUserJob);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request(
        "http://localhost/api/extract?jobId=job-other",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns job status for valid jobId", async () => {
      const { getSession } = await import("@/lib/session");
      const { validateQuery } = await import("@/lib/validation");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(validateQuery).mockReturnValueOnce({
        success: true,
        data: { jobId: "job-123" },
      } as never);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockPendingJob);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request("http://localhost/api/extract?jobId=job-123");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockPendingJob.id);
      expect(data.status).toBe("pending");
    });

    it("returns completed job with recipeId", async () => {
      const { getSession } = await import("@/lib/session");
      const { validateQuery } = await import("@/lib/validation");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(validateQuery).mockReturnValueOnce({
        success: true,
        data: { jobId: "job-completed" },
      } as never);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockCompletedJob);

      const { GET } = await import("@/app/api/extract/route");
      const request = new Request(
        "http://localhost/api/extract?jobId=job-completed",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.recipeId).toBe("recipe-123");
    });
  });
});
