"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface AuthorAvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md";
  authorId?: string;
}

const sizeConfig = {
  sm: { container: "size-6", icon: "size-3.5", pixels: 24 },
  md: { container: "size-8", icon: "size-4", pixels: 32 },
};

export function AuthorAvatar({
  src,
  alt,
  size = "sm",
  authorId,
}: AuthorAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const config = sizeConfig[size];

  const handleError = useCallback(async () => {
    if (!authorId || isRefreshing) {
      setImageError(true);
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await fetch("/api/refresh-author-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.avatarUrl) {
          setCurrentSrc(data.avatarUrl);
          setImageError(false);
          setIsRefreshing(false);
          return;
        }
      }
    } catch {
      // Refresh failed, show fallback
    }

    setImageError(true);
    setIsRefreshing(false);
  }, [authorId, isRefreshing]);

  if (!currentSrc || imageError) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center",
          config.container,
        )}
      >
        <User className={cn("text-muted-foreground", config.icon)} />
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={config.pixels}
      height={config.pixels}
      className="rounded-full"
      onError={handleError}
    />
  );
}
