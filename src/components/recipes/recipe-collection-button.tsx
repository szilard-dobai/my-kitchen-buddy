"use client";

import { useEffect, useMemo, useState } from "react";
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
  onCollectionChange?: (
    recipeId: string,
    collectionId: string,
    action: "add" | "remove",
  ) => void;
}

export function RecipeCollectionButton({
  recipeId,
  collectionIds,
  planTier,
  onCollectionChange,
}: RecipeCollectionButtonProps) {
  const { data: collections = [] } = useCollections();
  const [localCollectionIds, setLocalCollectionIds] =
    useState<string[]>(collectionIds);

  useEffect(() => {
    setLocalCollectionIds(collectionIds);
  }, [collectionIds]);

  const handleCollectionChange = (
    recipeId: string,
    collectionId: string,
    action: "add" | "remove",
  ) => {
    if (action === "add") {
      setLocalCollectionIds((prev) => [...prev, collectionId]);
    } else {
      setLocalCollectionIds((prev) => prev.filter((id) => id !== collectionId));
    }
    onCollectionChange?.(recipeId, collectionId, action);
  };

  const recipeCollections = useMemo(
    () => collections.filter((c) => localCollectionIds.includes(c._id!)),
    [collections, localCollectionIds],
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
        collectionIds={localCollectionIds}
        planTier={planTier}
        variant="inline"
        onCollectionChange={handleCollectionChange}
      />
    </div>
  );
}
