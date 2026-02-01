"use client";

import { cn } from "@/lib/utils";
import type { Tag } from "@/types/tag";

interface TagChipProps {
  tag: Tag;
  size?: "sm" | "md";
  className?: string;
}

export function TagChip({ tag, size = "sm", className }: TagChipProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        className,
      )}
    >
      #{tag.name}
    </span>
  );
}
