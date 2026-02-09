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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateCollection } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";
import { COLLECTION_COLORS } from "@/types/collection";
import type { Collection } from "@/types/collection";

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  onUpdated?: () => void;
}

export function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
  onUpdated,
}: EditCollectionDialogProps) {
  const [name, setName] = useState(collection.name);
  const [color, setColor] = useState(collection.color);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateCollection();

  const hasChanges = name !== collection.name || color !== collection.color;
  const canSave =
    name.trim().length > 0 && hasChanges && !updateMutation.isPending;

  const handleSave = async () => {
    if (!canSave) return;

    setError(null);

    try {
      await updateMutation.mutateAsync({
        collectionId: collection._id!,
        name: name.trim(),
        color,
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update collection");
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(collection.name);
      setColor(collection.color);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>
            Update the name or color of your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 rounded-full transition-all cursor-pointer",
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
