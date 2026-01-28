"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface RecipeThumbnailProps {
  src: string | undefined;
  alt: string;
  recipeId?: string;
}

export function RecipeThumbnail({ src, alt, recipeId }: RecipeThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleImageError = useCallback(async () => {
    if (isRefreshing || imageError || !recipeId) {
      setImageError(true);
      return;
    }
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/refresh-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (res.ok) {
        const { thumbnailUrl } = await res.json();
        setCurrentSrc(thumbnailUrl);
      } else {
        setImageError(true);
      }
    } catch {
      setImageError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, imageError, recipeId]);

  if (!currentSrc || imageError) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-8">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="aspect-video relative rounded-lg overflow-hidden mb-8">
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 896px) 100vw, 896px"
        priority
        onError={handleImageError}
      />
    </div>
  );
}
