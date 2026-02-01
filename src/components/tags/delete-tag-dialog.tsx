"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteTag } from "@/hooks/use-tags";
import { trackEvent } from "@/lib/tracking";
import type { Tag } from "@/types/tag";

interface DeleteTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag;
  onDeleted?: () => void;
}

export function DeleteTagDialog({
  open,
  onOpenChange,
  tag,
  onDeleted,
}: DeleteTagDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useDeleteTag();

  const handleDelete = async () => {
    setError(null);

    try {
      await deleteMutation.mutateAsync(tag._id!);
      trackEvent("tag_deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete tag");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Tag</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{tag.name}&quot;?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will remove the tag but your recipes will not be deleted. They
            will remain in your library.
          </p>
          {tag.recipeCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {tag.recipeCount} recipe
              {tag.recipeCount !== 1 ? "s" : ""} will have this tag removed.
            </p>
          )}
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
