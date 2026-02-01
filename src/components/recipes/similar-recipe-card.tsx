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
