"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AuthorAvatar } from "@/components/recipes/author-avatar";
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
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-2 right-2">
          <AuthorAvatar
            src={recipe.authorAvatarUrl}
            alt={recipe.authorUsername || "Author"}
            authorId={recipe.authorId}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
            {recipe.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
