import type { Recipe } from "@/types/recipe";

export type SortOption = "relevance" | "newest" | "oldest" | "alphabetical";

export type RecencyOption = "week" | "month" | "year" | "older";

export interface RecipeFilters {
  search: string;
  platforms: string[];
  creators: string[];
  difficulties: string[];
  recency: RecencyOption | null;
  cuisines: string[];
  collectionId: string | null;
}

export const DEFAULT_FILTERS: RecipeFilters = {
  search: "",
  platforms: [],
  creators: [],
  difficulties: [],
  recency: null,
  cuisines: [],
  collectionId: null,
};

export const DEFAULT_SORT: SortOption = "newest";

function matchesSearch(recipe: Recipe, searchTerm: string): boolean {
  if (!searchTerm) return true;

  const term = searchTerm.toLowerCase();

  if (recipe.title.toLowerCase().includes(term)) return true;
  if (recipe.description?.toLowerCase().includes(term)) return true;
  if (recipe.source.authorUsername?.toLowerCase().includes(term)) return true;

  for (const ingredient of recipe.ingredients) {
    if (ingredient.name.toLowerCase().includes(term)) return true;
  }

  return false;
}

function matchesPlatform(recipe: Recipe, platforms: string[]): boolean {
  if (platforms.length === 0) return true;
  return platforms.includes(recipe.source.platform);
}

function matchesCreator(recipe: Recipe, creators: string[]): boolean {
  if (creators.length === 0) return true;
  return creators.includes(recipe.source.authorUsername || "");
}

function matchesDifficulty(recipe: Recipe, difficulties: string[]): boolean {
  if (difficulties.length === 0) return true;
  return difficulties.includes(recipe.difficulty || "");
}

function matchesRecency(
  recipe: Recipe,
  recency: RecencyOption | null,
): boolean {
  if (!recency) return true;

  const createdAt = new Date(recipe.createdAt);
  const now = new Date();

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdAt.getTime()) / msPerDay,
  );

  switch (recency) {
    case "week":
      return daysSinceCreated <= 7;
    case "month":
      return daysSinceCreated <= 30;
    case "year":
      return daysSinceCreated <= 365;
    case "older":
      return daysSinceCreated > 365;
    default:
      return true;
  }
}

function matchesCuisine(recipe: Recipe, cuisines: string[]): boolean {
  if (cuisines.length === 0) return true;
  return cuisines.includes(recipe.cuisineType || "");
}

function matchesCollection(
  recipe: Recipe,
  collectionId: string | null,
): boolean {
  if (!collectionId) return true;
  return recipe.collectionIds.includes(collectionId);
}

export function filterRecipes<T extends Recipe>(
  recipes: T[],
  filters: RecipeFilters,
): T[] {
  return recipes.filter((recipe) => {
    if (!matchesSearch(recipe, filters.search)) return false;
    if (!matchesPlatform(recipe, filters.platforms)) return false;
    if (!matchesCreator(recipe, filters.creators)) return false;
    if (!matchesDifficulty(recipe, filters.difficulties)) return false;
    if (!matchesRecency(recipe, filters.recency)) return false;
    if (!matchesCuisine(recipe, filters.cuisines)) return false;
    if (!matchesCollection(recipe, filters.collectionId)) return false;
    return true;
  });
}

function calculateRelevanceScore(recipe: Recipe, searchTerm: string): number {
  if (!searchTerm) return 0;

  const term = searchTerm.toLowerCase();
  let score = 0;

  if (recipe.title.toLowerCase().includes(term)) {
    score += recipe.title.toLowerCase() === term ? 100 : 50;
  }

  if (recipe.source.authorUsername?.toLowerCase().includes(term)) {
    score += 30;
  }

  if (recipe.description?.toLowerCase().includes(term)) {
    score += 20;
  }

  for (const ingredient of recipe.ingredients) {
    if (ingredient.name.toLowerCase().includes(term)) {
      score += 10;
    }
  }

  return score;
}

export function sortRecipes<T extends Recipe>(
  recipes: T[],
  sortBy: SortOption,
  searchTerm: string = "",
): T[] {
  const sorted = [...recipes];

  switch (sortBy) {
    case "relevance":
      if (searchTerm) {
        sorted.sort(
          (a, b) =>
            calculateRelevanceScore(b, searchTerm) -
            calculateRelevanceScore(a, searchTerm),
        );
      } else {
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case "alphabetical":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  return sorted;
}

export interface CreatorOption {
  username: string;
  avatarUrl?: string;
  authorId?: string;
}

export function extractFilterOptions(recipes: Recipe[]) {
  const platforms = new Set<string>();
  const creators = new Map<string, CreatorOption>();
  const cuisines = new Set<string>();

  for (const recipe of recipes) {
    platforms.add(recipe.source.platform);

    if (recipe.source.authorUsername) {
      if (!creators.has(recipe.source.authorUsername)) {
        creators.set(recipe.source.authorUsername, {
          username: recipe.source.authorUsername,
          avatarUrl: recipe.source.authorAvatarUrl,
          authorId: recipe.source.authorId,
        });
      }
    }

    if (recipe.cuisineType) {
      cuisines.add(recipe.cuisineType);
    }
  }

  return {
    platforms: Array.from(platforms).sort(),
    creators: Array.from(creators.values()).sort((a, b) =>
      a.username.localeCompare(b.username),
    ),
    cuisines: Array.from(cuisines).sort(),
  };
}

export function hasActiveFilters(filters: RecipeFilters): boolean {
  return (
    filters.search !== "" ||
    filters.platforms.length > 0 ||
    filters.creators.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.recency !== null ||
    filters.cuisines.length > 0 ||
    filters.collectionId !== null
  );
}

export function countActiveFilters(filters: RecipeFilters): number {
  let count = 0;
  if (filters.search) count++;
  count += filters.platforms.length;
  count += filters.creators.length;
  count += filters.difficulties.length;
  if (filters.recency) count++;
  count += filters.cuisines.length;
  if (filters.collectionId) count++;
  return count;
}
