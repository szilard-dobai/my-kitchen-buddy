"use client";

import { Loader2, MoreHorizontal, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { DeleteTagDialog } from "@/components/tags/delete-tag-dialog";
import { EditTagDialog } from "@/components/tags/edit-tag-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAddRecipeToTag, useRemoveRecipeFromTag } from "@/hooks/use-tags";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/types/subscription";
import type { Tag as TagType } from "@/types/tag";

interface TagDropdownProps {
  recipeId: string;
  tags: TagType[];
  tagIds?: string[];
  planTier?: PlanTier;
  variant?: "card" | "page" | "inline";
  onTagChange?: (
    recipeId: string,
    tagId: string,
    action: "add" | "remove",
  ) => void;
}

export function TagDropdown({
  recipeId,
  tags,
  tagIds = [],
  planTier = "free",
  variant = "card",
  onTagChange,
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTagId, setLoadingTagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagType | null>(null);
  const [localTagIds, setLocalTagIds] = useState<string[]>(tagIds);

  const addMutation = useAddRecipeToTag();
  const removeMutation = useRemoveRecipeFromTag();

  const existingTagIds = useMemo(
    () => new Set(tags.map((t) => t._id)),
    [tags],
  );

  useEffect(() => {
    setLocalTagIds(tagIds);
  }, [tagIds]);

  const validLocalTagIds = useMemo(
    () => localTagIds.filter((id) => existingTagIds.has(id)),
    [localTagIds, existingTagIds],
  );

  const recipeTagIdsSet = new Set(validLocalTagIds);

  const handleToggle = async (tagId: string, isTagged: boolean) => {
    setLoadingTagId(tagId);

    if (isTagged) {
      setLocalTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      setLocalTagIds((prev) => [...prev, tagId]);
    }

    try {
      if (isTagged) {
        await removeMutation.mutateAsync({ tagId, recipeId });
        trackEvent("tag_removed_from_recipe");
        onTagChange?.(recipeId, tagId, "remove");
      } else {
        await addMutation.mutateAsync({ tagId, recipeId });
        trackEvent("tag_added_to_recipe");
        onTagChange?.(recipeId, tagId, "add");
      }
    } catch {
      if (isTagged) {
        setLocalTagIds((prev) => [...prev, tagId]);
      } else {
        setLocalTagIds((prev) => prev.filter((id) => id !== tagId));
      }
      toast.error("Failed to update tag");
    } finally {
      setLoadingTagId(null);
    }
  };

  const tagCount = recipeTagIdsSet.size;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {variant === "page" ? (
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer">
              <Plus className="size-3.5" />
              {tagCount > 0 ? "Edit tags" : "Add tags"}
            </button>
          ) : variant === "inline" ? (
            <button
              className="size-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-muted-foreground hover:bg-accent transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="size-3 text-muted-foreground" />
              <span className="sr-only">Add tag</span>
            </button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "size-8 shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                tagCount > 0 && "md:opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Tag className="size-4" />
              {tagCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] size-4 rounded-full flex items-center justify-center">
                  {tagCount}
                </span>
              )}
              <span className="sr-only">Add tag</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {tags.length === 0 ? (
            <div className="py-2 text-center">
              <p className="text-sm text-muted-foreground mb-2">No tags yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="size-4 mr-1" />
                Create tag
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {tags.map((tag) => {
                const isTagged = recipeTagIdsSet.has(tag._id!);
                const isLoadingThis = loadingTagId === tag._id;

                return (
                  <div
                    key={tag._id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group",
                      isLoadingThis && "opacity-50 pointer-events-none",
                    )}
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                      <Checkbox
                        checked={isTagged}
                        onCheckedChange={() => handleToggle(tag._id!, isTagged)}
                        disabled={isLoadingThis}
                        className="shrink-0"
                      />
                      <span className="truncate text-sm text-muted-foreground">
                        #{tag.name}
                      </span>
                    </label>
                    {isLoadingThis ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="size-6 flex items-center justify-center rounded hover:bg-accent-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <MoreHorizontal className="size-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => {
                              setIsOpen(false);
                              setEditingTag(tag);
                            }}
                          >
                            <Pencil className="size-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setIsOpen(false);
                              setDeletingTag(tag);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
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
                  Create tag
                </button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentCount={tags.length}
        planTier={planTier}
        onCreated={(tagId) => {
          handleToggle(tagId, false);
        }}
      />

      {editingTag && (
        <EditTagDialog
          open={!!editingTag}
          onOpenChange={(open) => !open && setEditingTag(null)}
          tag={editingTag}
        />
      )}

      {deletingTag && (
        <DeleteTagDialog
          open={!!deletingTag}
          onOpenChange={(open) => !open && setDeletingTag(null)}
          tag={deletingTag}
        />
      )}
    </>
  );
}
