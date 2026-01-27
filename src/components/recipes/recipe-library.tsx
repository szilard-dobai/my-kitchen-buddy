"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import {
  ActiveFilterChips,
  RecipeFiltersDesktop,
  RecipeFiltersMobile,
} from "@/components/recipes/recipe-filters";
import { RecipeSearch } from "@/components/recipes/recipe-search";
import { RecipeSort } from "@/components/recipes/recipe-sort";
import { Button } from "@/components/ui/button";
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
import type { Recipe } from "@/types/recipe";

interface RecipeLibraryProps {
  recipes: Recipe[];
}

export function RecipeLibrary({ recipes }: RecipeLibraryProps) {
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);

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
    <div className="space-y-4">
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
          />
          <RecipeFiltersMobile
            filters={filters}
            onChange={setFilters}
            options={filterOptions}
            activeCount={activeFilterCount}
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

      <ActiveFilterChips filters={filters} onChange={setFilters} />

      <div className="text-muted-foreground text-sm">
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
          <p className="mb-4">No recipes match your search.</p>
          <p>Try different keywords or clear some filters.</p>
          <Button variant="outline" onClick={handleReset} className="mt-4">
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
