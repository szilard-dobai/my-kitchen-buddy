import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth";
import {
  mockFreeSubscription,
  mockProSubscription,
  mockRecipe,
  mockSession,
} from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn<() => Promise<Session | null>>(),
}));

vi.mock("@/models/recipe", () => ({
  getSimilarRecipes: vi.fn(),
}));

vi.mock("@/models/subscription", () => ({
  getOrCreateSubscription: vi.fn(),
}));

describe("GET /api/recipes/[id]/similar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { getSession } = await import("@/lib/session");
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/recipes/[id]/similar/route");
    const request = new Request("http://localhost/api/recipes/123/similar");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when recipe not found", async () => {
    const { getSession } = await import("@/lib/session");
    const { getOrCreateSubscription } = await import("@/models/subscription");
    const { getSimilarRecipes } = await import("@/models/recipe");

    vi.mocked(getSession).mockResolvedValueOnce(mockSession);
    vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
      mockFreeSubscription,
    );
    vi.mocked(getSimilarRecipes).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/recipes/[id]/similar/route");
    const request = new Request("http://localhost/api/recipes/123/similar");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Recipe not found");
  });

  it("returns 1 similar recipe for free user", async () => {
    const { getSession } = await import("@/lib/session");
    const { getOrCreateSubscription } = await import("@/models/subscription");
    const { getSimilarRecipes } = await import("@/models/recipe");

    vi.mocked(getSession).mockResolvedValueOnce(mockSession);
    vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
      mockFreeSubscription,
    );
    vi.mocked(getSimilarRecipes).mockResolvedValueOnce({
      recipes: [
        {
          _id: "recipe-456",
          title: "Similar Recipe",
          thumbnailUrl: "https://example.com/thumb.jpg",
        },
      ],
      hasMore: true,
      totalSimilar: 5,
    });

    const { GET } = await import("@/app/api/recipes/[id]/similar/route");
    const request = new Request("http://localhost/api/recipes/123/similar");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toHaveLength(1);
    expect(data.hasMore).toBe(true);
    expect(data.totalSimilar).toBe(5);
    expect(getSimilarRecipes).toHaveBeenCalledWith("123", mockSession.user.id, 1);
  });

  it("returns up to 9 similar recipes for pro user", async () => {
    const { getSession } = await import("@/lib/session");
    const { getOrCreateSubscription } = await import("@/models/subscription");
    const { getSimilarRecipes } = await import("@/models/recipe");

    vi.mocked(getSession).mockResolvedValueOnce(mockSession);
    vi.mocked(getOrCreateSubscription).mockResolvedValueOnce(
      mockProSubscription,
    );
    vi.mocked(getSimilarRecipes).mockResolvedValueOnce({
      recipes: Array.from({ length: 9 }, (_, i) => ({
        _id: `recipe-${i}`,
        title: `Similar Recipe ${i}`,
      })),
      hasMore: false,
      totalSimilar: 9,
    });

    const { GET } = await import("@/app/api/recipes/[id]/similar/route");
    const request = new Request("http://localhost/api/recipes/123/similar");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toHaveLength(9);
    expect(getSimilarRecipes).toHaveBeenCalledWith("123", mockSession.user.id, 9);
  });
});
