"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface RecipeThumbnailProps {
  src: string | undefined;
  alt: string;
}

export function RecipeThumbnail({ src, alt }: RecipeThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-8">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="aspect-video relative rounded-lg overflow-hidden mb-8">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 896px) 100vw, 896px"
        priority
        onError={() => setImageError(true)}
      />
    </div>
  );
}
