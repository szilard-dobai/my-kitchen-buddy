"use client";

import { Clock, Flame, Users, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { CollectionDropdown } from "@/components/collections/collection-dropdown";
import { TagChip } from "@/components/tags/tag-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DietaryTag } from "@/components/ui/dietary-tag";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { trackEvent } from "@/lib/tracking";
import type { Collection } from "@/types/collection";
import type { Recipe } from "@/types/recipe";
import type { Tag } from "@/types/tag";

interface RecipeCardProps {
  recipe: Recipe;
  collections?: Collection[];
  tags?: Tag[];
  onCollectionChange?: (
    recipeId: string,
    collectionId: string,
    action: "add" | "remove",
  ) => void;
}

export function RecipeCard({
  recipe,
  collections,
  tags,
  onCollectionChange,
}: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState(
    recipe.source.thumbnailUrl,
  );
  const calories =
    recipe.nutrition?.perServing?.calories || recipe.caloriesPerServing;

  const handleImageError = useCallback(async () => {
    if (isRefreshing || imageError) return;
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/refresh-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe._id }),
      });

      if (res.ok) {
        const { thumbnailUrl } = await res.json();
        setCurrentThumbnail(thumbnailUrl);
      } else {
        setImageError(true);
      }
    } catch {
      setImageError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, imageError, recipe._id]);

  return (
    <div className="group relative">
      <Link
        href={`/recipes/${recipe._id}`}
        onClick={() => trackEvent("recipe_card_click", { recipeId: recipe._id })}
      >
        <Card className="h-full card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden">
          <div className="aspect-video bg-muted relative">
            {currentThumbnail && !imageError ? (
              <Image
                src={currentThumbnail}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={handleImageError}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {recipe.title}
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <PlatformBadge platform={recipe.source.platform} />
              {recipe.difficulty && (
                <DifficultyBadge
                  difficulty={recipe.difficulty as "Easy" | "Medium" | "Hard"}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {recipe.description}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {recipe.totalTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.totalTime}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings}
                </span>
              )}
              {recipe.ingredients.length > 0 && (
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  {recipe.ingredients.length} ingredients
                </span>
              )}
              {calories && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" />
                  {calories} cal
                </span>
              )}
            </div>
            {recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {recipe.dietaryTags.slice(0, 3).map((tag) => (
                  <DietaryTag key={tag} tag={tag} />
                ))}
                {recipe.dietaryTags.length > 3 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{recipe.dietaryTags.length - 3} more
                  </span>
                )}
              </div>
            )}
            {tags && recipe.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.tagIds.slice(0, 3).map((tagId) => {
                  const tag = tags.find((t) => t._id === tagId);
                  if (!tag) return null;
                  return <TagChip key={tagId} tag={tag} />;
                })}
                {recipe.tagIds.length > 3 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{recipe.tagIds.length - 3} more
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {collections && (
        <div className="absolute top-2 right-2 z-10">
          <CollectionDropdown
            recipeId={recipe._id!}
            collections={collections}
            collectionIds={recipe.collectionIds}
            onCollectionChange={onCollectionChange}
          />
        </div>
      )}
    </div>
  );
}
