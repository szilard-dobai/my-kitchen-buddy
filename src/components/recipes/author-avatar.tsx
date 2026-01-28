"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AuthorAvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md";
}

const sizeConfig = {
  sm: { container: "size-6", icon: "size-3.5", pixels: 24 },
  md: { container: "size-8", icon: "size-4", pixels: 32 },
};

export function AuthorAvatar({ src, alt, size = "sm" }: AuthorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const config = sizeConfig[size];

  if (!src || imageError) {
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
      src={src}
      alt={alt}
      width={config.pixels}
      height={config.pixels}
      className="rounded-full"
      onError={() => setImageError(true)}
    />
  );
}
