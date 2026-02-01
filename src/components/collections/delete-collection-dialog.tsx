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
import { useDeleteCollection } from "@/hooks/use-collections";
import { trackEvent } from "@/lib/tracking";
import type { Collection } from "@/types/collection";

interface DeleteCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  onDeleted?: () => void;
}

export function DeleteCollectionDialog({
  open,
  onOpenChange,
  collection,
  onDeleted,
}: DeleteCollectionDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useDeleteCollection();

  const handleDelete = async () => {
    setError(null);

    try {
      await deleteMutation.mutateAsync(collection._id!);
      trackEvent("collection_deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete collection");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{collection.name}&quot;?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will remove the collection but your recipes will not be
            deleted. They will remain in your library.
          </p>
          {collection.recipeCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {collection.recipeCount} recipe
              {collection.recipeCount !== 1 ? "s" : ""} will be removed from
              this collection.
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
            {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
