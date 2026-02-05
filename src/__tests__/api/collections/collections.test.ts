import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth";
import {
  mockCollection,
  mockCollection2,
  mockFreeSubscription,
  mockLapsedSubscription,
  mockProSubscription,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn<() => Promise<Session | null>>(),
}));

vi.mock("@/models/collection", () => ({
  createCollection: vi.fn(),
  getCollectionById: vi.fn(),
  getCollectionCount: vi.fn(),
  getCollectionsWithCountByUserId: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

vi.mock("@/models/subscription", () => ({
  getOrCreateSubscription: vi.fn(),
}));

vi.mock("@/models/recipe-collection", () => ({
  removeAllRecipesFromCollection: vi.fn(),
}));

describe("/api/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/collections/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns empty array when user has no collections", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionsWithCountByUserId } =
        await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionsWithCountByUserId).mockResolvedValueOnce([]);

      const { GET } = await import("@/app/api/collections/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns user collections with recipe counts", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionsWithCountByUserId } =
        await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionsWithCountByUserId).mockResolvedValueOnce([
        mockCollection,
        mockCollection2,
      ]);

      const { GET } = await import("@/app/api/collections/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Weeknight Dinners");
      expect(data[0].recipeCount).toBe(5);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Test", color: "#3B82F6" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid data (missing name)", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ color: "#3B82F6" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 for invalid color", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Test", color: "#INVALID" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 409 when free user hits 3 collection limit", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { getCollectionCount } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
        mockFreeSubscription,
      );
      vi.mocked(getCollectionCount).mockResolvedValueOnce(3);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Fourth Collection", color: "#3B82F6" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Collection limit reached");
      expect(data.limitReached).toBe(true);
    });

    it("creates collection for free user under limit", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { getCollectionCount, createCollection } =
        await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
        mockFreeSubscription,
      );
      vi.mocked(getCollectionCount).mockResolvedValueOnce(2);
      vi.mocked(createCollection).mockResolvedValueOnce(mockCollection);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Weeknight Dinners", color: "#3B82F6" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("Weeknight Dinners");
      expect(createCollection).toHaveBeenCalledWith({
        userId: mockSession.user.id,
        name: "Weeknight Dinners",
        color: "#3B82F6",
      });
    });

    it("allows Pro user to create unlimited collections", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { getCollectionCount, createCollection } =
        await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
        mockProSubscription,
      );
      vi.mocked(getCollectionCount).mockResolvedValueOnce(100);
      vi.mocked(createCollection).mockResolvedValueOnce(mockCollection);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "Many Collections", color: "#3B82F6" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("returns 409 when lapsed Pro user is over free limit", async () => {
      const { getSession } = await import("@/lib/session");
      const { getOrCreateSubscription } = await import("@/models/subscription");
      const { getCollectionCount } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
        mockLapsedSubscription,
      );
      vi.mocked(getCollectionCount).mockResolvedValueOnce(10);

      const { POST } = await import("@/app/api/collections/route");
      const request = new Request("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "New Collection", color: "#3B82F6" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Collection limit reached");
      expect(data.limitReached).toBe(true);
      expect(data.currentCount).toBe(10);
      expect(data.limit).toBe(3);
    });
  });
});

describe("/api/collections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 404 for non-existent collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/collections/[id]/route");
      const request = new Request(
        "http://localhost/api/collections/nonexistent",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Collection not found");
    });

    it("returns 403 for collection owned by another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce({
        ...mockCollection,
        userId: "other-user",
      });

      const { GET } = await import("@/app/api/collections/[id]/route");
      const request = new Request("http://localhost/api/collections/col-123");
      const response = await GET(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns collection for owner", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);

      const { GET } = await import("@/app/api/collections/[id]/route");
      const request = new Request("http://localhost/api/collections/col-123");
      const response = await GET(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Weeknight Dinners");
    });
  });

  describe("PUT", () => {
    it("updates collection name", async () => {
      const { getSession } = await import("@/lib/session");
      const { updateCollection } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(updateCollection).mockResolvedValueOnce({
        ...mockCollection,
        name: "Updated Name",
      });

      const { PUT } = await import("@/app/api/collections/[id]/route");
      const request = new Request("http://localhost/api/collections/col-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const response = await PUT(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Name");
    });

    it("returns 404 for non-existent collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { updateCollection } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(updateCollection).mockResolvedValueOnce(null);

      const { PUT } = await import("@/app/api/collections/[id]/route");
      const request = new Request(
        "http://localhost/api/collections/nonexistent",
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        },
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Collection not found");
    });
  });

  describe("DELETE", () => {
    it("deletes collection and removes all recipe associations", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById, deleteCollection } =
        await import("@/models/collection");
      const { removeAllRecipesFromCollection } =
        await import("@/models/recipe-collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(removeAllRecipesFromCollection).mockResolvedValueOnce(5);
      vi.mocked(deleteCollection).mockResolvedValueOnce(true);

      const { DELETE } = await import("@/app/api/collections/[id]/route");
      const request = new Request("http://localhost/api/collections/col-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(removeAllRecipesFromCollection).toHaveBeenCalledWith(
        "col-123",
        mockSession.user.id,
      );
      expect(deleteCollection).toHaveBeenCalledWith(
        "col-123",
        mockSession.user.id,
      );
    });

    it("returns 403 for collection owned by another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce({
        ...mockCollection,
        userId: "other-user",
      });

      const { DELETE } = await import("@/app/api/collections/[id]/route");
      const request = new Request("http://localhost/api/collections/col-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });
});
