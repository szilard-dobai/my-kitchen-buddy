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
import { useUpdateTag } from "@/hooks/use-tags";
import type { Tag } from "@/types/tag";

const TAG_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag;
  onUpdated?: () => void;
}

export function EditTagDialog({
  open,
  onOpenChange,
  tag,
  onUpdated,
}: EditTagDialogProps) {
  const [name, setName] = useState(tag.name);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateTag();

  const hasChanges = name !== tag.name;
  const isValidName = name.length > 0 && TAG_NAME_REGEX.test(name);
  const canSave = isValidName && hasChanges && !updateMutation.isPending;

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    setName(sanitized);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setError(null);

    try {
      await updateMutation.mutateAsync({
        tagId: tag._id!,
        name,
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update tag");
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(tag.name);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>Update the name of your tag.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                #
              </span>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={30}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only
            </p>
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
