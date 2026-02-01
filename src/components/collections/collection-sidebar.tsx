"use client";

import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Folders,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useSyncExternalStore, useState } from "react";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import type { PlanTier } from "@/types/subscription";

const STORAGE_KEY = "collection-sidebar-collapsed";

export function useCollapsedState() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }, []);

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface CollectionSidebarProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  onCollectionDeleted?: (collectionId: string) => void;
  totalRecipeCount: number;
  planTier: PlanTier;
}

export function CollectionSidebar({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCollectionDeleted,
  totalRecipeCount,
  planTier,
}: CollectionSidebarProps) {
  const isCollapsed = useCollapsedState();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] =
    useState<Collection | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    localStorage.setItem(STORAGE_KEY, String(newValue));
    window.dispatchEvent(new StorageEvent("storage"));
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-col items-center gap-1 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={toggleCollapsed}
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="size-4" />
                <span className="sr-only">Create collection</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New collection</TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectCollection(null)}
              className={cn(
                "size-8 flex items-center justify-center rounded-md transition-colors cursor-pointer",
                selectedCollectionId === null
                  ? "bg-accent"
                  : "hover:bg-accent/50",
              )}
            >
              <FolderOpen className="size-4 text-muted-foreground" />
              <span className="sr-only">All Recipes</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            All Recipes ({totalRecipeCount})
          </TooltipContent>
        </Tooltip>

        {collections.map((collection) => (
          <Tooltip key={collection._id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectCollection(collection._id!)}
                className={cn(
                  "size-8 flex items-center justify-center rounded-md transition-colors cursor-pointer",
                  selectedCollectionId === collection._id
                    ? "bg-accent"
                    : "hover:bg-accent/50",
                )}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: collection.color }}
                />
                <span className="sr-only">{collection.name}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collection.name} ({collection.recipeCount})
            </TooltipContent>
          </Tooltip>
        ))}

        <CreateCollectionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          currentCount={collections.length}
          planTier={planTier}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Folders className="size-4" />
          Collections
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            <span className="sr-only">Create collection</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={toggleCollapsed}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        </div>
      </div>

      <button
        onClick={() => onSelectCollection(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-pointer",
          selectedCollectionId === null
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50",
        )}
      >
        <FolderOpen className="size-4 text-muted-foreground" />
        <span className="flex-1">All Recipes</span>
        <span className="text-xs text-muted-foreground">{totalRecipeCount}</span>
      </button>

      {collections.map((collection) => (
        <div
          key={collection._id}
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
            selectedCollectionId === collection._id
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50",
          )}
        >
          <button
            onClick={() => onSelectCollection(collection._id!)}
            className="flex-1 flex items-center gap-2 text-left min-w-0 cursor-pointer"
          >
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: collection.color }}
            />
            <span className="truncate">{collection.name}</span>
          </button>
          <span className="text-xs text-muted-foreground shrink-0">
            {collection.recipeCount}
          </span>
          <Popover
            open={openMenuId === collection._id}
            onOpenChange={(open) => setOpenMenuId(open ? collection._id! : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Collection options</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <button
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer"
                onClick={() => {
                  setOpenMenuId(null);
                  setEditingCollection(collection);
                }}
              >
                <Pencil className="size-4" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent text-destructive cursor-pointer"
                onClick={() => {
                  setOpenMenuId(null);
                  setDeletingCollection(collection);
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </PopoverContent>
          </Popover>
        </div>
      ))}

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentCount={collections.length}
        planTier={planTier}
      />

      {editingCollection && (
        <EditCollectionDialog
          open={!!editingCollection}
          onOpenChange={(open) => !open && setEditingCollection(null)}
          collection={editingCollection}
        />
      )}

      {deletingCollection && (
        <DeleteCollectionDialog
          open={!!deletingCollection}
          onOpenChange={(open) => !open && setDeletingCollection(null)}
          collection={deletingCollection}
          onDeleted={() => {
            const deletedId = deletingCollection._id!;
            setDeletingCollection(null);
            if (selectedCollectionId === deletedId) {
              onSelectCollection(null);
            }
            onCollectionDeleted?.(deletedId);
          }}
        />
      )}
    </div>
  );
}
