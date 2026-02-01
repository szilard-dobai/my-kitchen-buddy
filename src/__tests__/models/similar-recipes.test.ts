import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockRecipe, mockSession } from "../mocks/fixtures";

vi.mock("@/lib/db", () => ({
  default: vi.fn(),
}));

vi.mock("mongodb", () => ({
  ObjectId: class MockObjectId {
    id: string;
    constructor(id: string) {
      this.id = id;
    }
    toString() {
      return this.id;
    }
  },
}));

describe("getSimilarRecipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no similar recipes found", async () => {
    const mockAggregate = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    const mockCollection = vi.fn().mockReturnValue({
      aggregate: mockAggregate,
      findOne: vi.fn().mockResolvedValue(mockRecipe),
    });
    const getDb = (await import("@/lib/db")).default;
    vi.mocked(getDb).mockResolvedValue({
      collection: mockCollection,
    } as never);

    const { getSimilarRecipes } = await import("@/models/recipe");
    const result = await getSimilarRecipes(
      "recipe-123",
      mockSession.user.id,
      9,
    );

    expect(result).toEqual({ recipes: [], hasMore: false, totalSimilar: 0 });
  });

  it("returns similar recipes sorted by score", async () => {
    const similarRecipes = [
      {
        _id: { toString: () => "recipe-456" },
        title: "Similar Pasta",
        source: {
          thumbnailUrl: "https://example.com/thumb.jpg",
          authorAvatarUrl: "https://example.com/avatar.jpg",
          authorUsername: "testuser",
        },
        similarityScore: 0.75,
      },
      {
        _id: { toString: () => "recipe-789" },
        title: "Another Pasta",
        source: {
          thumbnailUrl: "https://example.com/thumb2.jpg",
          authorUsername: "otheruser",
        },
        similarityScore: 0.5,
      },
    ];

    const countResult = [{ count: 2 }];

    const mockAggregate = vi
      .fn()
      .mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValue(similarRecipes),
      })
      .mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValue(countResult),
      });
    const mockCollection = vi.fn().mockReturnValue({
      aggregate: mockAggregate,
      findOne: vi.fn().mockResolvedValue({
        ...mockRecipe,
        _id: { toString: () => "recipe-123" },
      }),
    });
    const getDb = (await import("@/lib/db")).default;
    vi.mocked(getDb).mockResolvedValue({
      collection: mockCollection,
    } as never);

    const { getSimilarRecipes } = await import("@/models/recipe");
    const result = await getSimilarRecipes(
      "recipe-123",
      mockSession.user.id,
      9,
    );

    expect(result.recipes).toHaveLength(2);
    expect(result.recipes[0].title).toBe("Similar Pasta");
    expect(result.recipes[0].thumbnailUrl).toBe("https://example.com/thumb.jpg");
    expect(result.totalSimilar).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it("returns hasMore true when more recipes exist than limit", async () => {
    const similarRecipes = [
      {
        _id: { toString: () => "recipe-456" },
        title: "Similar Pasta",
        source: {},
        similarityScore: 0.75,
      },
    ];

    const countResult = [{ count: 5 }];

    const mockAggregate = vi
      .fn()
      .mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValue(similarRecipes),
      })
      .mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValue(countResult),
      });

    const mockCollection = vi.fn().mockReturnValue({
      aggregate: mockAggregate,
      findOne: vi.fn().mockResolvedValue({
        ...mockRecipe,
        _id: { toString: () => "recipe-123" },
      }),
    });
    const getDb = (await import("@/lib/db")).default;
    vi.mocked(getDb).mockResolvedValue({
      collection: mockCollection,
    } as never);

    const { getSimilarRecipes } = await import("@/models/recipe");
    const result = await getSimilarRecipes(
      "recipe-123",
      mockSession.user.id,
      1,
    );

    expect(result.recipes).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.totalSimilar).toBe(5);
  });

  it("returns null when source recipe not found", async () => {
    const mockCollection = vi.fn().mockReturnValue({
      findOne: vi.fn().mockResolvedValue(null),
    });
    const getDb = (await import("@/lib/db")).default;
    vi.mocked(getDb).mockResolvedValue({
      collection: mockCollection,
    } as never);

    const { getSimilarRecipes } = await import("@/models/recipe");
    const result = await getSimilarRecipes(
      "nonexistent",
      mockSession.user.id,
      9,
    );

    expect(result).toBeNull();
  });
});
