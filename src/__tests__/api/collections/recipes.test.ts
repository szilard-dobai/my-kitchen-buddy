import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockCollection,
  mockRecipe,
  mockRecipeCollection,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/models/collection", () => ({
  getCollectionById: vi.fn(),
}));

vi.mock("@/models/recipe", () => ({
  getRecipeById: vi.fn(),
}));

vi.mock("@/models/recipe-collection", () => ({
  addRecipeToCollection: vi.fn(),
  removeRecipeFromCollection: vi.fn(),
  getRecipeIdsInCollection: vi.fn(),
  isRecipeInCollection: vi.fn(),
}));

describe("/api/collections/[id]/recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/collections/[id]/recipes/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 for non-existent collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/collections/[id]/recipes/route");
      const request = new Request(
        "http://localhost/api/collections/nonexistent/recipes",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Collection not found");
    });

    it("returns recipe IDs in collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { getRecipeIdsInCollection } =
        await import("@/models/recipe-collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(getRecipeIdsInCollection).mockResolvedValueOnce([
        "recipe-1",
        "recipe-2",
        "recipe-3",
      ]);

      const { GET } = await import("@/app/api/collections/[id]/recipes/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "col-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipeIds).toEqual(["recipe-1", "recipe-2", "recipe-3"]);
    });
  });
});

describe("/api/collections/[id]/recipes/[recipeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 if collection does not exist", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(null);

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/nonexistent/recipes/recipe-123",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "nonexistent", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Collection not found");
    });

    it("returns 404 if recipe does not exist", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { getRecipeById } = await import("@/models/recipe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(getRecipeById).mockResolvedValueOnce(null);

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/nonexistent",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Recipe not found");
    });

    it("returns 403 if collection owned by another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce({
        ...mockCollection,
        userId: "other-user",
      });

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("returns 403 if recipe owned by another user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { getRecipeById } = await import("@/models/recipe");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(getRecipeById).mockResolvedValueOnce({
        ...mockRecipe,
        userId: "other-user",
      });

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("adds recipe to collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { getRecipeById } = await import("@/models/recipe");
      const { addRecipeToCollection } =
        await import("@/models/recipe-collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(getRecipeById).mockResolvedValueOnce(mockRecipe);
      vi.mocked(addRecipeToCollection).mockResolvedValueOnce(
        mockRecipeCollection,
      );

      const { POST } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "POST" },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });

      expect(response.status).toBe(201);
      expect(addRecipeToCollection).toHaveBeenCalledWith(
        "recipe-123",
        "col-123",
        mockSession.user.id,
      );
    });
  });

  describe("DELETE", () => {
    it("returns 404 if recipe not in collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { isRecipeInCollection } =
        await import("@/models/recipe-collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(isRecipeInCollection).mockResolvedValueOnce(false);

      const { DELETE } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Recipe not in collection");
    });

    it("removes recipe from collection", async () => {
      const { getSession } = await import("@/lib/session");
      const { getCollectionById } = await import("@/models/collection");
      const { isRecipeInCollection, removeRecipeFromCollection } =
        await import("@/models/recipe-collection");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getCollectionById).mockResolvedValueOnce(mockCollection);
      vi.mocked(isRecipeInCollection).mockResolvedValueOnce(true);
      vi.mocked(removeRecipeFromCollection).mockResolvedValueOnce(true);

      const { DELETE } =
        await import("@/app/api/collections/[id]/recipes/[recipeId]/route");
      const request = new Request(
        "http://localhost/api/collections/col-123/recipes/recipe-123",
        { method: "DELETE" },
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "col-123", recipeId: "recipe-123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(removeRecipeFromCollection).toHaveBeenCalledWith(
        "recipe-123",
        "col-123",
        mockSession.user.id,
      );
    });
  });
});
