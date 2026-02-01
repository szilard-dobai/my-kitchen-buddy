"use client";

import { FolderPlus } from "lucide-react";
import { useMemo } from "react";
import { CollectionDropdown } from "@/components/collections/collection-dropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollections } from "@/hooks/use-collections";
import type { PlanTier } from "@/types/subscription";

interface RecipeCollectionButtonProps {
  recipeId: string;
  collectionIds: string[];
  planTier: PlanTier;
}

export function RecipeCollectionButton({
  recipeId,
  collectionIds,
  planTier,
}: RecipeCollectionButtonProps) {
  const { data: collections = [] } = useCollections();

  const recipeCollections = useMemo(
    () => collections.filter((c) => collectionIds.includes(c._id!)),
    [collections, collectionIds],
  );

  return (
    <div className="flex items-center gap-1.5">
      {recipeCollections.map((collection) => (
        <Tooltip key={collection._id}>
          <TooltipTrigger asChild>
            <span
              className="size-3 rounded-full shrink-0 cursor-default"
              style={{ backgroundColor: collection.color }}
            />
          </TooltipTrigger>
          <TooltipContent>{collection.name}</TooltipContent>
        </Tooltip>
      ))}
      <CollectionDropdown
        recipeId={recipeId}
        collections={collections}
        collectionIds={collectionIds}
        planTier={planTier}
        variant="inline"
      />
    </div>
  );
}
