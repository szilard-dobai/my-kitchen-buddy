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
    vi.resetModules();
  });

  it("returns empty array when no similar recipes found", async () => {
    const mockFind = vi.fn().mockReturnValue({
      project: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    });
    const mockCollection = vi.fn().mockReturnValue({
      findOne: vi.fn().mockResolvedValue(mockRecipe),
      find: mockFind,
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
        title: "Italian Pasta Carbonara",
        cuisineType: "Italian",
        ingredients: [
          { name: "Pasta" },
          { name: "Parmesan cheese" },
          { name: "Eggs" },
        ],
        source: {
          authorId: "author-123",
          thumbnailUrl: "https://example.com/thumb.jpg",
          authorAvatarUrl: "https://example.com/avatar.jpg",
          authorUsername: "testuser",
        },
      },
      {
        _id: { toString: () => "recipe-789" },
        title: "Creamy Pasta Alfredo",
        cuisineType: "Italian",
        ingredients: [
          { name: "Pasta" },
          { name: "Parmesan cheese" },
          { name: "Cream" },
        ],
        source: {
          thumbnailUrl: "https://example.com/thumb2.jpg",
          authorUsername: "otheruser",
        },
      },
    ];

    const mockFind = vi.fn().mockReturnValue({
      project: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(similarRecipes),
      }),
    });
    const mockCollection = vi.fn().mockReturnValue({
      findOne: vi.fn().mockResolvedValue({
        ...mockRecipe,
        title: "Test Pasta Recipe",
        cuisineType: "Italian",
        ingredients: [
          { name: "Pasta" },
          { name: "Tomato sauce" },
          { name: "Parmesan cheese" },
        ],
        _id: { toString: () => "recipe-123" },
      }),
      find: mockFind,
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

    expect(result).not.toBeNull();
    expect(result!.recipes).toHaveLength(2);
    expect(result!.recipes[0].thumbnailUrl).toBe("https://example.com/thumb.jpg");
    expect(result!.totalSimilar).toBe(2);
    expect(result!.hasMore).toBe(false);
  });

  it("returns hasMore true when more recipes exist than limit", async () => {
    const similarRecipes = [
      {
        _id: { toString: () => "recipe-456" },
        title: "Italian Pasta One",
        cuisineType: "Italian",
        ingredients: [{ name: "Pasta" }, { name: "Cheese" }],
        source: {},
      },
      {
        _id: { toString: () => "recipe-457" },
        title: "Italian Pasta Two",
        cuisineType: "Italian",
        ingredients: [{ name: "Pasta" }, { name: "Tomato" }],
        source: {},
      },
      {
        _id: { toString: () => "recipe-458" },
        title: "Italian Pasta Three",
        cuisineType: "Italian",
        ingredients: [{ name: "Pasta" }, { name: "Basil" }],
        source: {},
      },
    ];

    const mockFind = vi.fn().mockReturnValue({
      project: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(similarRecipes),
      }),
    });
    const mockCollection = vi.fn().mockReturnValue({
      findOne: vi.fn().mockResolvedValue({
        ...mockRecipe,
        title: "Test Pasta Recipe",
        cuisineType: "Italian",
        ingredients: [{ name: "Pasta" }, { name: "Sauce" }],
        _id: { toString: () => "recipe-123" },
      }),
      find: mockFind,
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

    expect(result).not.toBeNull();
    expect(result!.recipes).toHaveLength(1);
    expect(result!.hasMore).toBe(true);
    expect(result!.totalSimilar).toBe(3);
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
