"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
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
import { useCreateCollection } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";
import {
  COLLECTION_COLORS,
  COLLECTION_LIMITS,
  DEFAULT_COLLECTION_COLOR,
} from "@/types/collection";
import type { PlanTier } from "@/types/subscription";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  currentCount: number;
  planTier: PlanTier;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreated,
  currentCount,
  planTier,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLLECTION_COLOR);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCollection();

  const limit = COLLECTION_LIMITS[planTier];
  const atLimit = currentCount >= limit;
  const canCreate = name.trim().length > 0 && !atLimit && !createMutation.isPending;

  const handleCreate = async () => {
    if (!canCreate) return;

    setError(null);

    try {
      await createMutation.mutateAsync({ name: name.trim(), color });
      setName("");
      setColor(DEFAULT_COLLECTION_COLOR);
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create collection");
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setColor(DEFAULT_COLLECTION_COLOR);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Organize your recipes into collections for easy access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weeknight Dinners"
              maxLength={50}
              disabled={atLimit}
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
                  disabled={atLimit}
                  className={cn(
                    "size-8 rounded-full transition-all cursor-pointer",
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110",
                    atLimit && "opacity-50 cursor-not-allowed",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {atLimit && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-3 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Collection limit reached ({currentCount}/{limit})
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                <Link
                  href="/settings?tab=billing"
                  className="underline hover:no-underline"
                >
                  Upgrade to Pro
                </Link>{" "}
                for unlimited collections.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
