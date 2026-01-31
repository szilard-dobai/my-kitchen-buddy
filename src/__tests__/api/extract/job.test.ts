import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockAnalyzingJob,
  mockCompletedJob,
  mockFailedJob,
  mockOtherUserJob,
  mockPendingJob,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/models/extraction-job", () => ({
  getExtractionJobById: vi.fn(),
}));

describe("/api/extract/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-123");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when job not found", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/nonexistent");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 403 when job belongs to another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockOtherUserJob);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-other");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-other" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns job status with progress for pending job", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockPendingJob);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-123");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockPendingJob.id);
      expect(data.status).toBe("pending");
      expect(data.progress).toBe(0);
      expect(data.recipeId).toBeUndefined();
      expect(data.error).toBeUndefined();
    });

    it("returns job status with progress for analyzing job", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockAnalyzingJob);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-789");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-789" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("analyzing");
      expect(data.progress).toBe(66);
      expect(data.statusMessage).toBe("Analyzing recipe with AI...");
    });

    it("returns job status with recipeId for completed job", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockCompletedJob);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-completed");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-completed" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.progress).toBe(100);
      expect(data.recipeId).toBe("recipe-123");
      expect(data.statusMessage).toBe("Recipe extracted successfully!");
    });

    it("returns job status with error for failed job", async () => {
      const { getSession } = await import("@/lib/session");
      const { getExtractionJobById } = await import("@/models/extraction-job");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getExtractionJobById).mockResolvedValueOnce(mockFailedJob);

      const { GET } = await import("@/app/api/extract/[jobId]/route");
      const request = new Request("http://localhost/api/extract/job-failed");

      const response = await GET(request, {
        params: Promise.resolve({ jobId: "job-failed" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("failed");
      expect(data.error).toBe("Could not find transcript for this video");
      expect(data.recipeId).toBeUndefined();
    });
  });
});
