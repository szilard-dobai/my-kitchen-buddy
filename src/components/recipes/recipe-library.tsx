"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CollectionSidebar,
  useCollapsedState,
} from "@/components/collections/collection-sidebar";
import { RecipeCard } from "@/components/recipes/recipe-card";
import {
  ActiveFilterChips,
  RecipeFiltersDesktop,
  RecipeFiltersMobile,
} from "@/components/recipes/recipe-filters";
import { RecipeSearch } from "@/components/recipes/recipe-search";
import { RecipeSort } from "@/components/recipes/recipe-sort";
import { Button } from "@/components/ui/button";
import { MilestonePromptTrigger } from "@/components/upgrade/milestone-prompt-trigger";
import { useCollections } from "@/hooks/use-collections";
import { useTags } from "@/hooks/use-tags";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  extractFilterOptions,
  filterRecipes,
  hasActiveFilters,
  sortRecipes,
} from "@/lib/recipe-filters";
import type { RecipeFilters, SortOption } from "@/lib/recipe-filters";
import { trackEvent } from "@/lib/tracking";
import type { Collection } from "@/types/collection";
import type { Recipe } from "@/types/recipe";
import type { PlanTier } from "@/types/subscription";
import type { Tag } from "@/types/tag";

interface RecipeLibraryProps {
  initialRecipes: Recipe[];
  initialCollections: Collection[];
  initialTags: Tag[];
  planTier: PlanTier;
}

export function RecipeLibrary({
  initialRecipes,
  initialCollections,
  initialTags,
  planTier,
}: RecipeLibraryProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);

  const { data: collections = initialCollections } = useCollections();
  const { data: tags = initialTags } = useTags();

  const handleCollectionChange = (
    recipeId: string,
    collectionId: string,
    action: "add" | "remove",
  ) => {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe._id !== recipeId) return recipe;
        return {
          ...recipe,
          collectionIds:
            action === "add"
              ? [...recipe.collectionIds, collectionId]
              : recipe.collectionIds.filter((id) => id !== collectionId),
        };
      }),
    );
  };

  const handleCollectionDeleted = (collectionId: string) => {
    setRecipes((prev) =>
      prev.map((recipe) => ({
        ...recipe,
        collectionIds: recipe.collectionIds.filter((id) => id !== collectionId),
      })),
    );
  };

  const handleAuthorAvatarRefresh = (authorId: string, newAvatarUrl: string) => {
    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.source.authorId !== authorId) return recipe;
        return {
          ...recipe,
          source: {
            ...recipe.source,
            authorAvatarUrl: newAvatarUrl,
          },
        };
      }),
    );
  };

  const isSidebarCollapsed = useCollapsedState();

  const handleSelectCollection = (collectionId: string | null) => {
    setFilters({ ...filters, collectionId });
    trackEvent("collection_selected", { collectionId: collectionId || "all" });
  };

  const filterOptions = useMemo(() => extractFilterOptions(recipes), [recipes]);

  const filteredRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, filters);
    return sortRecipes(filtered, sort, filters.search);
  }, [recipes, filters, sort]);

  const activeFilterCount = countActiveFilters(filters);
  const hasFilters = hasActiveFilters(filters);
  const isNotDefault = hasFilters || sort !== DEFAULT_SORT;

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
    trackEvent("filters_cleared");
  };

  const selectedCollection = filters.collectionId
    ? collections.find((c) => c._id === filters.collectionId)
    : null;

  if (recipes.length === 0) {
    return (
      <div className="text-muted-foreground py-16 text-center">
        <p className="mb-4">No recipes yet.</p>
        <p>
          <Link href="/extract" className="text-primary hover:underline">
            Extract your first recipe
          </Link>{" "}
          from a social media video.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <MilestonePromptTrigger recipeCount={recipes.length} planTier={planTier} />
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          isSidebarCollapsed ? "w-10" : "w-[180px]"
        }`}
      >
        <CollectionSidebar
          collections={collections}
          selectedCollectionId={filters.collectionId}
          onSelectCollection={handleSelectCollection}
          onCollectionDeleted={handleCollectionDeleted}
          totalRecipeCount={recipes.length}
          planTier={planTier}
        />
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <RecipeSearch
            value={filters.search}
            onChange={(search) => setFilters({ ...filters, search })}
            className="xl:w-80"
          />

          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <RecipeFiltersDesktop
              filters={filters}
              onChange={setFilters}
              options={filterOptions}
              activeCount={activeFilterCount}
              tags={tags}
              planTier={planTier}
              onAuthorAvatarRefresh={handleAuthorAvatarRefresh}
            />
            <RecipeFiltersMobile
              filters={filters}
              onChange={setFilters}
              options={filterOptions}
              activeCount={activeFilterCount}
              collections={collections}
              selectedCollectionId={filters.collectionId}
              onSelectCollection={handleSelectCollection}
              totalRecipeCount={recipes.length}
              tags={tags}
              planTier={planTier}
              onAuthorAvatarRefresh={handleAuthorAvatarRefresh}
            />

            <div className="flex items-center gap-2">
              {isNotDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  Reset
                </Button>
              )}
              <RecipeSort
                value={sort}
                onChange={setSort}
                hasSearch={!!filters.search}
              />
            </div>
          </div>
        </div>

        <ActiveFilterChips filters={filters} onChange={setFilters} tags={tags} />

        <div className="text-muted-foreground text-sm">
          {selectedCollection && (
            <span className="mr-1">
              In &quot;{selectedCollection.name}&quot;:
            </span>
          )}
          {filters.search ? (
            <span>
              {filteredRecipes.length} result
              {filteredRecipes.length !== 1 ? "s" : ""} for &quot;{filters.search}
              &quot;
            </span>
          ) : (
            <span>
              Showing {filteredRecipes.length} recipe
              {filteredRecipes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center">
            {selectedCollection ? (
              <>
                <p className="mb-4">No recipes in this collection yet.</p>
                <p>Add recipes to this collection from your library.</p>
                <Button
                  variant="outline"
                  onClick={() => handleSelectCollection(null)}
                  className="mt-4"
                >
                  View all recipes
                </Button>
              </>
            ) : (
              <>
                <p className="mb-4">No recipes match your search.</p>
                <p>Try different keywords or clear some filters.</p>
                <Button variant="outline" onClick={handleReset} className="mt-4">
                  Clear all filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                collections={collections}
                tags={tags}
                onCollectionChange={handleCollectionChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
