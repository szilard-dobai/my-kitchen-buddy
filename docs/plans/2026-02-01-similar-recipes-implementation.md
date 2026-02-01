# Similar Recipes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Similar Recipes" carousel to recipe detail pages, showing related recipes based on ingredients, cuisine, and author similarity.

**Architecture:** MongoDB aggregation pipeline computes similarity scores server-side. API returns limited results based on plan tier (1 for free, 9 for pro). Client renders a horizontal scrollable carousel with blurred placeholders for upgrade prompts.

**Tech Stack:** Next.js 15 App Router, MongoDB aggregation, React, Tailwind CSS, Vitest for tests

---

## Task 1: Add Types

**Files:**
- Modify: `src/types/recipe.ts`

**Step 1: Add SimilarRecipe and SimilarRecipesResponse types**

Add to end of `src/types/recipe.ts`:

```typescript
export interface SimilarRecipe {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  authorAvatarUrl?: string;
  authorUsername?: string;
}

export interface SimilarRecipesResponse {
  recipes: SimilarRecipe[];
  hasMore: boolean;
  totalSimilar: number;
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/recipe.ts
git commit -m "feat(similar-recipes): add SimilarRecipe types"
```

---

## Task 2: Add Plan Tier Limits

**Files:**
- Modify: `src/types/subscription.ts`

**Step 1: Add SIMILAR_RECIPES_LIMITS constant**

Add after `PLAN_LIMITS`:

```typescript
export const SIMILAR_RECIPES_LIMITS: Record<PlanTier, number> = {
  free: 1,
  pro: 9,
};
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/subscription.ts
git commit -m "feat(similar-recipes): add plan tier limits"
```

---

## Task 3: Add Model Function - Write Test

**Files:**
- Create: `src/__tests__/models/similar-recipes.test.ts`

**Step 1: Write the failing test**

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockRecipe, mockSession } from "../mocks/fixtures";

vi.mock("@/lib/db", () => ({
  default: vi.fn(),
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

    const mockAggregate = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(similarRecipes),
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/models/similar-recipes.test.ts`
Expected: FAIL - getSimilarRecipes is not exported

**Step 3: Commit failing test**

```bash
git add src/__tests__/models/similar-recipes.test.ts
git commit -m "test(similar-recipes): add getSimilarRecipes tests (failing)"
```

---

## Task 4: Implement Model Function

**Files:**
- Modify: `src/models/recipe.ts`

**Step 1: Add imports**

Add to imports at top:

```typescript
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  SimilarRecipesResponse,
} from "@/types/recipe";
```

**Step 2: Add getSimilarRecipes function**

Add at end of file:

```typescript
export async function getSimilarRecipes(
  recipeId: string,
  userId: string,
  limit: number,
): Promise<SimilarRecipesResponse | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  try {
    const sourceRecipe = await collection.findOne({
      _id: new ObjectId(recipeId),
      userId,
    });

    if (!sourceRecipe) return null;

    const sourceIngredients = (sourceRecipe.ingredients || []).map(
      (i: { name: string }) => i.name.toLowerCase().trim(),
    );
    const sourceCuisine = sourceRecipe.cuisineType || "";
    const sourceAuthorId = sourceRecipe.source?.authorId || "";

    const pipeline = [
      {
        $match: {
          userId,
          _id: { $ne: new ObjectId(recipeId) },
        },
      },
      {
        $addFields: {
          ingredientNames: {
            $map: {
              input: { $ifNull: ["$ingredients", []] },
              as: "ing",
              in: { $toLower: { $trim: { input: "$$ing.name" } } },
            },
          },
        },
      },
      {
        $addFields: {
          commonIngredients: {
            $size: {
              $setIntersection: ["$ingredientNames", sourceIngredients],
            },
          },
          totalIngredients: {
            $size: {
              $setUnion: ["$ingredientNames", sourceIngredients],
            },
          },
          cuisineMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$cuisineType", null] },
                  { $ne: ["$cuisineType", ""] },
                  { $eq: ["$cuisineType", sourceCuisine] },
                ],
              },
              1,
              0,
            ],
          },
          authorMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$source.authorId", null] },
                  { $ne: ["$source.authorId", ""] },
                  { $eq: ["$source.authorId", sourceAuthorId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          ingredientScore: {
            $cond: [
              { $eq: ["$totalIngredients", 0] },
              0,
              { $divide: ["$commonIngredients", "$totalIngredients"] },
            ],
          },
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ["$ingredientScore", 0.5] },
              { $multiply: ["$cuisineMatch", 0.25] },
              { $multiply: ["$authorMatch", 0.25] },
            ],
          },
        },
      },
      {
        $match: {
          similarityScore: { $gte: 0.1 },
        },
      },
      {
        $sort: { similarityScore: -1 as const },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          "source.thumbnailUrl": 1,
          "source.authorAvatarUrl": 1,
          "source.authorUsername": 1,
          similarityScore: 1,
        },
      },
    ];

    const similarRecipes = await collection.aggregate(pipeline).toArray();

    const countPipeline = [
      {
        $match: {
          userId,
          _id: { $ne: new ObjectId(recipeId) },
        },
      },
      {
        $addFields: {
          ingredientNames: {
            $map: {
              input: { $ifNull: ["$ingredients", []] },
              as: "ing",
              in: { $toLower: { $trim: { input: "$$ing.name" } } },
            },
          },
        },
      },
      {
        $addFields: {
          commonIngredients: {
            $size: {
              $setIntersection: ["$ingredientNames", sourceIngredients],
            },
          },
          totalIngredients: {
            $size: {
              $setUnion: ["$ingredientNames", sourceIngredients],
            },
          },
          cuisineMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$cuisineType", null] },
                  { $ne: ["$cuisineType", ""] },
                  { $eq: ["$cuisineType", sourceCuisine] },
                ],
              },
              1,
              0,
            ],
          },
          authorMatch: {
            $cond: [
              {
                $and: [
                  { $ne: ["$source.authorId", null] },
                  { $ne: ["$source.authorId", ""] },
                  { $eq: ["$source.authorId", sourceAuthorId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          ingredientScore: {
            $cond: [
              { $eq: ["$totalIngredients", 0] },
              0,
              { $divide: ["$commonIngredients", "$totalIngredients"] },
            ],
          },
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $multiply: ["$ingredientScore", 0.5] },
              { $multiply: ["$cuisineMatch", 0.25] },
              { $multiply: ["$authorMatch", 0.25] },
            ],
          },
        },
      },
      {
        $match: {
          similarityScore: { $gte: 0.1 },
        },
      },
      {
        $limit: 9,
      },
      {
        $count: "count",
      },
    ];

    const countResult = await collection.aggregate(countPipeline).toArray();
    const totalSimilar = countResult[0]?.count || 0;

    const recipes = similarRecipes.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      thumbnailUrl: r.source?.thumbnailUrl,
      authorAvatarUrl: r.source?.authorAvatarUrl,
      authorUsername: r.source?.authorUsername,
    }));

    return {
      recipes,
      hasMore: totalSimilar > limit,
      totalSimilar: Math.min(totalSimilar, 9),
    };
  } catch {
    return null;
  }
}
```

**Step 3: Run tests to verify they pass**

Run: `npm test -- src/__tests__/models/similar-recipes.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/models/recipe.ts
git commit -m "feat(similar-recipes): implement getSimilarRecipes model function"
```

---

## Task 5: Add API Route - Write Test

**Files:**
- Create: `src/__tests__/api/recipes/similar.test.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/api/recipes/similar.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Commit failing test**

