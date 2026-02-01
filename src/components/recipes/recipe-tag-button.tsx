"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { TagChip } from "@/components/tags/tag-chip";
import { TagDropdown } from "@/components/tags/tag-dropdown";
import { useTags } from "@/hooks/use-tags";
import type { PlanTier } from "@/types/subscription";

interface RecipeTagButtonProps {
  recipeId: string;
  tagIds: string[];
  planTier: PlanTier;
  onTagChange?: (
    recipeId: string,
    tagId: string,
    action: "add" | "remove",
  ) => void;
}

export function RecipeTagButton({
  recipeId,
  tagIds,
  planTier,
  onTagChange,
}: RecipeTagButtonProps) {
  const { data: tags = [] } = useTags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localTagIds, setLocalTagIds] = useState<string[]>(tagIds);

  useEffect(() => {
    setLocalTagIds(tagIds);
  }, [tagIds]);

  const handleTagChange = (
    recipeId: string,
    tagId: string,
    action: "add" | "remove",
  ) => {
    if (action === "add") {
      setLocalTagIds((prev) => [...prev, tagId]);
    } else {
      setLocalTagIds((prev) => prev.filter((id) => id !== tagId));
    }
    onTagChange?.(recipeId, tagId, action);
  };

  const recipeTags = useMemo(
    () => tags.filter((t) => localTagIds.includes(t._id!)),
    [tags, localTagIds],
  );

  const hasTags = recipeTags.length > 0 || tags.length > 0;

  if (!hasTags) {
    return (
      <>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus className="size-3.5" />
          Add your first tag
        </button>
        <CreateTagDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          currentCount={0}
          planTier={planTier}
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {recipeTags.map((tag) => (
        <TagChip key={tag._id} tag={tag} />
      ))}
      <TagDropdown
        recipeId={recipeId}
        tags={tags}
        tagIds={localTagIds}
        planTier={planTier}
        variant="page"
        onTagChange={handleTagChange}
      />
    </div>
  );
}
