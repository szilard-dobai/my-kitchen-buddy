# Similar Recipes Feature Design

## Overview

Add a "Similar Recipes" section to the recipe detail page showing other saved recipes that are similar based on ingredients, cuisine, and author. Free users see 1 recipe with blurred placeholders for the rest; Pro users see up to 9.

## API Layer

### Endpoint

`GET /api/recipes/[id]/similar`

### Similarity Algorithm (MongoDB Aggregation)

Computed `similarityScore` with weighted factors:

- **Ingredient overlap (50%)**: Count matching ingredient names (normalized, case-insensitive) divided by total unique ingredients across both recipes
- **Cuisine match (25%)**: 1.0 if same `cuisineType`, else 0
- **Author match (25%)**: 1.0 if same `source.authorId`, else 0

Pipeline steps:

1. Fetch the source recipe's `cuisineType`, `ingredients[].name`, and `source.authorId`
2. Run aggregation on user's other recipes with computed `similarityScore`
3. Filter out recipes with score below 0.1 (avoid showing unrelated recipes)
4. Sort by `similarityScore` descending
5. Limit based on plan tier: 1 for free, 9 for pro

### Response Shape

```typescript
interface SimilarRecipe {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  authorAvatarUrl?: string;
  authorUsername?: string;
}

interface SimilarRecipesResponse {
  recipes: SimilarRecipe[];
  hasMore: boolean;      // true if free user and more matches exist (up to 9)
  totalSimilar: number;  // total similar recipes found (capped at 9)
}
```

### Cross-Language Matching

Ingredient matching is language-dependent. "chicken" won't match "pollo". This is acceptable for v1 - multilingual ingredient normalization would require changes to the extraction pipeline.

## UI Layer

### Component: `SimilarRecipesSection`

Horizontal scrollable carousel on the recipe detail page.

- CSS `overflow-x: auto` with snap points
- Section heading: "Similar Recipes"
- Hidden entirely if no similar recipes found

### Card Design: `SimilarRecipeCard`

Square aspect ratio cards:

- Recipe thumbnail as full-bleed background
- Dark gradient overlay at bottom for text readability
- Recipe title at bottom (1-2 lines, truncated)
- Author avatar bubble in top-right corner (~24px circle)

### Free User Experience

- First card shown clearly
- If `hasMore === true`: show `totalSimilar - 1` blurred placeholder cards
- Placeholder cards have:
  - Blurred/placeholder background image
  - Blurred avatar circle
  - Squiggly lines (skeleton) for title
- Upgrade prompt overlay: "Upgrade to Pro to see X more similar recipes" linking to `/settings?tab=billing`

### Pro User Experience

- All similar recipes shown (up to 9)
- Clean horizontal scroll, no upgrade prompts

### Empty State

Section not rendered if no similar recipes found.

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/types/recipe.ts` | Add `SimilarRecipe` and `SimilarRecipesResponse` types |
| `src/models/recipe.ts` | Add `getSimilarRecipes(recipeId, userId, limit)` function |
| `src/app/api/recipes/[id]/similar/route.ts` | New API route |
| `src/components/recipes/similar-recipes-section.tsx` | New carousel component |
| `src/components/recipes/similar-recipe-card.tsx` | Square card component |
| `src/components/recipes/similar-recipe-placeholder.tsx` | Blurred placeholder card |
| `src/app/(dashboard)/recipes/[id]/page.tsx` | Add `SimilarRecipesSection` |

## Database

No new collections needed. Similarity is computed on the fly from existing recipe data.

## Plan Tier Limits

| Tier | Visible Recipes |
|------|-----------------|
| Free | 1 |
| Pro | 9 |