```bash
git add src/__tests__/api/recipes/similar.test.ts
git commit -m "test(similar-recipes): add API route tests (failing)"
```

---

## Task 6: Implement API Route

**Files:**
- Create: `src/app/api/recipes/[id]/similar/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSimilarRecipes } from "@/models/recipe";
import { getOrCreateSubscription } from "@/models/subscription";
import { SIMILAR_RECIPES_LIMITS } from "@/types/subscription";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const subscription = await getOrCreateSubscription(session.user.id);
    const limit = SIMILAR_RECIPES_LIMITS[subscription.planTier];

    const result = await getSimilarRecipes(id, session.user.id, limit);

    if (!result) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching similar recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar recipes" },
      { status: 500 },
    );
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- src/__tests__/api/recipes/similar.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/app/api/recipes/[id]/similar/route.ts
git commit -m "feat(similar-recipes): add API route"
```

---

## Task 7: Create SimilarRecipeCard Component

**Files:**
- Create: `src/components/recipes/similar-recipe-card.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { User, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/tracking";
import type { SimilarRecipe } from "@/types/recipe";

interface SimilarRecipeCardProps {
  recipe: SimilarRecipe;
}

export function SimilarRecipeCard({ recipe }: SimilarRecipeCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/recipes/${recipe._id}`}
      onClick={() =>
        trackEvent("similar_recipe_click", { recipeId: recipe._id })
      }
      className="block shrink-0 w-40 snap-start"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden group">
        {recipe.thumbnailUrl && !imageError ? (
          <Image
            src={recipe.thumbnailUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="160px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {recipe.authorAvatarUrl ? (
          <Image
            src={recipe.authorAvatarUrl}
            alt={recipe.authorUsername || "Author"}
            width={24}
            height={24}
            className="absolute top-2 right-2 rounded-full border border-white/50"
          />
        ) : (
          <div className="absolute top-2 right-2 size-6 rounded-full bg-muted flex items-center justify-center border border-white/50">
            <User className="size-3.5 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
            {recipe.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/recipes/similar-recipe-card.tsx
git commit -m "feat(similar-recipes): add SimilarRecipeCard component"
```

---

## Task 8: Create SimilarRecipePlaceholder Component

**Files:**
- Create: `src/components/recipes/similar-recipe-placeholder.tsx`

**Step 1: Create the component**

```typescript
import { User } from "lucide-react";

export function SimilarRecipePlaceholder() {
  return (
    <div className="shrink-0 w-40 snap-start">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <div className="absolute inset-0 backdrop-blur-md bg-muted/50" />
        <div className="absolute top-2 right-2 size-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
          <User className="size-3.5 text-muted-foreground/50" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5">
          <div className="h-3 bg-muted-foreground/20 rounded-full w-full" />
          <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/recipes/similar-recipe-placeholder.tsx
git commit -m "feat(similar-recipes): add SimilarRecipePlaceholder component"
```

---

## Task 9: Create SimilarRecipesSection Component

**Files:**
- Create: `src/components/recipes/similar-recipes-section.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SimilarRecipeCard } from "./similar-recipe-card";
import { SimilarRecipePlaceholder } from "./similar-recipe-placeholder";
import type { SimilarRecipesResponse } from "@/types/recipe";
import type { PlanTier } from "@/types/subscription";

interface SimilarRecipesSectionProps {
  recipeId: string;
  planTier: PlanTier;
}

export function SimilarRecipesSection({
  recipeId,
  planTier,
}: SimilarRecipesSectionProps) {
  const [data, setData] = useState<SimilarRecipesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilarRecipes() {
      try {
        const response = await fetch(`/api/recipes/${recipeId}/similar`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch {
        // Silently fail - section just won't show
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarRecipes();
  }, [recipeId]);

  if (loading) {
    return null;
  }

  if (!data || data.recipes.length === 0) {
    return null;
  }

  const placeholderCount = data.hasMore ? data.totalSimilar - 1 : 0;

  return (
    <div className="mt-8 pt-6 border-t">
      <h2 className="text-lg font-semibold mb-4">Similar Recipes</h2>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {data.recipes.map((recipe) => (
            <SimilarRecipeCard key={recipe._id} recipe={recipe} />
          ))}
          {planTier === "free" &&
            data.hasMore &&
            Array.from({ length: Math.min(placeholderCount, 3) }).map(
              (_, index) => <SimilarRecipePlaceholder key={`placeholder-${index}`} />,
            )}
        </div>
        {planTier === "free" && data.hasMore && (
          <div className="absolute right-0 top-0 bottom-2 w-32 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2">
            <Link
              href="/settings?tab=billing"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Crown className="size-4" />
              See {data.totalSimilar - 1} more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/recipes/similar-recipes-section.tsx
git commit -m "feat(similar-recipes): add SimilarRecipesSection component"
```

---

## Task 10: Integrate into Recipe Detail Page

**Files:**
- Modify: `src/app/(dashboard)/recipes/[id]/page.tsx`

**Step 1: Add import**

Add after other recipe component imports:

```typescript
import { SimilarRecipesSection } from "@/components/recipes/similar-recipes-section";
```

**Step 2: Add SimilarRecipesSection before the source attribution**

Find:
```typescript
      {recipe.source.url && (
        <div className="mt-8 pt-6 border-t">
```

Insert before it:
```typescript
      <SimilarRecipesSection
        recipeId={recipe._id!}
        planTier={subscription.planTier}
      />
```

**Step 3: Verify it compiles and renders**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npm run dev`
Expected: Recipe detail page loads without errors

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/recipes/\[id\]/page.tsx
git commit -m "feat(similar-recipes): integrate section into recipe detail page"
```

---

## Task 11: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run linter**

Run: `npm run lint`
Expected: No errors (or fix any that appear)

---

## Task 12: Manual Testing Checklist

Test the following scenarios manually:

1. **Free user with 0 similar recipes**: Section should not render
2. **Free user with 1 similar recipe**: Show 1 card, no placeholders, no upgrade prompt
3. **Free user with 5 similar recipes**: Show 1 card + 3 placeholders + "See 4 more" upgrade prompt
4. **Pro user with 9 similar recipes**: Show all 9 cards, no upgrade prompt
5. **Recipe with no cuisine/ingredients**: Should handle gracefully (may show 0 similar)
6. **Clicking a similar recipe card**: Should navigate to that recipe's detail page

---

## Task 13: Final Commit

**Step 1: Create final commit if any fixes were needed**

```bash
git add -A
git commit -m "feat(similar-recipes): complete implementation

- Add similarity scoring via MongoDB aggregation (50% ingredients, 25% cuisine, 25% author)
- Plan tier limits: Free shows 1, Pro shows up to 9
- Horizontal scrollable carousel with blurred placeholders for free users
- Contextual upgrade prompt linking to billing page"
```
