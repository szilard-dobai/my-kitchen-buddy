"use client";

import { FolderPlus, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useAddRecipeToCollection,
  useRemoveRecipeFromCollection,
} from "@/hooks/use-collections";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import type { PlanTier } from "@/types/subscription";

interface CollectionDropdownProps {
  recipeId: string;
  collections: Collection[];
  collectionIds?: string[];
  planTier?: PlanTier;
  variant?: "card" | "page" | "inline";
  onCollectionChange?: (
    recipeId: string,
    collectionId: string,
    action: "add" | "remove",
  ) => void;
}

export function CollectionDropdown({
  recipeId,
  collections,
  collectionIds = [],
  planTier = "free",
  variant = "card",
  onCollectionChange,
}: CollectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(
    null,
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localCollectionIds, setLocalCollectionIds] =
    useState<string[]>(collectionIds);

  const addMutation = useAddRecipeToCollection();
  const removeMutation = useRemoveRecipeFromCollection();

  const existingCollectionIds = useMemo(
    () => new Set(collections.map((c) => c._id)),
    [collections],
  );

  useEffect(() => {
    setLocalCollectionIds(collectionIds);
  }, [collectionIds]);

  const validLocalCollectionIds = useMemo(
    () => localCollectionIds.filter((id) => existingCollectionIds.has(id)),
    [localCollectionIds, existingCollectionIds],
  );

  const recipeCollectionIdsSet = new Set(validLocalCollectionIds);

  const handleToggle = async (
    collectionId: string,
    isInCollection: boolean,
  ) => {
    setLoadingCollectionId(collectionId);

    // Optimistic update
    if (isInCollection) {
      setLocalCollectionIds((prev) => prev.filter((id) => id !== collectionId));
    } else {
      setLocalCollectionIds((prev) => [...prev, collectionId]);
    }

    try {
      if (isInCollection) {
        await removeMutation.mutateAsync({ collectionId, recipeId });
        trackEvent("recipe_removed_from_collection");
        onCollectionChange?.(recipeId, collectionId, "remove");
      } else {
        await addMutation.mutateAsync({ collectionId, recipeId });
        trackEvent("recipe_added_to_collection");
        onCollectionChange?.(recipeId, collectionId, "add");
      }
    } catch {
      // Revert optimistic update on error
      if (isInCollection) {
        setLocalCollectionIds((prev) => [...prev, collectionId]);
      } else {
        setLocalCollectionIds((prev) =>
          prev.filter((id) => id !== collectionId),
        );
      }
      toast.error("Failed to update collection");
    } finally {
      setLoadingCollectionId(null);
    }
  };

  const inCollectionCount = recipeCollectionIdsSet.size;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {variant === "page" ? (
            <Button variant="outline" size="sm" className="gap-2">
              <FolderPlus className="size-4" />
              {inCollectionCount > 0 ? (
                <span>
                  In {inCollectionCount} collection
                  {inCollectionCount !== 1 ? "s" : ""}
                </span>
              ) : (
                <span>Add to collection</span>
              )}
            </Button>
          ) : variant === "inline" ? (
            <button
              className="size-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-muted-foreground hover:bg-accent transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="size-3 text-muted-foreground" />
              <span className="sr-only">Add to collection</span>
            </button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "size-8 shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                inCollectionCount > 0 && "md:opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <FolderPlus className="size-4" />
              {inCollectionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] size-4 rounded-full flex items-center justify-center">
                  {inCollectionCount}
                </span>
              )}
              <span className="sr-only">Add to collection</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-56 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {collections.length === 0 ? (
            <div className="py-2 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No collections yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="size-4 mr-1" />
                Create collection
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => {
                const isInCollection = recipeCollectionIdsSet.has(
                  collection._id!,
                );
                const isLoadingThis = loadingCollectionId === collection._id;

                return (
                  <label
                    key={collection._id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                      isLoadingThis && "opacity-50 pointer-events-none",
                    )}
                  >
                    <Checkbox
                      checked={isInCollection}
                      onCheckedChange={() =>
                        handleToggle(collection._id!, isInCollection)
                      }
                      disabled={isLoadingThis}
                    />
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: collection.color }}
                    />
                    <span className="truncate text-sm flex-1">
                      {collection.name}
                    </span>
                    {isLoadingThis && (
                      <Loader2 className="size-3 animate-spin" />
                    )}
                  </label>
                );
              })}
              <div className="border-t mt-2 pt-2">
                <button
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Create collection
                </button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentCount={collections.length}
        planTier={planTier}
        onCreated={(collectionId) => {
          handleToggle(collectionId, false);
        }}
      />
    </>
  );
}
