"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SimilarRecipesResponse } from "@/types/recipe";
import type { PlanTier } from "@/types/subscription";
import { SimilarRecipeCard } from "./similar-recipe-card";
import { SimilarRecipePlaceholder } from "./similar-recipe-placeholder";

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
