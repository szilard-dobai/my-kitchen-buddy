import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockInstagramAuthor,
  mockSession,
  mockTikTokAuthor,
  mockYouTubeAuthor,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/models/author", () => ({
  findAuthorById: vi.fn(),
  updateAuthorAvatar: vi.fn(),
}));

vi.mock("@/services/extraction/platform-detector", () => ({
  getInstagramAuthorAvatar: vi.fn(),
  getTikTokAuthorAvatar: vi.fn(),
}));

describe("/api/refresh-author-avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "author-123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when authorId is missing", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("authorId is required");
    });

    it("returns 404 when author not found", async () => {
      const { getSession } = await import("@/lib/session");
      const { findAuthorById } = await import("@/models/author");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(findAuthorById).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "nonexistent" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Author not found");
    });

    it("returns 400 for unsupported platform (YouTube)", async () => {
      const { getSession } = await import("@/lib/session");
      const { findAuthorById } = await import("@/models/author");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(findAuthorById).mockResolvedValueOnce(mockYouTubeAuthor);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "author-789" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Avatar refresh is only supported for Instagram and TikTok");
    });

    it("refreshes Instagram author avatar successfully", async () => {
      const { getSession } = await import("@/lib/session");
      const { findAuthorById, updateAuthorAvatar } = await import("@/models/author");
      const { getInstagramAuthorAvatar } = await import(
        "@/services/extraction/platform-detector"
      );

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(findAuthorById).mockResolvedValueOnce(mockInstagramAuthor);
      vi.mocked(getInstagramAuthorAvatar).mockResolvedValueOnce(
        "https://example.com/new-ig-avatar.jpg",
      );
      vi.mocked(updateAuthorAvatar).mockResolvedValueOnce(undefined);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "author-456" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.avatarUrl).toBe("https://example.com/new-ig-avatar.jpg");
      expect(getInstagramAuthorAvatar).toHaveBeenCalledWith(
        `https://www.instagram.com/${mockInstagramAuthor.username}/`,
      );
      expect(updateAuthorAvatar).toHaveBeenCalledWith(
        "author-456",
        "https://example.com/new-ig-avatar.jpg",
      );
    });

    it("refreshes TikTok author avatar successfully", async () => {
      const { getSession } = await import("@/lib/session");
      const { findAuthorById, updateAuthorAvatar } = await import("@/models/author");
      const { getTikTokAuthorAvatar } = await import(
        "@/services/extraction/platform-detector"
      );

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(findAuthorById).mockResolvedValueOnce(mockTikTokAuthor);
      vi.mocked(getTikTokAuthorAvatar).mockResolvedValueOnce(
        "https://example.com/new-tt-avatar.jpg",
      );
      vi.mocked(updateAuthorAvatar).mockResolvedValueOnce(undefined);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "author-123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.avatarUrl).toBe("https://example.com/new-tt-avatar.jpg");
      expect(getTikTokAuthorAvatar).toHaveBeenCalledWith(
        `https://www.tiktok.com/@${mockTikTokAuthor.username}`,
      );
      expect(updateAuthorAvatar).toHaveBeenCalledWith(
        "author-123",
        "https://example.com/new-tt-avatar.jpg",
      );
    });

    it("returns 404 when avatar fetch fails (null returned)", async () => {
      const { getSession } = await import("@/lib/session");
      const { findAuthorById } = await import("@/models/author");
      const { getInstagramAuthorAvatar } = await import(
        "@/services/extraction/platform-detector"
      );

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(findAuthorById).mockResolvedValueOnce(mockInstagramAuthor);
      vi.mocked(getInstagramAuthorAvatar).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/refresh-author-avatar/route");
      const request = new Request("http://localhost/api/refresh-author-avatar", {
        method: "POST",
        body: JSON.stringify({ authorId: "author-456" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Could not fetch author avatar");
    });
  });
});
